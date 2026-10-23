# Escribania Tocagni — Landing Page

> **Este archivo es la fuente de verdad del proyecto y se edita a mano.**
> `AGENTS.md` lo genera `brain-agents-inject` en cada SessionStart y se
> sobreescribe entero (no preserva secciones). Antes `CLAUDE.md` era un symlink
> a `AGENTS.md`, asi que la doc del proyecto se perdia en cada sesion. Ahora son
> dos archivos independientes: **la doc del proyecto va aca, nunca en AGENTS.md.**

## Cliente

Escribania (notaria) en Belgrano, Ciudad de Buenos Aires. **Mas de diez anos**
de trayectoria — el sitio decia "veinte" hasta el 2026-08-04, pero el Word con
los textos definitivos dice diez y se respeto lo que escribio la escribana.

Escribana titular: **Ines Tocagni**, Registro Notarial N° 56 (CABA).

Nueve servicios, numerados 01-09 en el sitio: certificaciones, operaciones
inmobiliarias, poderes y autorizaciones, sociedades, sucesiones, planificacion
patrimonial, fideicomisos, actas notariales y desarrollos inmobiliarios.

> El apellido correcto es **Tocagni**. Unificado el 2026-08-04: sitio, Worker,
> directorio del repo y `name` de `package.json` usan todos esa grafia. Si
> aparece "togcani" en algun lado, es un rastro viejo (el diario de brain-data
> registra asi las sesiones anteriores a esa fecha, porque toma el nombre de la
> carpeta).

## Stack

| Capa | Tecnologia |
|------|------------|
| Framework | Astro 7 (SSG, output: "static") |
| Estilos | Tailwind CSS v4 (Vite plugin `@tailwindcss/vite`) |
| Deploy | Cloudflare Workers Static Assets (Wrangler v4) |
| Package | pnpm |
| Lenguaje | TypeScript strict |

**Casi 0 JS en el cliente.** Salvo la isla del chatbot (`ChatWidget.tsx`, ver
"Chatbot" mas abajo), cualquier feature nueva se resuelve con HTML + CSS antes
de considerar JavaScript (ver el menu movil como ejemplo). El `dist` pesa
~384 KB, de los cuales ~300 KB son imagenes.

### Dependencias

- `@astrojs/react` + `react` / `react-dom` — la isla del chatbot (`ChatWidget.tsx`).
- `@astrojs/cloudflare` — adapter para la ruta on-demand `/api/chat`. El resto
  de las paginas sigue pre-renderizado a estatico.
- `ai` + `@ai-sdk/react` + `@ai-sdk/deepseek` — el chat (ver "Chatbot").

No removerlas: sin el adapter no hay endpoint y sin React no hay isla.

## Deploy

```bash
pnpm run build          # genera dist/
pnpm exec wrangler deploy # sube a Cloudflare Workers
```

**En produccion desde el 2026-08-04: https://escribaniatocagni.com**

El dominio es **`.com`** — no se consiguio el `.com.ar`. Vive como custom domain
del Worker, con los nameservers de Cloudflare (`abby`/`ricardo.ns.cloudflare.com`)
y certificado emitido por ellos. El `site` de `astro.config.mjs` es la fuente
unica: de ahi salen el canonical, las etiquetas `og:` y el `@id` del schema.

URL vieja, sigue respondiendo: `https://escribania-tocagni.ethoslogliberty.workers.dev`

### Los dominios se declaran en `wrangler.jsonc`

Apex y `www` son los dos custom domains del Worker y viven en el array `routes`
con `custom_domain: true`. Al deployar, **Cloudflare crea y gestiona los
registros DNS solo** — no hay que tocar el panel de DNS.

- `www` daba **522** cuando era un CNAME hecho a mano: el registro resolvia, pero
  como el hostname no estaba registrado en el Worker, Cloudflare buscaba un
  servidor de origen que no existe. Un CNAME a la raiz no alcanza; el hostname
  tiene que estar en `routes`.
- **`workers_dev: true` esta puesto a proposito.** Declarar `routes` apaga
  workers.dev por defecto y la URL empieza a dar 404 — justo la que sirve para
  verificar deploys sin CDN de por medio.
- No hay redirect de `www` al apex: los dos sirven el mismo HTML y el
  `<link rel="canonical">` le dice a Google cual es la buena.

Cuenta Cloudflare: `ethoslogliberty@gmail.com` (Neo Nach).

> **Cache**: el dominio esta detras del CDN de Cloudflare. Despues de un deploy
> puede seguir sirviendo la version anterior un rato (`cf-cache-status: HIT`).
> Si hay que verificar un cambio recien subido, pegarle a la URL de
> `workers.dev`, que no cachea, o mandar un query string cualquiera.

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
| `--font-roman` | Cinzel (fallback Trajan Pro) | Marca del hero + firma de la escribana |

Cinzel es una digitalizacion de la capital romana inscripcional (misma familia
de formas que Trajan). Evoca derecho romano y transmite solidez. Se usa en
**exactamente dos lugares, y los dos son la marca**:

1. El bloque `Escribanía / TOCAGNI` del hero (`Hero.astro`)
2. La firma `Inés Tocagni` bajo el retrato (`QuienesSomos.astro`)

Decidido con la clienta el 2026-08-04. Pidio que "Tocagni" tuviera la misma
tipografia que "Escribania", en mayuscula, "sin tanto borde redondeado, mas
seriedad y elegancia". Se probaron las tres: Playfair (la serif del resto del
sitio) e Inter en caja alta — Inter cumple lo de "misma tipografia" pero es
geometrica y redonda, que es justo lo que no queria. Cinzel resuelve las tres
cosas y ata el hero con la firma.

**No extenderla a headings de seccion ni a cuerpo de texto**: esos siguen siendo
Playfair e Inter. Si Cinzel aparece en un tercer lugar deja de leerse como marca.

Detalle: las capitales inscripcionales necesitan aire entre letras o se
empastan, por eso el `h1` lleva `tracking-[0.08em]`. El tamano quedo en
`5xl / 6xl / 5rem` (no `8xl` como cuando era Playfair en caja baja: la caja alta
ocupa mucho mas ancho).

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
│   ├── WhatsappFab.astro  → FAB viejo; ya no se importa (ver "Chatbot")
│   ├── ChatWidget.tsx     → isla React: launcher + panel del asistente
│   ├── Hero.astro         → marca centrada en Cinzel caja alta, regla dorada
│   ├── QuienesSomos.astro → 2 columnas: texto (7/12) | retrato + firma (5/12)
│   ├── Servicios.astro    → grilla numerada 01-09, hover/scroll-reveal en CSS
│   ├── Faq.astro          → acordeon 01-10 con <details name="faq"> + JSON-LD
│   ├── Contacto.astro     → footer navy, datos en grid, franja de mapa full-bleed
│   └── Schema.astro       → JSON-LD del negocio (no renderiza nada visible)
├── data/contacto.ts       → fuente unica de telefono, email y URL del mapa
├── data/servicios.ts      → fuente unica de los 9 servicios y las etapas del 09
├── data/faqs.ts           → fuente unica de las 10 FAQ (acordeon + corpus del bot)
├── data/agente.ts         → buildSystemPrompt() del chatbot
├── pages/api/chat.ts      → endpoint on-demand del chat (DeepSeek)
├── layouts/Layout.astro   → base HTML, meta tags, Open Graph, Google Fonts
├── pages/index.astro      → unica pagina (landing single-page)
└── styles/global.css      → Tailwind v4 + @theme tokens
```

### Bloque de contacto

Grilla de dos columnas con **direccion y email a fila completa** (`wide` en
`contactInfo`), y telefono y horario compartiendo la del medio. En media columna
el email largo desbordaba sobre el horario, y cortado en dos se leia raro.
El `<wbr>` despues de la `@` queda como reserva para celulares de 360 px o menos.

### Datos reales

Todos confirmados el 2026-08-04, ya no queda ningun placeholder de contacto.

- Direccion: **Av. del Libertador 6328, piso 5º of. 501 - C.A.B.A.**
- Coordenadas: -34.55368, -58.45052 (Nominatim, Belgrano/Barrio Chino)
- Telefono: **+54 9 11 5527-6746**. Lleva el **9** despues del 54 por ser celular;
  sin eso `wa.me` no abre el chat.
- Email: **administracion@escribaniatocagni.com.ar** (era `info@` hasta el
  2026-09-27, Ines confirmo `administracion@`) — ojo, `.com.ar` mientras que el
  dominio del sitio es `.com`. **No es un error**: se decidio con Ines, la
  casilla no depende del dominio del sitio. Si rebotan mails, mirar esto primero.
- Registro Notarial **N° 56** (CABA). Reemplazo a la "Matricula Profesional
  N° XXXX" que era placeholder.
- En `Contacto.astro` los datos son enlaces, no texto: direccion → Google Maps,
  telefono → `wa.me`, email → `mailto:`. El numero vive dos veces con formato
  distinto (`phoneDisplay` para mostrar, `phoneWhatsapp` solo digitos para
  `wa.me`): **al cambiarlo hay que tocar los dos.**
  `wa.me` quiere codigo de pais y **sin el 15**: `+54 11 4444-5555` → `541144445555`

**Grafia de los ordinales**: la escribana pidio `Nº 56` y `piso 5º`, **sin punto**
(no `N.º` ni `5.º`). Aplica a todo el sitio.

### Assets en `public/`

| Archivo | Origen |
|---------|--------|
| `escribana.jpg` | Retrato 768x1024 provisto por el cliente (retocado) |
| `og.jpg` | Tarjeta social 1200x630, generada (ver abajo) |

**No hay favicon** desde el 2026-08-04: la duena quiere elegir uno y el monograma
ET quedo en pausa. Se borraron los cinco archivos y las cuatro etiquetas
`<link rel=icon>`. **Sacar solo las etiquetas no alcanza**: el navegador pide
`/favicon.ico` por su cuenta y lo usa igual, por eso se borraron los archivos.

Para reponerlos: `git checkout <commit-previo-al-de-remocion> -- public/`, volver
a poner las cuatro etiquetas en `Layout.astro` y el `logo` en `Schema.astro`.
Los favicons viejos se derivaron de un PNG de 1254x1254 recortando el monograma
al 88% del tile (el original tenia ~46% de aire y a 32 px no se leia), con
`unsharp` en los tamanos chicos; el recorte fue
`convert origen.png -crop 764x764+258+221`.

#### `og.jpg` — la tarjeta social

1200x630, misma identidad que el hero: navy `#1a2940`, reglas doradas y la
**Cinzel real** (se bajo el TTF de Google Fonts, no esta instalada en el sistema).
Importa porque **WhatsApp es el canal principal del sitio** y sin `og:image` los
links compartidos salian sin tarjeta. Van tambien `og:image:width/height`, que
WhatsApp necesita para armar la preview.

Si hay que regenerarla, el comando esta en el historial del commit que la
agrego (`convert` con las dos Cinzel y las coordenadas de cada linea).

## Boton flotante de WhatsApp (removido en la rama `chatbot`)

El sitio ya no muestra el `WhatsappFab`: el launcher del chatbot ocupa esa
esquina (`fixed bottom-right`) y el propio panel ofrece la derivacion con el
link "¿Preferis hablar con una persona? WhatsApp". El componente
`WhatsappFab.astro` **sigue en el repo pero ya no se importa** (por si se quiere
volver atras). Historia del FAB, por si se repone:

- `fixed bottom-right`, `z-40`. Solo el isotipo, sin texto: el CTA "Consultar"
  ya esta en el header y repetir la palabra abarataba la pieza.
- El verde de marca (`#25D366`) es neon y rompia la paleta. Se usa
  `--color-whatsapp: #1e6b4f`, mismo matiz pero con el valor bajo del navy.
  La sombra tambien es fria (`rgb(26 41 64 / .55)`), no el gris de un FAB generico.
- Cuadrado, sin `rounded`: **en toda la pagina no hay una sola esquina redondeada.**
  (Excepcion deliberada: el widget del chatbot, que usa `rounded-2xl` para
  sentirse como una caja de chat. El resto del sitio sigue a 90°.)
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
  launcher del chatbot (esquina inferior derecha), siempre visible; el panel del
  asistente ofrece la derivacion a WhatsApp. El boton "Consultar" aparece desde
  `sm`; abajo de eso vive dentro del menu.
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

Seccion `#preguntas`, entre Servicios y Contacto. Acordeon de 10 preguntas
numeradas 01-10, **sin JavaScript**: `<details>`/`<summary>` como en el menu
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

### Las respuestas ya no son borrador

Las 10 preguntas y respuestas las **escribio la propia escribana** (Word
"PAGINA WEB", 2026-08-04). Reemplazaron por completo a las 8 de borrador que
habia antes. **No reescribirlas sin consultarla**: es contenido legal, no copy.

Lo unico que se toco fue puntuacion y ortografia: signos `¿` de apertura que
faltaban, la respuesta 09 que llegaba cortada en "segur" → "segura", tildes que
faltaban ("tramites" → "trámites"), y el imperativo de la 07 pasado a voseo
("Debes concurrir" → "Debés concurrir") para no mezclar tuteo y voseo dentro de
la misma respuesta. Mismo criterio en la bajada de la seccion.

La pregunta 05 (inmueble fuera de CABA) dice que escrituran inmuebles de
cualquier provincia y a la vez que la escritura se otorga en CABA. Leido rapido
suena contradictorio, pero es correcto y **es su redaccion**: se dejo textual.

Las respuestas son el corpus de grounding del chatbot de fase 2: por eso cada
una es autocontenida y cubre un solo tema.

## Servicios y la ficha 09

Grilla de 9 servicios (01-09) en 3 columnas. El **09, Desarrollos Inmobiliarios,
es el unico con ficha ampliada**: su tarjeta lleva un boton "Conoce mas" que
despliega el detalle. Otro `<details>`, sin JavaScript.

- **Solo el boton despliega, no la tarjeta.** El `<summary>` es clickeable por
  definicion, asi que lleva `pointer-events: none` y se le devuelve el puntero
  unicamente a `.dev-label`. No afecta al teclado: el summary sigue tomando foco
  y Enter sigue abriendo.
- **Abierta ocupa el ancho completo** (`.dev[open] { grid-column: 1 / -1 }`):
  en un tercio de columna el detalle quedaba ilegible. Como es la **ultima**
  tarjeta de la grilla, expandirse no reacomoda a ninguna otra. Si algun dia se
  agrega un servicio 10, revisar esto.
- El indicador `+`/`−` **se redefine en `Servicios.astro`**: los estilos de Astro
  son scoped, no se puede reusar el `.faq-icon` de `Faq.astro`.
- La lista "Nuestro acompanamiento comprende" va a **una sola columna a
  proposito**. En dos columnas el navegador la llena de izquierda a derecha y se
  pierde el orden del Word, que es el orden real de las etapas del proyecto.

## SEO y structured data

`Schema.astro` emite un JSON-LD con `@graph`: `WebSite`, el negocio como
`LegalService` + `ProfessionalService`, y una `Person` para Ines con el Registro
Notarial 56 como credencial.

- **Por que importa**: sin esto Google sabe que hay una pagina, pero no que
  detras hay una escribania, donde queda ni a que hora atiende. Es lo que
  alimenta el panel lateral y el paquete local del mapa, y lo que leen los
  agentes cuando alguien pregunta "escribania en Belgrano".
- `LegalService` es lo mas especifico que schema.org tiene para una notaria —
  **no existe un tipo `Notary`**. Por eso se suma `additionalType` apuntando al
  concepto en Wikidata.
- El `hasOfferCatalog` sale del mismo `data/servicios.ts` que pinta la grilla,
  **por eso los servicios se mudaron a un archivo de datos**. Mismo criterio que
  el `FAQPage`: la lista visible y la que leen los buscadores no pueden divergir.
- Es un bloque de datos, no JS ejecutable: **el build sigue emitiendo 0 `.js`**.
- No se puso `postalCode` porque nadie lo confirmo. Mejor omitirlo que inventarlo.

### Pendiente, y no es codigo

1. **Google Business Profile** — para una escribania de barrio pesa mas que todo
   el SEO on-page junto. Lo tiene que hacer Ines con su cuenta y se verifica por
   correo postal a la oficina: tarda una o dos semanas.
   Al 2026-10-10, buscar "escribania tocagni" en Maps no la encuentra. Aparece
   su **estudio anterior, "Marta S. Sengiali" (Reconquista 365)**, que ya no
   existe y que Ines quiere sacar. **Esa ficha no la controla nadie** (no fue
   reclamada), asi que el plan es: sugerir en Maps "Cerrado permanentemente"
   para la vieja y crear una ficha nueva para Libertador 6328. Reclamarla para
   mudarla no sirve: la verificacion postal iria a Reconquista 365.
2. **Google Search Console** — para mandar a indexar. El `sitemap.xml` ya esta
   publicado y listo para enviar.
3. **En Cloudflare**: `http://` **no redirige** a `https://`. El toggle
   *Always Use HTTPS* ya no vive en SSL/TLS → Edge Certificates en el panel
   nuevo: esta en **Rules → Settings**, o se crea con la plantilla de regla
   "Redirigir de HTTP a HTTPS" sin configurar nada. No tiene equivalente en
   `wrangler.jsonc`, hay que hacerlo a mano.

## Chatbot

Asistente de soporte flotante que responde con la informacion del sitio. **En produccion**
(confirmado el 2026-10-10: el sitio sirve el widget y el secret esta cargado).

### Arquitectura

- Proveedor: **DeepSeek** via AI SDK v7 (`ai` + `@ai-sdk/react` + `@ai-sdk/deepseek`).
  Modelo: **`deepseek-flash`**. Ojo: DeepSeek retiro los alias `deepseek-chat` y
  `deepseek-reasoner` (24/07/2026); el vigente es `deepseek-flash`.
- El sitio sigue **pre-renderizado**: se agrego el adapter de Cloudflare y la
  unica ruta on-demand es `/api/chat` (`export const prerender = false`). No se
  paso a `output: "server"`.
- El `wrangler.jsonc` ahora lleva `main: "@astrojs/cloudflare/entrypoints/server"`
  y **ya no tiene el bloque `assets`**: lo genera el build. Despues de tocar
  `wrangler.jsonc` hay que **rebuildear** (el deploy lee `dist/server/wrangler.json`).

### Archivos

| Archivo | Rol |
|---|---|
| `src/data/faqs.ts` | Las 10 FAQ (fuente unica: acordeon + JSON-LD + corpus del bot) |
| `src/data/agente.ts` | `buildSystemPrompt()`: arma el prompt desde `servicios`, `faqs` y `contacto` |
| `src/pages/api/chat.ts` | Endpoint: `streamText` con `deepseek-flash`, topes de historial y largo |
| `src/components/ChatWidget.tsx` | Isla React: launcher cuadrado + panel, con `useChat` |

El corpus **no se escribe a mano**: sale de los mismos archivos que pintan la
pagina, asi que el bot no puede decir algo que la web no diga.

### Secret

- Local: `.dev.vars` (gitignored) con `DEEPSEEK_API_KEY=...`. Sin la key, el
  endpoint devuelve 500 con un mensaje explicito (no queda mudo).
- Produccion: `wrangler secret put DEEPSEEK_API_KEY` (ya cargado).
- El endpoint lee la key de `import { env } from 'cloudflare:workers'` (no
  `Astro.locals.runtime.env`, removido en Astro 6).

### Dev

El dev server del adapter corre en `workerd`. Si lo levanta un agente hay que
saltear el logger JSON: `ASTRO_DEV_BACKGROUND=1 pnpm dev`. Los scripts `dev`,
`build` y `preview` corren `wrangler types` primero (genera
`worker-configuration.d.ts`, gitignored).

Referencia: skill `ai-sdk-chatbot-grounded` en brain-data (adaptada de Groq a DeepSeek).

### Pendiente

- ~~Rate limiting sobre `/api/chat`~~: hecho el 2026-10-23 con el binding `LIMITE_CHAT` (15 mensajes por minuto por IP, `wrangler.jsonc`). Falta verificarlo en produccion despues del deploy.
- Evaluar `session: false` para no provisionar el KV que el adapter crea solo.

## Entorno interno (`/admin`)

Rama `automatizacion`. Plan completo en `docs/plan-automatizacion.md`. El sitio
publico sigue estatico; `/admin/*` y `/api/admin/*` son on-demand y pasan por
`src/middleware.ts`.

- **Datos**: D1 (binding `DB`), esquema en `migrations/`. Local:
  `pnpm exec wrangler d1 migrations apply DB --local`.
- **Login**: Cloudflare Access + tabla `usuarios` (rol `escribana`/`recepcion`).
  El middleware valida el JWT (`src/lib/access.ts`) y falla cerrado si
  `ACCESS_TEAM_DOMAIN`/`ACCESS_AUD` (vars de `wrangler.jsonc`) estan vacias.
  En `astro dev` entra solo como `dev@local`.
- **Mail**: binding `EMAIL` (Cloudflare Email Sending), siempre via
  `src/lib/notificar.ts`. No hay API key.
- **Auditoria**: `src/lib/auditoria.ts`, solo agregar.
- **Consulta del chat -> ficha -> mail**: el modelo NO recibe datos personales.
  Llama a la herramienta `ofrecer_registro` (en `api/chat.ts`; solo clasifica:
  servicio, urgencia, resumen) y el widget dibuja `FormularioConsulta.tsx`, que
  pide nombre y contacto y los manda directo a `/api/consulta` (publico: campo
  trampa, tope de 15 fichas/hora, validacion). Ese endpoint crea la ficha
  (`origen='chat'`), audita y avisa al estudio por mail. Si el mail falla, la
  ficha queda igual (`aviso_fallido` en auditoria).
- **PWA**: `public/panel.webmanifest` (fuera de `/admin` a proposito, para que
  Access no lo bloquee), `public/admin/sw.js` (solo pantalla offline; NO cachea
  datos de clientes). Dictado: `/api/admin/dictar` (Whisper en Workers AI, sin
  `initial_prompt`: con audio sin voz devolvia el prompt como si se hubiera dicho).
- **Excel** (`/admin/excel`): todo en el navegador (`read-excel-file/web-worker`,
  `write-excel-file/universal`; las variantes sin Web Workers a proposito).
  `src/lib/importar.ts` es la logica pura, compartida entre la vista previa
  (cliente) y `api/admin/importar.ts` (servidor, que revalida todo): reconoce
  columnas por sinonimos, parsea fechas (dd/mm/aaaa, serie de Excel, Date) y
  omite duplicados (mismo nombre+contacto+detalle, sin distinguir tildes ni
  mayusculas). **Las fechas se leen con `getUTC*`**: la libreria devuelve
  medianoche UTC y con la hora local de Argentina (UTC-3) el 25 pasa a ser 24.
  Tope de 500 filas y 5 MB. Exportar y volver a importar no pierde datos.
- **Adjuntos**: bucket R2 privado `escribania-tocagni-docs` (binding `DOCS`,
  creado el 2026-10-22). Se suben de a uno a `/api/admin/fichas/[id]/documentos`
  (desde Nueva consulta o desde la ficha) y se sirven solo por
  `/api/admin/documentos/[id]`, detras de Access; cada vista queda en auditoria.
  Tipos por **extension** (`src/lib/documentos.ts`: pdf, fotos, Word, Excel),
  tope de 10 MB. No hay borrado a proposito. En `curl` hay que mandar `Origin`
  (proteccion CSRF de Astro); un navegador lo manda solo.
- **Expedientes** (`/admin/expedientes`): documentos por carpeta (columna
  `documentos.categoria`, migracion `0002`). Las categorias, la lista de
  documentos **sugeridos por servicio** y el clasificador por nombre de archivo
  viven en `src/data/expediente.ts`. **Las listas por servicio son un borrador
  mio, no criterio juridico: hay que validarlas con Ines** (la pantalla lo dice).
  Falta: entidad "cliente" (hoy un expediente = una ficha) y borrado de archivos.
- **Nueva consulta asistida** (`/admin/nueva`): se cuenta el caso (voz, texto
  o archivos) y `POST /api/admin/extraer` devuelve la ficha armada (nombre,
  contacto, trámite, urgencia, resumen). Usa **Workers AI**
  (`@cf/meta/llama-3.3-70b-instruct-fp8-fast`, JSON schema), el mismo servicio
  que el dictado: los datos del cliente no salen de Cloudflare. Si el modelo
  falla cae a reglas (`src/lib/extraer.ts`). La salida se valida campo a campo y
  nunca se guarda sola: la persona confirma. El prompt aclara que pedir un
  "certificado" dentro de una compraventa no es el servicio 01 (el modelo lo
  confundia). Estilo compartido del panel en `src/styles/panel.css`.
- **Contactar a quien consulta**: el campo "Telefono o mail" es texto libre;
  `src/lib/contacto.ts` lo interpreta y `BotonesContacto.astro` arma WhatsApp
  (`wa.me/549...` con el 0 y el 15 sacados, igual que pide el sitio publico),
  mail y "Llamar" (este ultimo solo en telefonos: `tel:` en escritorio dispara
  `xdg-open` y no hace nada). Si el numero no es un celular reconocible (p. ej.
  fijo sin codigo de area) no se inventa un WhatsApp: se avisa.
- **Local**: el binding `EMAIL` se simula (no sale ningun mail; el contenido se
  guarda en `.wrangler/tmp/email`). `AI` siempre pega a Cloudflare (cobra poco).
  Typecheck: `pnpm --package=typescript@5 dlx tsc --noEmit` (el build de Astro
  no chequea tipos).
- **Recursos en Cloudflare** (cuenta Neo Nach, `CLOUDFLARE_ACCOUNT_ID=0b9fa37f...`;
  hay tres cuentas, wrangler necesita ese env): D1 `escribania-tocagni` creada y
  migrada el 2026-10-22; Email Sending habilitado para `escribaniatocagni.com`.
  Usuarios cargados en remoto: desarrollador (Ignacio) y recepcion
  (`administracion@`) e Ines (`escribana`, desde el 2026-10-23).
- **Access: hecho.** App `escribaniatocagni.com` con los destinos `/admin*` y
  `/api/admin*` (apex y `www`) y la politica "estudio" (Allow por mail:
  Ignacio, `administracion@`, y `ines.tocagni@gmail.com`, el 2026-10-23). Login con
  One-time PIN. `ACCESS_TEAM_DOMAIN`/`ACCESS_AUD` ya estan en `wrangler.jsonc`.
  **Alta de un usuario nuevo = dos pasos**: agregar el mail a la politica de Access
  y una fila en `usuarios` (D1 remota); con solo uno de los dos no entra.
  Inés esta cargada en `usuarios` con rol `escribana`.
- **Asistente del panel** (`components/Asistente.astro`, montado en `AdminLayout`):
  cajon de chat en todas las pantallas (boton flotante, Ctrl K), con streaming.
  `api/admin/asistente.ts` arma el prompt con los datos de la pantalla que lee
  `lib/contexto-asistente.ts` (ficha, vencimientos, turnos; el navegador manda solo
  la ruta). Usa **Workers AI**, no DeepSeek: los datos de clientes no salen de
  Cloudflare, y el chat publico (DeepSeek) nunca los recibe.
  - **Puede actuar, pero nunca solo.** El modelo cierra con lineas
    `ACCION: {json}`; el cliente las convierte en tarjetas "Confirmar/Descartar".
    `api/admin/asistente-accion.ts` valida (`lib/acciones.ts`) en dos pasos: `prever`
    describe sin tocar nada y, al confirmar, `ejecutar` vuelve a validar. Un dato de
    cliente con instrucciones escondidas no mueve nada sin un clic. Acciones: crear
    consulta, estado, urgencia, tramite, nota, crear/resolver vencimiento,
    crear/cancelar turno. **No hay borrado, a proposito.** Cada accion queda en
    auditoria con `via: asistente`.
  - Si se agrega un tipo de accion hay que tocar tres lugares: el tipo y `validar`/
    `prever`/`ejecutar` en `lib/acciones.ts` y la lista del prompt en `asistente.ts`.
  - Formato de las propuestas: `ACCION: tipo=turno_crear; fecha=...; hora=...` (clave=valor).
    Se paso de JSON a esto porque el modelo escribia mal las comillas y las tarjetas
    se perdian; el cliente igual acepta JSON si llega.
  - **Fechas inventadas**: en `turno_crear` y `vencimiento_crear` el modelo debe mandar
    `cita`, la frase exacta de la persona que dice la fecha/hora. `asistente-accion.ts`
    la busca en lo que la persona escribio (`dichos`) y si no esta descarta la
    propuesta. Antes el asistente preguntaba "¿que fecha?" y a la vez proponia un
    turno inventado (visto en produccion el 2026-10-23).
  - **Voz**: el cajon tiene microfono (graba, `/api/admin/dictar`, y envia solo).
  - En **Nueva consulta** el mismo `extraer.ts` ademas contesta preguntas
    (`respuesta`) con servicios, FAQ y la lista de documentos de `expediente.ts`.
  - Las listas de documentos por trámite siguen siendo un **borrador sin validar con
    Ines**, y ahora el asistente las repite (siempre como "orientativas").
- **Telefono**: revisado a 390 px con un Chrome simulado (playwright-core contra
  `astro dev`). Barra inferior de 6 items con etiquetas cortas ("Nueva"), botones
  de al menos 44 px, boton del asistente circular en movil. **No se probo en un
  telefono real** (teclado, notch, microfono).
- **Backups**: D1 tiene Time Travel (restauracion a un punto de los ultimos 30
  dias: `wrangler d1 time-travel restore`). R2 **no** tiene versionado ni copia:
  un archivo subido solo vive ahi.
- **Mail**: sale por Cloudflare Email Sending (`avisos@escribaniatocagni.com`), no
  por Resend. El DNS esta en Cloudflare aunque el registro del dominio sea otro.
- **Pendiente antes de presentarlo**: deploy y prueba en produccion, prueba del
  login de Ines, mail real del aviso de consulta, listas de documentos validadas
  por Ines, prueba en telefono real. El proyecto **no tiene tests automaticos**.

## Desarrollo

```bash
pnpm dev --background   # dev server en background
pnpm dev status         # verificar estado
pnpm dev logs           # ver logs
pnpm dev stop           # detener
```
