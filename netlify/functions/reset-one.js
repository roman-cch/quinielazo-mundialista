// Reinicia la contraseña de UN SOLO jugador a su contraseña inicial (su nombre
// normalizado) y le activa el flag mustChangePassword para que, al entrar con
// ella, la app le obligue inmediatamente a elegir una nueva.
//
// Es la versión quirúrgica de provision.js (resetPasswords), pero acotada a un
// jugador: útil cuando alguien (p. ej. Jose Luis) olvida su contraseña.
//
// Autorización: igual que provision.js, secreto de instalación SETUP_SECRET o un
// token de organizador ya existente.
//   POST { secret: "<SETUP_SECRET>", name: "Jose Luis" }
//   POST { secret: "<SETUP_SECRET>", id: 9 }            // alternativa por dorsal
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

  // Identificar al jugador en la lista canónica (nunca por datos arbitrarios del
  // body): así la contraseña reiniciada es siempre la inicial oficial.
  const wantName = (body.name || "").trim();
  const wantId = body.id;
  const p = PLAYERS.find((x) =>
    (wantId != null && x.id === wantId) ||
    (wantName && synthEmail(x.name) === synthEmail(wantName))
  );
  if (!p) return json(404, { error: "Jugador no encontrado en la lista" });

  const admin = getAdmin();
  const auth = admin.auth();
  const db = admin.database();

  const email = synthEmail(p.name);
  const pass = initialPassword(p.name, p.id);

  let uid;
  try {
    const existing = await auth.getUserByEmail(email);
    uid = existing.uid;
    await auth.updateUser(uid, { password: pass });
  } catch (e) {
    return json(404, { error: "La cuenta de ese jugador no existe en Auth" });
  }

  // Forzar el cambio de contraseña en el próximo inicio de sesión.
  await db.ref("users/" + uid + "/mustChangePassword").set(true);

  return json(200, {
    ok: true,
    id: p.id,
    name: p.name,
    action: "contraseña-reiniciada",
    // La contraseña inicial es el nombre normalizado; se la decimos al organizador
    // para que se la comunique al jugador. Al entrar, la app le pedirá cambiarla.
    initialPassword: pass,
  });
};
