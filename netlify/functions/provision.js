// Provisiona (una vez, e idempotente) las cuentas de Firebase Auth de los 27
// jugadores: usuario = email sintético del nombre, contraseña inicial = nombre,
// custom claims { playerId, org } y flag mustChangePassword en RTDB.
//
// Autorización: como al principio no existe ningún organizador, se acepta el
// secreto de instalación SETUP_SECRET (env) o, una vez creado, un token de org.
//   POST { secret: "<SETUP_SECRET>", resetPasswords?: true }
const { getAdmin } = require("./_lib/admin");
const { json, verifyToken } = require("./_lib/http");
const { PLAYERS, ORG_PLAYER_IDS, synthEmail, initialPassword } = require("./_lib/players");

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

  // En paralelo: asegurar cada cuenta de Auth y sus custom claims (evita el timeout).
  const results = await Promise.all(PLAYERS.map(async (p) => {
    const email = synthEmail(p.name);
    const pass = initialPassword(p.name, p.id);
    const claims = { playerId: p.id, org: ORG_PLAYER_IDS.includes(p.id) };
    let uid, action, freshLogin = false;

    try {
      const existing = await auth.getUserByEmail(email);
      uid = existing.uid;
      action = "ya-existía";
      if (resetPasswords) {
        await auth.updateUser(uid, { password: pass });
        action = "contraseña-reiniciada";
        freshLogin = true; // volver a forzar el cambio de contraseña
      }
    } catch (e) {
      const created = await auth.createUser({ email, password: pass, displayName: p.name });
      uid = created.uid;
      action = "creado";
      freshLogin = true;
    }

    await auth.setCustomUserClaims(uid, claims);
    return { id: p.id, name: p.name, email, uid, action, org: claims.org, freshLogin };
  }));

  // Una sola escritura multi-ruta a la base de datos (rápido y atómico).
  const updates = {};
  results.forEach((r) => {
    updates["users/" + r.uid + "/playerId"] = r.id;
    updates["users/" + r.uid + "/name"] = r.name;
    if (r.freshLogin) updates["users/" + r.uid + "/mustChangePassword"] = true;
  });
  await db.ref().update(updates);

  return json(200, {
    ok: true,
    count: results.length,
    players: results.map((r) => ({ id: r.id, name: r.name, action: r.action, org: r.org })),
  });
};
