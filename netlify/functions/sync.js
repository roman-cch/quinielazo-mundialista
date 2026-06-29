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
    // Clave por PAR de equipos (ordenada): da igual quién sea local/visitante. La API
    // a veces invierte el local/visitante respecto al orden de fábrica; emparejar por la
    // cadena "local|visitante" fallaba y descuadraba todo el orden (los pronósticos se
    // guardan por posición). Con el par normalizado eso ya no ocurre.
    const pkey = (h, a) => [String(h).trim(), String(a).trim()].sort().join("|");
    const prevByPair = {};
    (prev.matches || []).forEach((m) => { prevByPair[pkey(m.home, m.away)] = m; });
    const syncedByPair = {};
    byClave[clave].matches.forEach((m) => { syncedByPair[pkey(m.home, m.away)] = m; });

    // Combina el partido previo (orden, local/visitante, "partido de la jornada") con lo
    // que trae el sync (resultado). De un partido YA guardado nunca se cambia ni la
    // posición ni el local/visitante: el 1/2 depende de quién sea local; solo el resultado.
    const build = (pm, sm) => {
      const ref = pm || sm;
      return {
        group: (pm && pm.group) || (sm && sm.group) || "",
        home: pm && pm.home != null ? pm.home : sm.home,
        away: pm && pm.away != null ? pm.away : sm.away,
        exact: isSpain(ref) || !!(pm && pm.exact),
        tag: isSpain(ref) ? "espana" : ((pm && pm.tag) || ""),
        result: (sm && sm.result) || (pm && pm.result) || "",
      };
    };

    // IMPORTANTE: los pronósticos se guardan por POSICIÓN. NUNCA reordenar.
    let ms;
    if (prev.matches && prev.matches.length) {
      // Ya hay jornada guardada: se CONSERVA su orden y su local/visitante; solo se
      // actualizan resultados y se añaden partidos nuevos al final (no esperable en grupos).
      const used = new Set();
      ms = prev.matches.map((pm) => { const k = pkey(pm.home, pm.away); used.add(k); return build(pm, syncedByPair[k]); });
      byClave[clave].matches.forEach((sm) => { const k = pkey(sm.home, sm.away); if (!used.has(k)) ms.push(build(null, sm)); });
    } else {
      // Primera vez (sin datos previos): orden canónico de fábrica, emparejando por par.
      const canon = ORDER[clave];
      if (canon) {
        const used = new Set();
        ms = [];
        canon.forEach(([h, a]) => { const k = pkey(h, a); if (syncedByPair[k]) { ms.push(build(null, syncedByPair[k])); used.add(k); } });
        byClave[clave].matches.forEach((sm) => { const k = pkey(sm.home, sm.away); if (!used.has(k)) ms.push(build(null, sm)); });
      } else {
        ms = byClave[clave].matches.sort((a, b) => new Date(a._date) - new Date(b._date)).map((sm) => build(null, sm));
      }
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

  // La 1ª ronda (dieciseisavos) NO va por fecha: sigue el ORDEN CANONICO del bracket
  // oficial (_lib/order.js -> R16). El cliente forma octavos/cuartos emparejando cruces
  // adyacentes (1-2, 3-4, ...), asi que si r16 llega en orden de fecha el cuadro entero
  // sale descuadrado (mitades cruzadas: España y Argentina del mismo lado). Emparejamos
  // por PAR de equipos (da igual local/visitante), igual que en las jornadas de grupos.
  const R16ORD = ORDER.R16;
  if (R16ORD && ko[0].length) {
    const pkey = (h, a) => [String(h).trim(), String(a).trim()].sort().join("|");
    const teamsOf = (m) => [esTeam(m.homeTeam && m.homeTeam.name), esTeam(m.awayTeam && m.awayTeam.name)];
    const byPair = {};
    ko[0].forEach((m) => { const [h, a] = teamsOf(m); byPair[pkey(h, a)] = m; });
    const used = new Set();
    const ordered = [];
    R16ORD.forEach(([h, a]) => { const k = pkey(h, a); if (byPair[k]) { ordered.push(byPair[k]); used.add(k); } });
    // Cualquier cruce que no estuviera en el orden canonico se anade al final (por fecha).
    ko[0].forEach((m) => { const [h, a] = teamsOf(m); const k = pkey(h, a); if (!used.has(k)) ordered.push(m); });
    ko[0] = ordered;
  }

  const existingBr = parse((await db.ref("quiniela/bracket").get()).val()) || { closeTime: "", r16: [], real: { w: {}, finalScore: "" } };
  // Cierre automático del cuadro = inicio del primer partido de la eliminatoria
  // (reglamento: "antes del inicio de las eliminatorias se completa la hoja de ruta").
  const koFirst = ko[0].reduce((min, m) => (m.utcDate && (!min || m.utcDate < min)) ? m.utcDate : min, null);
  // Solo cruces con equipos REALES: football-data ya expone la estructura con
  // equipos TBD (null) antes del sorteo; no cargamos esos placeholders.
  const r16real = ko[0].map((m) => ({ a: esTeam(m.homeTeam && m.homeTeam.name), b: esTeam(m.awayTeam && m.awayTeam.name) })).filter((c) => c.a && c.b);
  // Si la API aún no trae cruces reales pero ya hay un cuadro sorteado guardado, se conserva;
  // si solo había placeholders TBD (o nada), queda vacío y se limpian esos placeholders.
  const existingReal = (existingBr.r16 || []).some((c) => c && c.a && c.b);
  // Cierre por ronda KO = inicio del primer partido de esa ronda. Lo usan el 1-X-2 de
  // eliminatorias y, sobre todo, el BONUS de la hoja de ruta (marcador de la final):
  // el bonus sigue ABIERTO hasta que empieza la FINAL (rclose[4]), porque no se puede
  // pedir el marcador de una final cuyos equipos aún no se conocen. Los CRUCES sí se
  // cierran con los dieciseisavos (closeTime). Conservamos rclose previo si la API no trae fecha.
  const rclose = {};
  for (let idx = 0; idx <= 4; idx++) {
    const first = ko[idx].reduce((min, m) => (m.utcDate && (!min || m.utcDate < min)) ? m.utcDate : min, null);
    if (first) rclose[idx] = first;
    else if (existingBr.rclose && existingBr.rclose[idx]) rclose[idx] = existingBr.rclose[idx];
  }
  const bracket = {
    closeTime: koFirst || existingBr.closeTime || "",
    r16: r16real.length ? r16real : (existingReal ? existingBr.r16 : []),
    real: { w: {}, finalScore: existingBr.real ? existingBr.real.finalScore : "" },
    rres: existingBr.rres || {},
    rclose,
  };
  const winnerOf = (m) => m.score && m.score.winner === "HOME_TEAM" ? esTeam(m.homeTeam.name)
    : m.score && m.score.winner === "AWAY_TEAM" ? esTeam(m.awayTeam.name) : null;
  for (let idx = 0; idx <= 4; idx++) {
    ko[idx].forEach((m, i) => {
      if (m.status !== "FINISHED") return;
      const w = winnerOf(m);
      if (w) { bracket.real.w[idx] = bracket.real.w[idx] || {}; bracket.real.w[idx][i] = w; }
      // 1-X-2 de eliminatoria: marcador del partido (mismo índice/orden que real.w para
      // que cuadren). Es lo que lee la "jornada" de cada ronda (b.rres) para mostrar el
      // resultado y puntuar el signo, igual que en la fase de grupos. Si el cruce se
      // decidió en penaltis, fullTime es el empate (signo X) y real.w guarda quién pasó.
      const sc = resultOf(m);
      if (sc) { bracket.rres[idx] = bracket.rres[idx] || {}; bracket.rres[idx][i] = sc; }
      if (idx === 4 && m.score && m.score.fullTime && m.score.fullTime.home != null) {
        bracket.real.finalScore = `${m.score.fullTime.home}-${m.score.fullTime.away}`;
      }
    });
  }

  const changed = [];
  if (jornadas.length && await setIfChanged(db, "jornadas", jornadas)) changed.push("jornadas");
  // Sin guard de longitud: hay que poder escribir un cuadro vacío para limpiar placeholders TBD.
  if (await setIfChanged(db, "bracket", bracket)) changed.push("bracket");
  await db.ref("quiniela/" + enc("_lastsync")).set(JSON.stringify({ at: new Date().toISOString(), changed }));

  return { statusCode: 200, body: JSON.stringify({ ok: true, jornadas: jornadas.length, changed }) };
};
