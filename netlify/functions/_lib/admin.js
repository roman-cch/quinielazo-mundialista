// Inicializa el Firebase Admin SDK una sola vez por contenedor de función.
// Credenciales por variable de entorno (configuradas en Netlify), nunca en el repo:
//   FIREBASE_SERVICE_ACCOUNT  -> JSON de la cuenta de servicio (Console > Project settings > Service accounts)
//   FIREBASE_DB_URL           -> URL de la Realtime Database
const admin = require("firebase-admin");

function getAdmin() {
  if (!admin.apps.length) {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!raw) throw new Error("Falta FIREBASE_SERVICE_ACCOUNT");
    const serviceAccount = JSON.parse(raw);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: process.env.FIREBASE_DB_URL,
    });
  }
  return admin;
}

module.exports = { getAdmin };
