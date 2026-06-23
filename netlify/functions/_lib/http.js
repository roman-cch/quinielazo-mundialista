// Helpers HTTP comunes a las funciones: respuestas JSON y verificación de token.
const { getAdmin } = require("./admin");

function json(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

// Verifica el ID token de Firebase del header Authorization: Bearer <token>.
// Devuelve el token decodificado (con custom claims playerId / org) o lanza.
async function verifyToken(event) {
  const h = event.headers || {};
  const authz = h.authorization || h.Authorization || "";
  const m = /^Bearer\s+(.+)$/i.exec(authz);
  if (!m) throw new Error("Sin token");
  return getAdmin().auth().verifyIdToken(m[1]);
}

module.exports = { json, verifyToken };
