# Accesos iniciales · Quinielazo Mundialista

Cada jugador entra con **su nombre** y una **contraseña inicial** (su propio nombre en
minúsculas y sin espacios). **La primera vez, la app le obliga a cambiar la contraseña.**

> Cómo escribir el nombre: da igual mayúsculas, tildes o espacios. "Jose Luis",
> "jose luis" o "José Luis" valen igual; la app lo normaliza solo.

| Dorsal | Usuario (su nombre) | Contraseña inicial |
|:---:|---|---|
| 01 | Sergio Acevedo | `sergioacevedo` |
| 02 | Diego Serrano | `diegoserrano` |
| 03 | Julio Lopez | `juliolopez` |
| 04 | Victor Perez | `victorperez` |
| 05 | Juanito | `juanito` |
| 06 | Polanco | `polanco` |
| 07 | Villaro | `villaro` |
| 08 | Javi Ortega | `javiortega` |
| 09 | Jose Luis | `joseluis` |
| 10 | Alvaro Trapote | `alvarotrapote` |
| 11 | Rafael Del Pino | `rafaeldelpino` |
| 12 | David Hernandez | `davidhernandez` |
| 13 | Roberto Garcia | `robertogarcia` |
| 14 | Carlos Aragones | `carlosaragones` |
| 15 | Sergio M | `sergiom` |
| 16 | Carretero | `carretero` |
| 17 | Jorge Aguilar | `jorgeaguilar` |
| 18 | Fernando Acevedo | `fernandoacevedo` |
| 19 | Roman Cano | `romancano` |
| 20 | Fer Padre | `ferpadre` |
| 21 | Raul Moreno | `raulmoreno` |
| 22 | Daniel Asenjo | `danielasenjo` |
| 23 | Fer Taranco | `fertaranco` |
| 24 | Carlos Taranco | `carlostaranco` |
| 25 | Carlos Jimenez | `carlosjimenez` |
| 26 | Alex Jimenez | `alexjimenez` |
| 27 | Luis Riesgo | `luisriesgo` |

**Organizadores** (entran igual, pero su cuenta tiene permisos extra para gestionar la
quiniela): **Sergio Acevedo (1), Diego Serrano (2), Julio Lopez (3) y Roman Cano (19)**.

---

### Notas para el organizador
- Estas contraseñas solo sirven para el **primer acceso**: cada jugador elige la suya al entrar.
- Si alguien olvida su contraseña, puedes **reiniciarla** (vuelve a ser la inicial de esta
  tabla y le volverá a pedir cambiarla) relanzando la provisión con `resetPasswords`:
  ```powershell
  Invoke-RestMethod -Method Post -Uri "https://TU-SITIO.netlify.app/.netlify/functions/provision" -ContentType "application/json" -Body '{"secret":"TU_SETUP_SECRET","resetPasswords":true}'
  ```
  (Esto reinicia la de **todos**; para una sola persona, dímelo y añadimos una función específica.)
