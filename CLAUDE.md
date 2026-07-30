# Escribania Tocagni — Landing Page

> **Este archivo es la fuente de verdad del proyecto y se edita a mano.**
> `AGENTS.md` lo genera `brain-agents-inject` en cada SessionStart y se
> sobreescribe entero (no preserva secciones). Antes `CLAUDE.md` era un symlink
> a `AGENTS.md`, asi que la doc del proyecto se perdia en cada sesion. Ahora son
> dos archivos independientes: **la doc del proyecto va aca, nunca en AGENTS.md.**

## Cliente

Escribania (notaria) con mas de 20 anos de trayectoria en Buenos Aires. Servicios:
certificaciones, contratos, tramites societarios, compraventa de inmuebles,
sucesiones, asesoramiento notarial.

Escribana titular: **Ines Tocagni**.

> El apellido correcto es **Tocagni**. El sitio y el Worker ya usan esa grafia.
> Siguen diciendo "togcani" solo el nombre del directorio del repo y el `name` de
> `package.json`: cosmeticos, no afectan al deploy.

## Stack

| Capa | Tecnologia |
|------|------------|
| Framework | Astro 7 (SSG, output: "static") |
| Estilos | Tailwind CSS v4 (Vite plugin `@tailwindcss/vite`) |
| Deploy | Cloudflare Workers Static Assets (Wrangler v4) |
| Package | pnpm |
| Lenguaje | TypeScript strict |

**0 JS en el cliente.** El unico asset generado es un `.css`. Cualquier feature
nueva se resuelve con HTML + CSS antes de considerar JavaScript (ver el menu
movil como ejemplo). El `dist` pesa ~384 KB, de los cuales ~300 KB son imagenes.

### Dependencias instaladas (sin usar aun)

- `@astrojs/react` + `react` / `react-dom` — para el chatbot futuro
- `@astrojs/cloudflare` — para SSR/API routes cuando se agregue el chatbot

**No removerlas**, son necesarias para la fase 2 (chatbot con Groq).

## Deploy

```bash
pnpm run build          # genera dist/
pnpm exec wrangler deploy # sube a Cloudflare Workers
```

URL: `https://escribania-tocagni.ethoslogliberty.workers.dev`

Cuenta Cloudflare: `ethoslogliberty@gmail.com` (Neo Nach).

## Tema visual

Diseno editorial estilo revista de alta costura (Vogue, Architectural Digest):
tipografia grande, reglas doradas finas, lineas divisorias, numeracion de
secciones, layout de columnas asimetrico.

Paleta refinada definida en `src/styles/global.css` via `@theme`:

| Token | Color | Uso |
|-------|-------|-----|
| `--color-primary` | #1a2940 (navy calido) | Fondo hero, footer, tipografia destacada |
| `--color-accent` | #b8944c (bronze muted) | Reglas divisorias, numeros, acentos sutiles |
| `--color-neutral-*` | escala 50-900 (taupe calido) | Fondos, texto, bordes |

### Tipografias

| Token | Familia | Uso |
|-------|---------|-----|
| `--font-serif` | Playfair Display | Headings, numeros de seccion |
| `--font-sans` | Inter | Cuerpo, labels, nav |
| `--font-roman` | Cinzel (fallback Trajan Pro) | **Solo** la firma de la escribana |

Cinzel es una digitalizacion de la capital romana inscripcional (misma familia
de formas que Trajan). Se usa en un unico lugar — el nombre bajo la foto en
QuienesSomos — para evocar derecho romano y transmitir solidez. **No replicarla
en otros elementos**: si se repite pierde el efecto y compite con Playfair.

### Reglas de diseno

- Regla dorada fina (`w-16 h-px`) al inicio de cada seccion
- Labels en uppercase con `tracking-[0.3em]`
- Titulos grandes en Playfair Display con `tracking-tight`
- Numeros de seccion en la tipografia serif (01, 02, 03...)
- Sin iconos decorativos: la unica imagen del sitio es el retrato de la escribana
- Bordes sutiles (`divide-x`, `border-t`) en `white/8` o `neutral/200`

### Escala tipografica

La escala se subio un escalon en toda la pagina (`xs`→`sm`, `sm`→`base`,
`base`→`lg`; titulos de seccion `3xl/4xl`→`4xl/5xl`) para mejorar legibilidad.
El minimo para cuerpo de texto es `text-base`; **no volver a `text-sm`** en
parrafos ni en datos de contacto.

### Ritmo vertical

Todas las secciones usan `py-16 md:py-20` (antes `py-24 md:py-32`). El hero es
`min-h-[76vh] md:min-h-[80vh]`, no `min-h-screen`. El footer cierra con `pb-5`
para que el copyright quede contra el borde inferior de la pagina.

## Estructura

```
src/
├── components/
│   ├── Header.astro       → nav + menu movil <details> (sin wordmark ni telefono)
│   ├── WhatsappFab.astro  → boton flotante solo-icono, esquina inferior derecha
│   ├── Hero.astro         → titulo centrado 8xl, regla dorada, grid geometrico
│   ├── QuienesSomos.astro → 2 columnas: texto (7/12) | retrato + firma (5/12)
│   ├── Servicios.astro    → grilla numerada 01-06, hover/scroll-reveal en CSS
│   ├── Faq.astro          → acordeon 01-08 con <details name="faq"> + JSON-LD
│   └── Contacto.astro     → footer navy, datos en grid, franja de mapa full-bleed
├── data/contacto.ts       → fuente unica de telefono, email y URL del mapa
├── layouts/Layout.astro   → base HTML, meta tags, favicons, Google Fonts
├── pages/index.astro      → unica pagina (landing single-page)
└── styles/global.css      → Tailwind v4 + @theme tokens
```

### Datos reales

- Direccion: Av. del Libertador 6328, Buenos Aires
- Coordenadas: -34.55368, -58.45052 (Nominatim, Belgrano/Barrio Chino)
- Telefono y email del header/footer son **placeholders**, falta confirmarlos
- En `Contacto.astro` los datos son enlaces, no texto: direccion → Google Maps,
  telefono → `wa.me`, email → `mailto:`. El numero vive dos veces con formato
  distinto (`phoneDisplay` para mostrar, `phoneWhatsapp` solo digitos para
  `wa.me`): **al reemplazar el placeholder hay que cambiar los dos.**
  `wa.me` quiere codigo de pais y **sin el 15**: `+54 11 4444-5555` → `541144445555`
- Matricula profesional en el footer es placeholder (`N° XXXX`)

### Assets en `public/`

| Archivo | Origen |
|---------|--------|
| `escribana.jpg` | Retrato 768x1024 provisto por el cliente (retocado) |
| `favicon.ico` | Monograma ET, multi-resolucion 16/32/48 |
| `favicon-32.png`, `icon-192.png`, `icon-512.png`, `apple-touch-icon.png` | mismo monograma |

Los favicons se derivaron de un PNG de 1254x1254 recortando el monograma al 88%
del tile (el original tenia ~46% de aire y a 32 px no se leia), con `unsharp` en
los tamanos chicos. Si hay que regenerarlos, el recorte usado fue
`convert origen.png -crop 764x764+258+221`.

`icon-512.png` pesa ~155 KB. Si molesta en el bundle, `pngquant` lo baja a ~20 KB.

## Boton flotante de WhatsApp

`WhatsappFab.astro`, `fixed bottom-right`, `z-40`. Solo el isotipo, sin texto:
el CTA "Consultar" ya esta en el header y repetir la palabra abarataba la pieza.

- El verde de marca (`#25D366`) es neon y rompia la paleta. Se usa
  `--color-whatsapp: #1e6b4f`, mismo matiz pero con el valor bajo del navy.
  La sombra tambien es fria (`rgb(26 41 64 / .55)`), no el gris de un FAB generico.
- Cuadrado, sin `rounded`: **en toda la pagina no hay una sola esquina redondeada.**
- El mensaje precargado sale de `whatsappMessage` en `data/contacto.ts`.
- Chocaba con el boton "Ver en el mapa", que estaba `bottom-right` en la franja
  del mapa: **ese boton se movio a `bottom-left`.** Si se agrega otro elemento
  flotante, revisar esa esquina.

## Ortografia

El sitio usa **tildes y ñ correctas** en todo el texto visible y en los
comentarios. Antes no las tenia (`mas de 20 anos`), lo que en una web
profesional se lee como un error grave — "anos" no significa "años".
Al agregar copy nuevo, mantener la acentuacion.

## Mapa

Se usa el **endpoint legacy de Google Maps sin API key**:

```
https://maps.google.com/maps?q=-34.5537,-58.4505&z=16&hl=es&output=embed
```

Contexto de la decision:

- `/maps/embed?q=...` (primer intento, commit `12643e1`) **no existe**: ese path
  solo acepta `pb=` o su forma oficial `/maps/embed/v1/place?key=...`. Devolvia
  un iframe roto, por eso se migro a OpenStreetMap en `5d5403c`.
- La Embed API oficial es gratis y sin limite de cargas, pero requiere proyecto
  en Google Cloud + key restringida por referrer. Si el legacy deja de funcionar,
  ese es el camino de recambio.
- El legacy es un endpoint no documentado: **si el mapa aparece vacio, revisar
  esto primero.**

Detalles de implementacion:

- Es una **franja horizontal full-bleed** dentro del footer (`h-40 md:h-52`),
  fuera del `max-w-7xl`, con `border-y`.
- `pointer-events: none` + `tabindex="-1"` + `aria-hidden="true"`: el mapa es
  fijo, no se puede arrastrar ni hacer zoom. La navegacion real se ofrece con el
  boton "Ver en el mapa" que abre Google Maps en pestana nueva.
- **Sin filtro CSS.** Antes tenia `grayscale + invert(0.92) + hue-rotate`, que
  era la causa real de que el mapa se viera casi todo negro. Va a color.

## Responsive

Mobile-first: todo el layout arranca en una columna y sube en `sm`/`lg`.
Decisiones que no son obvias leyendo el markup:

- **Menu movil sin JavaScript**: `<details>`/`<summary>` nativo en
  `Header.astro`, con el panel `absolute top-full` (el `<header>` es `absolute`,
  asi que es su bloque contenedor). El `<style>` scoped oculta el marker nativo
  y alterna hamburguesa/cruz con `.menu[open]`. **No reemplazar por JS.**
- **El telefono ya no esta en el header.** La accion principal en movil es el
  FAB de WhatsApp, siempre visible. El boton "Consultar" aparece desde `sm`;
  abajo de eso vive dentro del menu.
- **El header no tiene wordmark**: el nombre ya esta en el `h1` del hero, justo
  debajo. Como el `<header>` es `absolute` y se va con el scroll, no hay ningun
  momento en que la marca haga falta ahi. En movil eso deja el lado izquierdo
  vacio y el hamburguesa solo a la derecha: es intencional.
- **Hover en touch**: Tailwind v4 ya envuelve sus variantes `hover:` en
  `@media (hover: hover)`, asi que el hover pegado no es un problema con
  utilidades. Si con CSS escrito a mano — hay que poner la guarda explicita.
  En `Servicios.astro` el efecto esta partido en dos:
  - `@media (hover: hover) and (pointer: fine)` → destaque al pasar el mouse.
  - `@media (hover: none)` → como no hay puntero, el estado destacado se aplica
    solo (fondo blanco, sombra, regla dorada al 100%), y donde el navegador
    soporta `animation-timeline: view()` (Chrome 115+, Safari 26+) cada tarjeta
    se revela al entrar en pantalla. Sin soporte queda el estado destacado fijo,
    nunca el apagado.
- `prefers-reduced-motion` anula `animation` y `transition` en las tarjetas.

## FAQ

Seccion `#preguntas`, entre Servicios y Contacto. Acordeon de 8 preguntas
numeradas 01-08, **sin JavaScript**: `<details>`/`<summary>` como en el menu
movil. Detalles que no se leen del markup:

- `name="faq"` en cada `<details>` lo convierte en **acordeon exclusivo** nativo
  (se cierra el anterior al abrir otro). Donde no hay soporte (Firefox < 130)
  simplemente quedan varios abiertos: degrada sin romper.
- El indicador `+`/`−` es una cruz dibujada con `::before`/`::after` sobre
  `.faq-icon`; al abrir, la barra vertical colapsa con `scaleY(0)`. **No usar
  utilidades `translate-*` de Tailwind ahi**: en v4 escriben la propiedad
  `translate`, no `transform`, y el toggle deja de funcionar.
- El `<script type="application/ld+json">` con el schema `FAQPage` se genera del
  mismo array `faqs`, asi que las respuestas del sitio y las del structured data
  no pueden desincronizarse. Es un bloque de datos, no JS ejecutable: el build
  sigue emitiendo 0 archivos `.js`.

### Las respuestas son borrador

Ninguna respuesta fue validada por la escribana. Cuatro tienen contenido
sensible que hay que confirmar antes de publicar:

| # | Pregunta | Que confirmar |
|---|----------|---------------|
| 01 | Turnos | Si certificaciones es realmente por orden de llegada |
| 04 | Inmueble en provincia | Redaccion de la competencia territorial (esta escrita como practica, no como regla legal, a proposito) |
| 07 | Sucesiones | Limite entre lo judicial y lo notarial |
| 03 | Gastos de escrituracion | Que no falte ni sobre ningun concepto |

Las respuestas son el corpus de grounding del chatbot de fase 2: por eso cada
una es autocontenida y cubre un solo tema.

## Fase 2 — Chatbot con Groq (pendiente)

Cuando se implemente el chatbot:

1. Re-agregar `@astrojs/react` al `astro.config.mjs` (ya esta instalado)
2. Re-agregar `@astrojs/cloudflare` al `astro.config.mjs` (output: "server")
3. Crear API endpoint para el chat (Worker handler o Astro API route)
4. Crear componente React `ChatWidget.tsx` con `useChat` de AI SDK v5
5. Agregar env secret: `wrangler secret put GROQ_API_KEY`

Referencia: skill `ai-sdk-chatbot-grounded` en brain-data.

## Desarrollo

```bash
pnpm dev --background   # dev server en background
pnpm dev status         # verificar estado
pnpm dev logs           # ver logs
pnpm dev stop           # detener
```
