# Puesta en marcha del backend

La app pasa de "todo en el navegador" a tener **sesiones reales por jugador**,
**seguridad en el servidor** y **partidos/resultados automáticos** desde API-Football.

Piezas nuevas:
- `netlify/functions/` — backend (Node) sobre Funciones de Netlify.
  - `write.js` — única vía de escritura; verifica identidad y permisos en el servidor.
  - `provision.js` — crea las 27 cuentas de jugador (una sola vez).
  - `sync.js` — sincronización **automática** con API-Football (cron horario).
- `database.rules.json` — reglas RTDB: lectura solo con sesión, escritura solo desde el servidor.
- Firebase **Authentication** (email/contraseña) para las sesiones.

---

## 1. Firebase: habilitar Email/Password
Consola de Firebase → **Authentication** → *Sign-in method* → activar **Email/Password**.

## 2. Firebase: cuenta de servicio (para el backend)
Consola → ⚙ *Project settings* → **Service accounts** → *Generate new private key* → descarga el JSON.
Lo usarás como variable de entorno en Netlify (no lo subas al repo; ya está en `.gitignore`).

## 3. football-data.org: token
Regístrate gratis en **https://www.football-data.org/client/register** y copia el
**API token** que te llega por email. Su capa gratuita incluye el Mundial (con
resultados con ligero retraso, suficiente para la quiniela).

> Nota: se descartó API-Football porque su plan gratuito **no da acceso a la
> temporada 2026** ("Free plans do not have access to this season").

## 4. Netlify: variables de entorno
En *Site settings → Environment variables* añade:

| Variable | Valor |
|---|---|
| `FIREBASE_SERVICE_ACCOUNT` | El **JSON entero** de la cuenta de servicio (en una sola variable) |
| `FIREBASE_DB_URL` | `https://quinielazo-mundialista-default-rtdb.europe-west1.firebasedatabase.app` |
| `FOOTBALLDATA_TOKEN` | Tu token de football-data.org |
| `FOOTBALLDATA_COMP` | `WC` (opcional; por defecto WC) |
| `SETUP_SECRET` | Una frase secreta tuya, solo para lanzar la provisión inicial |

## 5. Aplicar las reglas de seguridad
Consola → **Realtime Database → Rules** → pega el contenido de `database.rules.json` y publica.
(O con Firebase CLI: `firebase deploy --only database`.)

## 6. Desplegar y provisionar los 27 jugadores
Tras el deploy en Netlify, lanza la provisión **una vez** (crea las cuentas,
usuario = nombre, contraseña inicial = nombre, y marca "cambiar al entrar"):

```bash
curl -X POST https://TU-SITIO.netlify.app/.netlify/functions/provision \
  -H "Content-Type: application/json" \
  -d '{"secret":"EL_VALOR_DE_SETUP_SECRET"}'
```

- Es **idempotente**: si lo repites no duplica cuentas.
- Para **reiniciar contraseñas** (vuelven a ser el nombre y piden cambio de nuevo):
  añade `"resetPasswords": true` al cuerpo.
- Reciben permisos de **organizador**: Sergio Acevedo (1), Diego Serrano (2),
  Julio Lopez (3) y Roman Cano (19). Para cambiar la lista, edita `ORG_PLAYER_IDS`
  en `netlify/functions/_lib/players.js` y vuelve a lanzar la provisión.

## 7. Cómo entran los jugadores
- Usuario = **su nombre** (ej. `Jose Luis`). Contraseña la primera vez = **su nombre**
  (ej. `joseluis`; si fuese muy corto, se le añade su dorsal).
- Al entrar la primera vez, la app **obliga a elegir una contraseña nueva**.
- Nadie puede pronosticar por otro: la propiedad se valida en el servidor.

## 8. Sincronización automática
`sync.js` corre **cada hora** (cron en `netlify.toml`). Una sola llamada a
football-data.org trae fase de grupos, cruces de eliminatoria (con **local/visitante**)
y resultados, y los vuelca en la base de datos. ~24 llamadas/día (la capa gratuita
permite 10 llamadas/minuto, así que vamos sobrados). No hay botón manual: todo llega solo.

El organizador solo ajusta lo que la API no decide: el **partido de la jornada**
(resultado exacto) y las **horas de cierre**. Esas ediciones se respetan en cada sync.

---

## Probar en local
```bash
npm install
netlify dev                         # sirve la web + funciones
netlify functions:invoke sync       # fuerza una sincronización para probar
```
Necesitas las mismas variables de entorno (un `.env` local o `netlify env:import`).

## Limitaciones conocidas
- **Orden del cuadro**: la API no garantiza el orden de los cruces dentro de una ronda
  eliminatoria. La primera ronda y los ganadores se rellenan solos; si el árbol no
  encaja, el organizador puede reordenar en la pantalla de Organizador.
- **Nombres de selección**: hay un mapa inglés→español en `_lib/teams.js`. Si aparece
  una selección sin traducir, se muestra el nombre de la API (no afecta al 1-X-2).
