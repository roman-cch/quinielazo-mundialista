// Comprueba si existe una cuenta para un nombre dado, para poder decirle al
// jugador si lo que falla al entrar es el NOMBRE o la CONTRASEÑA.
// (En esta quiniela privada la lista de nombres ya es conocida, así que no hay
//  problema de enumeración.) POST { name }
const { getAdmin } = require("./_lib/admin");
const { json } = require("./_lib/http");
const { synthEmail } = require("./_lib/players");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { error: "Método no permitido" });
  let body = {};
  try { body = JSON.parse(event.body || "{}"); } catch (e) { return json(400, { error: "JSON inválido" }); }
  const name = (body.name || "").trim();
  if (!name) return json(400, { error: "Falta name" });

  try {
    await getAdmin().auth().getUserByEmail(synthEmail(name));
    return json(200, { exists: true });
  } catch (e) {
    if (e && e.code === "auth/user-not-found") return json(200, { exists: false });
    return json(200, { exists: null }); // no se pudo determinar
  }
};
