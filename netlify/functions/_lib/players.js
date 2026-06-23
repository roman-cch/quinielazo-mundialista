// Lista canónica de jugadores (id = dorsal). Debe coincidir con PLAYERS de index.html.
// Es la fuente de verdad para provisionar cuentas de Firebase Auth.
const PLAYERS = [
  { id: 1, name: "Sergio Acevedo" }, { id: 2, name: "Diego Serrano" },
  { id: 3, name: "Julio Lopez" }, { id: 4, name: "Victor Perez" },
  { id: 5, name: "Juanito" }, { id: 6, name: "Polanco" },
  { id: 7, name: "Villaro" }, { id: 8, name: "Javi Ortega" },
  { id: 9, name: "Jose Luis" }, { id: 10, name: "Alvaro Trapote" },
  { id: 11, name: "Rafael Del Pino" }, { id: 12, name: "David Hernandez" },
  { id: 13, name: "Roberto Garcia" }, { id: 14, name: "Carlos Aragones" },
  { id: 15, name: "Sergio M" }, { id: 16, name: "Carretero" },
  { id: 17, name: "Jorge Aguilar" }, { id: 18, name: "Fernando Acevedo" },
  { id: 19, name: "Roman Cano" }, { id: 20, name: "Fer Padre" },
  { id: 21, name: "Raul Moreno" }, { id: 22, name: "Daniel Asenjo" },
  { id: 23, name: "Fer Taranco" }, { id: 24, name: "Carlos Taranco" },
  { id: 25, name: "Carlos Jimenez" }, { id: 26, name: "Alex Jimenez" },
  { id: 27, name: "Luis Riesgo" },
];

// Dorsales de los organizadores. Reciben el custom claim org:true.
// 1=Sergio Acevedo, 2=Diego Serrano, 3=Julio Lopez, 19=Roman Cano.
const ORG_PLAYER_IDS = [1, 2, 3, 19];

// Normaliza un nombre a un slug seguro: minúsculas, sin acentos, sin signos.
// "José Luis" -> "joseluis"  ·  "Sergio M" -> "sergiom"
function normalizeName(name) {
  return String(name)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // quita acentos (diacríticos combinantes)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ""); // quita espacios y signos
}

// Email sintético estable para Firebase Auth (el dominio no necesita existir).
// El usuario nunca lo ve: escribe su nombre y el cliente aplica esta misma función.
function synthEmail(name) {
  return normalizeName(name) + "@quinielazo.local";
}

// Contraseña inicial = nombre normalizado; Firebase exige >= 6 caracteres,
// así que rellenamos con el dorsal a 2 dígitos si quedara corta.
function initialPassword(name, id) {
  const base = normalizeName(name);
  return base.length >= 6 ? base : base + String(id).padStart(2, "0");
}

module.exports = { PLAYERS, ORG_PLAYER_IDS, normalizeName, synthEmail, initialPassword };
