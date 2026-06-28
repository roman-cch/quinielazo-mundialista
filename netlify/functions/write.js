// Única vía de escritura a la base de datos. Las reglas RTDB prohíben toda
// escritura desde el cliente; aquí se verifica identidad y autorización en el
// servidor y se escribe con el Admin SDK (que ignora las reglas).
//
// Cuerpo aceptado (POST, JSON):
//   { key: "p:9", val: "<json string>" }   -> pronósticos de un jugador
//   { key: "jornadas"|"bracket"|"sidebet"|..., val }  -> datos de organizador
//   { userFlag: "mustChangePassword", val: false }    -> el propio usuario marca su flag
const { getAdmin } = require("./_lib/admin");
const { json, verifyToken } = require("./_lib/http");

const enc = (k) => k.replace(/:/g, "_"); // ':' no es válido en claves de Firebase

function parse(v) { try { return typeof v === "string" ? JSON.parse(v) : v; } catch (e) { return null; } }

// Devuelve el set de claves de jornada que están cerradas (closeTime en pasado).
function closedClaves(jornadasStr) {
  const arr = parse(jornadasStr) || [];
  const now = Date.now();
  const set = new Set();
  arr.forEach((j) => { if (j.closeTime && new Date(j.closeTime).getTime() < now) set.add(j.clave); });
  return set;
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { error: "Método no permitido" });

  let token;
  try { token = await verifyToken(event); }
  catch (e) { return json(401, { error: "No autenticado" }); }

  let body;
  try { body = JSON.parse(event.body || "{}"); } catch (e) { return json(400, { error: "JSON inválido" }); }

  const admin = getAdmin();
  const db = admin.database();

  // 1) El usuario limpia su propio flag mustChangePassword (tras cambiar la contraseña).
  if (body.userFlag === "mustChangePassword") {
    await db.ref("users/" + token.uid + "/mustChangePassword").set(false);
    return json(200, { ok: true });
  }

  const key = String(body.key || "");
  if (!key) return json(400, { error: "Falta key" });
  const val = body.val;

  // 2) Pronósticos de jugador: solo el dueño (o el organizador).
  if (key.startsWith("p:")) {
    const id = parseInt(key.slice(2), 10);
    const isOwner = token.playerId === id;
    if (!token.org && !isOwner) return json(403, { error: "No puedes editar a otro jugador" });

    // Si NO es organizador, no se permiten cambios en jornadas ya cerradas ni en
    // el cuadro cerrado (cumplimiento del reglamento, verificado en servidor).
    if (!token.org) {
      const incoming = parse(val) || {};
      const existing = parse((await db.ref("quiniela/" + enc(key)).get()).val()) || {};
      const jornadasStr = (await db.ref("quiniela/jornadas").get()).val();
      const closed = closedClaves(jornadasStr);
      for (const clave of closed) {
        const a = JSON.stringify((incoming.preds || {})[clave] || null);
        const b = JSON.stringify((existing.preds || {})[clave] || null);
        if (a !== b) return json(403, { error: "Jornada " + clave + " cerrada" });
      }
      const brStr = (await db.ref("quiniela/bracket").get()).val();
      const br = parse(brStr) || {};
      const FINAL_IDX = 4; // ROUNDS del cliente: 16avos..Final = 0..4
      if (br.closeTime && new Date(br.closeTime).getTime() < Date.now()) {
        // Empezada la eliminatoria: los CRUCES (picks) ya no se pueden cambiar.
        const ip = JSON.stringify((incoming.bracket || {}).picks || null);
        const ep = JSON.stringify((existing.bracket || {}).picks || null);
        if (ip !== ep) return json(403, { error: "Cuadro cerrado (cruces)" });
        // El BONUS (marcador de la final) sigue editable hasta el inicio de la FINAL.
        const fc = br.rclose && br.rclose[FINAL_IDX];
        if (fc && new Date(fc).getTime() < Date.now()) {
          const ib = JSON.stringify((incoming.bracket || {}).bonus || null);
          const eb = JSON.stringify((existing.bracket || {}).bonus || null);
          if (ib !== eb) return json(403, { error: "Bonus cerrado (final empezada)" });
        }
      }
    }

    await db.ref("quiniela/" + enc(key)).set(val);
    return json(200, { ok: true });
  }

  // 3) Datos de organizador (resultados, jornadas, cuadro, premios): solo org.
  const ORG_KEYS = ["jornadas", "bracket", "sidebet", "seedver", "_lastsync"];
  if (ORG_KEYS.includes(key)) {
    if (!token.org) return json(403, { error: "Solo el organizador" });
    await db.ref("quiniela/" + enc(key)).set(val);
    return json(200, { ok: true });
  }

  return json(400, { error: "Clave no permitida: " + key });
};
