// Orden canonico de los partidos por jornada (nombres en español, orden de fabrica).
// Los pronosticos se guardan por POSICION, asi que el sync debe respetar este orden
// y nunca reordenar por fecha (si no, se descuadra toda la puntuacion).
module.exports = {
  "J1": [
    [
      "México",
      "Sudáfrica"
    ],
    [
      "Corea del Sur",
      "República Checa"
    ],
    [
      "Canadá",
      "Bosnia y Herzegovina"
    ],
    [
      "Catar",
      "Suiza"
    ],
    [
      "Brasil",
      "Marruecos"
    ],
    [
      "Haití",
      "Escocia"
    ],
    [
      "Estados Unidos",
      "Paraguay"
    ],
    [
      "Australia",
      "Turquía"
    ],
    [
      "Alemania",
      "Curazao"
    ],
    [
      "Costa de Marfil",
      "Ecuador"
    ],
    [
      "Países Bajos",
      "Japón"
    ],
    [
      "Suecia",
      "Túnez"
    ],
    [
      "Bélgica",
      "Egipto"
    ],
    [
      "Irán",
      "Nueva Zelanda"
    ],
    [
      "España",
      "Cabo Verde"
    ],
    [
      "Arabia Saudita",
      "Uruguay"
    ],
    [
      "Francia",
      "Senegal"
    ],
    [
      "Irak",
      "Noruega"
    ],
    [
      "Argentina",
      "Argelia"
    ],
    [
      "Austria",
      "Jordania"
    ],
    [
      "Portugal",
      "RD Congo"
    ],
    [
      "Uzbekistán",
      "Colombia"
    ],
    [
      "Inglaterra",
      "Croacia"
    ],
    [
      "Ghana",
      "Panamá"
    ]
  ],
  "J2": [
    [
      "República Checa",
      "Sudáfrica"
    ],
    [
      "México",
      "Corea del Sur"
    ],
    [
      "Suiza",
      "Bosnia y Herzegovina"
    ],
    [
      "Canadá",
      "Catar"
    ],
    [
      "Escocia",
      "Marruecos"
    ],
    [
      "Brasil",
      "Haití"
    ],
    [
      "Estados Unidos",
      "Australia"
    ],
    [
      "Turquía",
      "Paraguay"
    ],
    [
      "Alemania",
      "Costa de Marfil"
    ],
    [
      "Ecuador",
      "Curazao"
    ],
    [
      "Países Bajos",
      "Suecia"
    ],
    [
      "Túnez",
      "Japón"
    ],
    [
      "Bélgica",
      "Irán"
    ],
    [
      "Nueva Zelanda",
      "Egipto"
    ],
    [
      "España",
      "Arabia Saudita"
    ],
    [
      "Uruguay",
      "Cabo Verde"
    ],
    [
      "Francia",
      "Irak"
    ],
    [
      "Noruega",
      "Senegal"
    ],
    [
      "Argentina",
      "Austria"
    ],
    [
      "Jordania",
      "Argelia"
    ],
    [
      "Portugal",
      "Uzbekistán"
    ],
    [
      "Colombia",
      "RD Congo"
    ],
    [
      "Inglaterra",
      "Ghana"
    ],
    [
      "Panamá",
      "Croacia"
    ]
  ],
  "J3": [
    [
      "México",
      "República Checa"
    ],
    [
      "Sudáfrica",
      "Corea del Sur"
    ],
    [
      "Canadá",
      "Suiza"
    ],
    [
      "Bosnia y Herzegovina",
      "Catar"
    ],
    [
      "Brasil",
      "Escocia"
    ],
    [
      "Marruecos",
      "Haití"
    ],
    [
      "Estados Unidos",
      "Turquía"
    ],
    [
      "Paraguay",
      "Australia"
    ],
    [
      "Alemania",
      "Ecuador"
    ],
    [
      "Curazao",
      "Costa de Marfil"
    ],
    [
      "Países Bajos",
      "Túnez"
    ],
    [
      "Japón",
      "Suecia"
    ],
    [
      "Bélgica",
      "Nueva Zelanda"
    ],
    [
      "Egipto",
      "Irán"
    ],
    [
      "España",
      "Uruguay"
    ],
    [
      "Cabo Verde",
      "Arabia Saudita"
    ],
    [
      "Francia",
      "Noruega"
    ],
    [
      "Senegal",
      "Irak"
    ],
    [
      "Argentina",
      "Jordania"
    ],
    [
      "Argelia",
      "Austria"
    ],
    [
      "Portugal",
      "Colombia"
    ],
    [
      "RD Congo",
      "Uzbekistán"
    ],
    [
      "Inglaterra",
      "Panamá"
    ],
    [
      "Croacia",
      "Ghana"
    ]
  ],
  // Orden canonico del CUADRO de eliminatoria (dieciseisavos), de arriba a abajo segun el
  // bracket oficial. El sync DEBE ordenar r16 por esto y NUNCA por fecha: si no, octavos y
  // cuartos emparejan cruces equivocados y las mitades del cuadro salen cruzadas (p.ej.
  // España y Argentina acaban del mismo lado). Octavos = ganadores de (1,2),(3,4)...
  "R16": [
    ["Sudáfrica", "Canadá"],
    ["Países Bajos", "Marruecos"],
    ["Alemania", "Paraguay"],
    ["Francia", "Suecia"],
    ["Bélgica", "Senegal"],
    ["Estados Unidos", "Bosnia y Herzegovina"],
    ["España", "Austria"],
    ["Portugal", "Croacia"],
    ["Brasil", "Japón"],
    ["Costa de Marfil", "Noruega"],
    ["México", "Ecuador"],
    ["Inglaterra", "RD Congo"],
    ["Suiza", "Argelia"],
    ["Colombia", "Ghana"],
    ["Australia", "Egipto"],
    ["Argentina", "Cabo Verde"]
  ]
};
