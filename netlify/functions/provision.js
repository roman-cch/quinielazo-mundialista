// Provisiona (una vez, e idempotente) las cuentas de Firebase Auth de los 27
// jugadores: usuario = email sintético del nombre, contraseña inicial = nombre,
// custom claims { playerId, org } y flag mustChangePassword en RTDB.
//
// Autorización: como al principio no existe ningún organizador, se acepta el
// secreto de instalación SETUP_SECRET (env) o, una vez creado, un token de org.
//   POST { secret: "<SETUP_SECRET>", resetPasswords?: true }
const { getAdmin } = require("./_lib/admin");
const { json, verifyToken } = require("./_lib/http");
const { PLAYERS, ORG_PLAYER_ID, synthEmail, initialPassword } = require("./_lib/players");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { error: "Método no permitido" });

  let body = {};
  try { body = JSON.parse(event.body || "{}"); } catch (e) { return json(400, { error: "JSON inválido" }); }

  // Autorización: secreto de instalación o token de organizador ya existente.
  let authorized = false;
  if (process.env.SETUP_SECRET && body.secret === process.env.SETUP_SECRET) authorized = true;
  if (!authorized) {
    try { const t = await verifyToken(event); authorized = !!t.org; } catch (e) { /* no token */ }
  }
  if (!authorized) return json(403, { error: "No autorizado" });

  const admin = getAdmin();
  const auth = admin.auth();
  const db = admin.database();
  const resetPasswords = !!body.resetPasswords;
  const results = [];

  for (const p of PLAYERS) {
    const email = synthEmail(p.name);
    const pass = initialPassword(p.name, p.id);
    const claims = { playerId: p.id, org: p.id === ORG_PLAYER_ID };
    let uid, action;

    try {
      const existing = await auth.getUserByEmail(email);
      uid = existing.uid;
      action = "ya-existía";
      if (resetPasswords) {
        await auth.updateUser(uid, { password: pass });
        await db.ref("users/" + uid + "/mustChangePassword").set(true);
        action = "contraseña-reiniciada";
      }
    } catch (e) {
      const created = await auth.createUser({ email, password: pass, displayName: p.name });
      uid = created.uid;
      action = "creado";
      await db.ref("users/" + uid).set({ playerId: p.id, name: p.name, mustChangePassword: true });
    }

    await auth.setCustomUserClaims(uid, claims);
    // Asegura el nodo de mapeo aunque la cuenta ya existiera.
    await db.ref("users/" + uid + "/playerId").set(p.id);
    await db.ref("users/" + uid + "/name").set(p.name);
    results.push({ id: p.id, name: p.name, email, action, org: claims.org });
  }

  return json(200, { ok: true, count: results.length, players: results });
};
