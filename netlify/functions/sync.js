// Sincronización AUTOMÁTICA con football-data.org (programada por cron en netlify.toml).
// Una sola llamada a /competitions/WC/matches trae fase de grupos, eliminatoria y
// resultados, con fase, grupo y local/visitante explícitos. Escribe en RTDB con el
// Admin SDK. No requiere intervención humana.
//
// Variables de entorno:
//   FOOTBALLDATA_TOKEN  -> token de football-data.org (gratuito)
//   FOOTBALLDATA_COMP   -> código de competición (por defecto "WC")
const { getAdmin } = require("./_lib/admin");
const { esTeam } = require("./_lib/teams");
const ORDER = require("./_lib/order"); // orden canónico (de fábrica) por jornada

const enc = (k) => k.replace(/:/g, "_");
const parse = (v) => { try { return typeof v === "string" ? JSON.parse(v) : v; } catch (e) { return null; } };
const isSpain = (m) => /españa/i.test(m.home) || /españa/i.test(m.away);

// Fase de football-data -> índice de ROUNDS del cliente.
// 0=dieciseisavos(LAST_32) 1=octavos(LAST_16) 2=cuartos 3=semis 4=final
const KO_STAGE = { LAST_32: 0, LAST_16: 1, QUARTER_FINALS: 2, SEMI_FINALS: 3, FINAL: 4 };

async function fetchMatches() {
  const token = process.env.FOOTBALLDATA_TOKEN;
  if (!token) throw new Error("Falta FOOTBALLDATA_TOKEN");
  const comp = process.env.FOOTBALLDATA_COMP || "WC";
  const url = `https://api.football-data.org/v4/competitions/${comp}/matches`;
  const res = await fetch(url, { headers: { "X-Auth-Token": token } });
  if (!res.ok) throw new Error("football-data " + res.status);
  const data = await res.json();
  return data.matches || [];
}

// Escribe solo si el valor cambió, para no disparar repintados innecesarios.
async function setIfChanged(db, key, valObj) {
  const ref = db.ref("quiniela/" + enc(key));
  const next = JSON.stringify(valObj);
  const cur = (await ref.get()).val();
  if (cur === next) return false;
  await ref.set(next);
  return true;
}

const groupLetter = (g) => (g ? String(g).replace(/^GROUP[_\s]?/i, "").trim() : "");
const resultOf = (m) => m.status === "FINISHED" && m.score && m.score.fullTime &&
  m.score.fullTime.home != null && m.score.fullTime.away != null
  ? `${m.score.fullTime.home}-${m.score.fullTime.away}` : "";

exports.handler = async () => {
  const admin = getAdmin();
  const db = admin.database();

  let matches;
  try { matches = await fetchMatches(); }
  catch (e) { return { statusCode: 502, body: "sync error: " + e.message }; }

  // --- Fase de grupos: agrupar por jornada (matchday), conservando ediciones del organizador ---
  const existingJ = parse((await db.ref("quiniela/jornadas").get()).val()) || [];
  const prevByClave = {};
  existingJ.forEach((j) => { prevByClave[j.clave] = j; });

  const byClave = {};
  for (const m of matches) {
    if (m.stage !== "GROUP_STAGE" || !m.matchday) continue;
    const clave = "J" + m.matchday;
    const home = esTeam(m.homeTeam.name);
    const away = esTeam(m.awayTeam.name);
    if (!byClave[clave]) byClave[clave] = { clave, name: "Jornada " + m.matchday, matches: [] };
    byClave[clave].matches.push({
      group: groupLetter(m.group) + m.matchday,
      home, away, result: resultOf(m), _date: m.utcDate,
    });
  }

  const jornadas = Object.keys(byClave).sort().map((clave) => {
    const prev = prevByClave[clave] || {};
    const prevMatchByKey = {};
    (prev.matches || []).forEach((m) => { prevMatchByKey[m.home + "|" + m.away] = m; });
    const syncedByKey = {};
    byClave[clave].matches.forEach((m) => { syncedByKey[m.home + "|" + m.away] = m; });

    const build = (m) => {
      const pm = prevMatchByKey[m.home + "|" + m.away] || {};
      return {
        group: m.group || pm.group || "",
        home: m.home,
        away: m.away,
        // España siempre exacto; conserva el "partido de la jornada" elegido por el organizador.
        exact: isSpain(m) || !!pm.exact,
        tag: isSpain(m) ? "espana" : (pm.tag || ""),
        result: m.result || pm.result || "",
      };
    };

    // IMPORTANTE: los pronósticos se guardan por POSICIÓN. Hay que mantener el orden
    // canónico (de fábrica); NUNCA reordenar por fecha o se descuadra la puntuación.
    let ms;
    const canon = ORDER[clave];
    if (canon) {
      const used = new Set();
      ms = [];
      canon.forEach(([h, a]) => {
        const key = h + "|" + a;
        if (syncedByKey[key]) { ms.push(build(syncedByKey[key])); used.add(key); }
        else if (prevMatchByKey[key]) { ms.push(build({ home: h, away: a })); used.add(key); }
      });
      // partidos sincronizados que no estén en el orden canónico (no debería pasar en grupos), al final
      byClave[clave].matches.forEach((m) => { const k = m.home + "|" + m.away; if (!used.has(k)) ms.push(build(m)); });
    } else {
      ms = byClave[clave].matches.sort((a, b) => new Date(a._date) - new Date(b._date)).map(build);
    }

    // Cierre automático = inicio del primer partido de la jornada
    // (reglamento: "los pronósticos deberán enviarse antes del inicio de cada jornada").
    const firstKick = byClave[clave].matches.reduce((min, m) => (m._date && (!min || m._date < min)) ? m._date : min, null);
    return {
      clave,
      name: byClave[clave].name,
      factory: false,
      closeTime: firstKick || prev.closeTime || "",
      matches: ms,
    };
  });

  // --- Eliminatoria: cruces de la primera ronda + ganadores reales por ronda ---
  const ko = { 0: [], 1: [], 2: [], 3: [], 4: [] };
  for (const m of matches) {
    const idx = KO_STAGE[m.stage];
    if (idx == null) continue;
    ko[idx].push(m);
  }
  const ord = (a, b) => new Date(a.utcDate) - new Date(b.utcDate) || a.id - b.id;
  Object.keys(ko).forEach((k) => ko[k].sort(ord));

  const existingBr = parse((await db.ref("quiniela/bracket").get()).val()) || { closeTime: "", r16: [], real: { w: {}, finalScore: "" } };
  // Cierre automático del cuadro = inicio del primer partido de la eliminatoria
  // (reglamento: "antes del inicio de las eliminatorias se completa la hoja de ruta").
  const koFirst = ko[0].reduce((min, m) => (m.utcDate && (!min || m.utcDate < min)) ? m.utcDate : min, null);
  // Solo cruces con equipos REALES: football-data ya expone la estructura con
  // equipos TBD (null) antes del sorteo; no cargamos esos placeholders.
  const r16real = ko[0].map((m) => ({ a: esTeam(m.homeTeam && m.homeTeam.name), b: esTeam(m.awayTeam && m.awayTeam.name) })).filter((c) => c.a && c.b);
  const bracket = {
    closeTime: koFirst || existingBr.closeTime || "",
    r16: r16real.length ? r16real : [],
    real: { w: {}, finalScore: existingBr.real ? existingBr.real.finalScore : "" },
  };
  const winnerOf = (m) => m.score && m.score.winner === "HOME_TEAM" ? esTeam(m.homeTeam.name)
    : m.score && m.score.winner === "AWAY_TEAM" ? esTeam(m.awayTeam.name) : null;
  for (let idx = 0; idx <= 4; idx++) {
    ko[idx].forEach((m, i) => {
      if (m.status !== "FINISHED") return;
      const w = winnerOf(m);
      if (w) { bracket.real.w[idx] = bracket.real.w[idx] || {}; bracket.real.w[idx][i] = w; }
      if (idx === 4 && m.score && m.score.fullTime && m.score.fullTime.home != null) {
        bracket.real.finalScore = `${m.score.fullTime.home}-${m.score.fullTime.away}`;
      }
    });
  }

  const changed = [];
  if (jornadas.length && await setIfChanged(db, "jornadas", jornadas)) changed.push("jornadas");
  if (bracket.r16.length && await setIfChanged(db, "bracket", bracket)) changed.push("bracket");
  await db.ref("quiniela/" + enc("_lastsync")).set(JSON.stringify({ at: new Date().toISOString(), changed }));

  return { statusCode: 200, body: JSON.stringify({ ok: true, jornadas: jornadas.length, changed }) };
};
