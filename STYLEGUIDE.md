# Guía de estilo — Quinielazo Mundialista

Estética: **Squid Game + neón cyberpunk / videojuego**. Oscuro, con letras
brillantes (glow), encuadres definidos y todo uniforme. Sobrio, nada de
"dibujitos" (emojis) — iconografía geométrica y limpia.

## 1. Paleta (bloqueada: 3 + 1 acento)

Toda la interfaz se mueve SOLO en estos colores. Nada fuera de aquí.

| Rol | Variable | Hex | Uso |
|-----|----------|-----|-----|
| **Primario — Rosa** | `--pink` / `--pink2` | `#ed1b76` / `#ff2e8e` | Marca, acción principal, sección Pronósticos, énfasis |
| **Secundario — Turquesa** | `--teal` / `--teal2` | `#1fb89b` / `#15d6a8` | Sección Ranking, confirmaciones, botones `alt` |
| **Terciario — Azul marino/neón** | `--navy` / `--blue` / `--blue2` | `#0e1a3f` / `#3a5bd9` / `#5b7cff` | Fondo, marcos, glows fríos, bordes |
| **Acento — Oro** | `--gold` | `#f4c20d` | SOLO para puntos/medallas (dato numérico destacado) |

Neutros: `--bg #0b0b0f`, `--panel #15151c`, `--panel2 #1d1d27`, `--line #2a2a36`,
texto `--txt #f3f0ee`, apagado `--mut #9a96a6`.

**Glow estándar:** `0 0 18px <color>55`. Highlight interior: `0 1px 0 rgba(255,255,255,.25) inset`.

## 2. Tipografía

- **Display / marca / títulos grandes:** `Audiowide` (Google Fonts). Solo para
  el logotipo (h1) y rótulos destacados. Nunca para párrafos.
- **Interfaz / texto / botones / labels:** `Exo 2` (400–800). Todo lo demás.
- Jerarquía: h1 Audiowide ~22px con glow · h2.sec Exo2 700 13px uppercase
  letter-spacing 2px + glow · texto 15px · meta/mut 12px.

## 3. Componentes

- **Botones:** degradado vertical del color de rol + glow + highlight interior
  superior. Radio 12px. `active` → scale .98. Ghost = plano panel2. Danger = rojo apagado.
- **Píldoras de navegación:** centradas, con aire (gap 20px), radio 17px.
  Activa = degradado del color de su sección (Ranking turquesa→azul, Pronósticos
  rosa→violeta) + glow + elevación `-3px`.
- **Tarjetas / encuadres:** `--panel` con degradado sutil, borde `--line`,
  radio 16px, sombra + borde neón muy tenue azul.
- **Acordeones:** cabecera panel2, cuerpo con borde `--line`. Chevron gira al abrir.
- **Chips de estado:** ok=verde-teal, no=rojo-rosa, wait=neutro.

## 4. Iconografía (sobria, sin emojis)

- Motivos de marca: **○ △ □ ◇** (formas de Squid Game), en tricolor neón.
- Acciones/estados: glifos monocromos finos en vez de emojis
  (p. ej. candado/editar/borrar como símbolos de una línea, no 🔒✏️🗑).
- Medallas del podio: numeración neón (1/2/3) con el color de acento, no 🥇🥈🥉.
- Sin banderas emoji ni iconos de colores fuera de la paleta.

## 5. Reglas de oro

1. Si un color no está en la paleta, no se usa.
2. Todo texto destacado lleva glow del color de su rol.
3. Nada de emojis decorativos: iconos geométricos monocromos.
4. Mismo radio, mismo patrón de glow y misma sombra en todos los encuadres.
