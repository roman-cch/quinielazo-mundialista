// Traducción de nombres de selección (los que devuelve API-Football, en inglés)
// a los nombres en español usados en la app. La clave se normaliza (minúsculas,
// sin acentos) para tolerar variantes ("Turkey"/"Türkiye", "USA"/"United States").
const MAP = {
  mexico: "México", "south africa": "Sudáfrica", "south korea": "Corea del Sur",
  "korea republic": "Corea del Sur", "czech republic": "República Checa", czechia: "República Checa",
  canada: "Canadá", "bosnia and herzegovina": "Bosnia y Herzegovina",
  "bosnia-herzegovina": "Bosnia y Herzegovina", "bosnia and herzegovina ": "Bosnia y Herzegovina",
  "ir iran": "Irán", "korea republic": "Corea del Sur", qatar: "Catar",
  switzerland: "Suiza", brazil: "Brasil", morocco: "Marruecos", haiti: "Haití",
  scotland: "Escocia", usa: "Estados Unidos", "united states": "Estados Unidos",
  paraguay: "Paraguay", australia: "Australia", turkey: "Turquía", turkiye: "Turquía",
  germany: "Alemania", curacao: "Curazao", "ivory coast": "Costa de Marfil",
  "cote d'ivoire": "Costa de Marfil", ecuador: "Ecuador", netherlands: "Países Bajos",
  japan: "Japón", sweden: "Suecia", tunisia: "Túnez", belgium: "Bélgica", egypt: "Egipto",
  iran: "Irán", "new zealand": "Nueva Zelanda", spain: "España", "cape verde": "Cabo Verde",
  "cabo verde": "Cabo Verde", "saudi arabia": "Arabia Saudita", uruguay: "Uruguay",
  france: "Francia", senegal: "Senegal", iraq: "Irak", norway: "Noruega", argentina: "Argentina",
  algeria: "Argelia", austria: "Austria", jordan: "Jordania", portugal: "Portugal",
  "dr congo": "RD Congo", "congo dr": "RD Congo", "democratic republic of congo": "RD Congo",
  uzbekistan: "Uzbekistán", colombia: "Colombia", england: "Inglaterra", croatia: "Croacia",
  ghana: "Ghana", panama: "Panamá", italy: "Italia", denmark: "Dinamarca", poland: "Polonia",
  nigeria: "Nigeria", cameroon: "Camerún", "costa rica": "Costa Rica", peru: "Perú",
  chile: "Chile", ukraine: "Ucrania", wales: "Gales", "republic of ireland": "Irlanda",
  greece: "Grecia", serbia: "Serbia", hungary: "Hungría", romania: "Rumanía",
  jamaica: "Jamaica", honduras: "Honduras",
};

function norm(s) {
  return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

// Devuelve el nombre en español; si no está mapeado, devuelve el original tal cual.
function esTeam(name) {
  return MAP[norm(name)] || name;
}

module.exports = { esTeam };
