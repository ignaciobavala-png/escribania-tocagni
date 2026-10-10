# AGENTS.md — Escribanía Tocagni

> Generado automáticamente por brain-agents-inject desde brain-data.
> No editar manualmente — se sobreescribe al abrir Claude Code.

## Proyecto

| Campo | Valor |
|-------|-------|
| Nombre | Escribanía Tocagni |
| Tipo | Landing |
| Cliente | Escribanía Tocagni |
| Stack | Astro 7.1.6 + React 19.2.8 + Tailwind + Wrangler / Cloudflare + Cloudflare + AI SDK |
| Estado | pausado |
| Último commit | 2026-09-23 |

## Perfil del desarrollador

# SKILL — perfil-desarrollador

## Descripción
Perfil técnico del desarrollador Ignacio Bavala. Define el stack tecnológico, convenciones y preferencias para cualquier proyecto nuevo.

## Cuándo usarla
- Al iniciar un proyecto nuevo
- Cuando necesites saber qué stack usar por defecto
- Para mantener consistencia tecnológica entre proyectos

## Cómo dirigirse a él

**Ignacio es hombre.** En español rioplatense los adjetivos van en masculino:
"vos solo", "quedaste tranquilo", "avisame cuando estés listo". Ojo con las
concordancias que se cuelan al escribir rápido ("sola", "lista", "preparada").

Tuteo con voseo, registro directo, sin formalismos.

## Cómo entregar lo que se produce

**Los entregables van como archivos locales, en la ruta que él pida.** Si pide
"dejámelo en el escritorio", eso es el entregable completo — no hay que
complementarlo publicándolo en ningún lado.

**No publicar artifacts ni subir nada a un servicio externo sin preguntar.**
Dicho por Ignacio el 19/08/2026, después de que se publicara un instructivo para
un cliente suyo sin consultarlo. El razonamiento de que "un link se comparte más
cómodo que un adjunto" puede ser cierto, pero **cómo se distribuye material de
un cliente es decisión de él, no del agente**, y publicar manda contenido a un
servicio externo. Si parece que un link ayudaría, se ofrece y se espera el sí.

Corolario práctico: un HTML que se va a mandar por WhatsApp conviene que sea
**liviano**. Un logo PNG embebido en base64 infla el archivo ~1,33x sobre el peso
del PNG (75 KB → 100 KB). Preferir SVG embebido o tipografía.

## Stack por defecto para nuevos proyectos

```
Framework:    Next.js 16 (App Router)
UI:           React 19 + Tailwind CSS v4 + Framer Motion v12
Estado:       Zustand v5
DB:           Supabase (PostgreSQL + Auth + Storage + RLS)
Deploy:       Vercel (cuenta Pro — sin límite de frecuencia de crons)
Package:      pnpm
Linting:      ESLint 9 (flat config)
Lenguaje:     TypeScript strict
```

**Páginas livianas → Cloudflare** (Workers + Static Assets, D1/SQLite opcional, wrangler v4),
en vez de Next.js+Supabase+Vercel. Para arrancar cualquiera de los dos: scaffold
[[scaffold-nextjs-supabase]] (`kickstart`, targets `vercel` y `cloudflare`).

## Convenciones

- Server Components por defecto, Client Components solo cuando hay interactividad
- State global con Zustand v5 (no Context a menos que sea trivial)
- Animaciones con Framer Motion v12
- Estilos con Tailwind v4, configuración vía CSS `@theme` tokens
- Migraciones SQL como archivos `.sql` planos
- `vercel.json` con crons para keep-alive de Supabase
- Cada proyecto necesita su `AGENTS.md`
- **Next.js 16**: `middleware.ts` fue renombrado a `proxy.ts`; exportar `export function proxy(request)` en vez de `middleware`. Runtime Node.js por defecto. Codemod: `npx @next/codemod@canary middleware-to-proxy .`
- Sin testing, sin Docker
- Sin CSS-in-JS más allá de Tailwind
- `@/*` como path alias (apunta a `./*` o `./src/*`)
- **No subir binarios a git/GitHub** (fonts, imágenes pesadas, videos, PDFs): no se comprimen, no se pueden diffear, inflan el clone para siempre aunque se borren después, y hay límites duros de tamaño en GitHub. Para assets de proyecto usar Supabase Storage o Vercel Blob y referenciar por URL. Excepción: binarios chicos e imprescindibles para el build (ej. un logo o una fuente puntual) pueden ir directo al repo.

## Herramientas propias (~/bin)

Los scripts viven en `~/bin`, **fuera del vault** (nunca se suben a GitHub). Acá va
lo mínimo para saber que existen; el detalle completo está en [[areas/sistema-agente]].

- **`recibo`** — genera recibos de pago en HTML + PDF con el formato estándar de
  Ignacio (número, "Recibí de", monto en letras, "En concepto de", tabla
  total/seña/saldo, disclaimer "No válido como factura"). Usar cuando pidan emitir
  un recibo o seña de un cobro:
  `recibo --cliente "Escuela Sónica" --suma 200 --total 650 --moneda USD --concepto "Seña ..."`.
  El número auto-incrementa y los montos pasan a letras en español (pesos/dólares).

## ESLint

Usar flat config (`eslint.config.mjs`) con la config nativa de Next 16
(`FlatCompat` legacy rompe con `eslint-config-next@16`):

```js
import { defineConfig, globalIgnores } from "eslint/config"
import nextVitals from "eslint-config-next/core-web-vitals"
import nextTs from "eslint-config-next/typescript"

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
])

export default eslintConfig
```

## El texto de la clienta no cambia de caja

Cuando un texto lo escribió la clienta, se renderiza **literal**: nada de
`capitalize`, `uppercase` ni una segunda copia "prolija" del mismo string. Si la
UI necesita mostrarlo en otro lado (una lista, un chip, una animación), muestra
el mismo string, no una variante.

El caso que lo motivó (Cosmic Eagle, 15/09/26): el `ScrollStory` de la home tenía
por frase resaltada dos strings, `text` (dentro del párrafo) y `label` (en la
lista final, en capitular). La frase *viaja* del párrafo al centro, así que el
cambio de caja se veía a mitad de camino. Se colapsó a un solo campo.

Y la regla de trabajo que va con esto: **si aparece una inconsistencia de estilo,
marcarla en vez de imitarla.** No asumir que hubo una decisión de diseño detrás —
puede ser un despiste. Ignacio prefiere que se le avise y decide él.

## Frontend antes de tener la API key: mock visible, no bloquear

Cuando se integra una API externa nueva y todavía no hay credencial (`EIA_API_KEY`,
etc.), no hace falta esperar a tenerla para avanzar el frontend. Se cablea el
endpoint real de punta a punta y, mientras falte la key, se sirve un mock desde
el mismo módulo — con un indicador visible en la UI (ej. badge "MOCK") para que
nunca se confunda con dato real. Caso: `curso-apis`, integración EIA/WTI
(19/09/26) — el backend ya devolvía el error esperado sin key, y el mock permitió
revisar la UI esa misma sesión sin frenar en el pendiente de generar la key.

## Skills relevantes para este proyecto

Ruta de cada skill: `/home/nch/Escritorio/brain-data/skills/<nombre>/SKILL.md`

Esto es un índice, no el contenido. Leer el archivo completo solo si la tarea actual lo requiere.

- `tiquetera-vite-supabase` — **Tiquetera Vite + Supabase — bugs silenciosos y patrones seguros**
  Al trabajar en cualquier sistema de tickets/entradas con: localStorage como caché de tickets en el cliente…
- `cloudflare-wrangler-deploy` — **Cloudflare Wrangler — setup, assets estáticos y deploy seguro**
  Al **conectar un dominio a un Worker o a un proyecto de Pages** (incluido el apex que queda "Inactivo" / pide…
- `client-side-image-compress` — **Comprimir imágenes client-side antes de subir al storage**
  Siempre que se implemente un uploader de imágenes (flyers, avatares, fondos, productos, etc.). Sin…
- `scroll-driven-animations-no-confiar` — **No colgar un efecto central de animation-timeline scroll()**
  Cuando el efecto de scroll (hero que se atraviesa, parallax, barra de progreso, texto que se destila) **es**…
- `cloudflare-email-routing-send-email` — **Cloudflare Email Routing + binding send_email (formulario de contacto sin servicio externo)**
  Cuando un dominio propio necesita recibir mail sin contratar casilla, o cuando un formulario de contacto…
- `nextjs-app-router-patterns` — **Next.js 16 — App Router patterns y convenciones**
  Al iniciar o trabajar en cualquier proyecto Next.js: estructura de rutas, data fetching, Server Actions…
- `criterio-visual-frontend` — **Criterio visual — cómo no entregar una página con cara de IA**
  Al generar o revisar **el diseño visual** de una landing, portfolio, home de negocio local o rediseño…
- `tailwindcss-mobile-first` — **Tailwind CSS v4 — configuración y patrones mobile-first**
  Al configurar Tailwind v4 en un proyecto nuevo, definir tokens de diseño, o implementar layouts responsivos.…
- `landing-conversion-sin-framework` — **Landing que convierte sin framework — CTA, servicios por resultado, FAQ y movimiento**
  Al armar o revisar una landing de servicios (propia o de cliente) donde el objetivo es que el visitante…
- `vercel-dominio-cert-sin-emitir` — **Dominio agregado en Vercel antes de que exista el DNS: queda verified pero sin certificado, y no reintenta**
  Cuando se activa un dominio o subdominio nuevo en Vercel y el navegador muestra "la conexión no es segura" /…
- `auditoria-responsive-chrome-headless` — **Auditar responsividad mobile con Chrome headless (sin extensión ni Playwright)**
  Cuando hay que responder "¿esto anda en teléfono?" y **no** está disponible la extensión de Claude in Chrome…
- `ingesta-listado-erp-cloudflare-free` — **Ingesta del listado del ERP a Cloudflare D1 (plan Free)**
  Al ingerir periódicamente una planilla/archivo del ERP (stock, precios, catálogo) en una app sobre Cloudflare…
- `scaffold-nextjs-supabase` — **Scaffold Next.js 16 + Supabase (kickstart)**
  Al arrancar cualquier proyecto nuevo. En vez de re-hacer el setup a mano y re-debuggear los mismos bugs…
- `precio-usd-cobro-pesos-cotizacion` — **Publicar en USD y cobrar en pesos — cotización en cascada, una sola vez por request y congelada en la orden**
  Cuando el negocio razona en dólares (importados: vinilo, indumentaria, electrónica) pero cobra en pesos.…
- `css-print-layout-scroll` — **Imprimir dentro de un layout con scroll interno (h-screen + overflow)**
  Cuando `window.print()` (o Ctrl+P) sale **cortado en una sola hoja** en vez de paginar, y la página vive…
- `cloudflare-d1-migrations` — **Cloudflare D1 — Migraciones y patrones SQLite**
  Cualquier proyecto con Cloudflare D1 (SQLite) que necesite migraciones de schema, especialmente cambios que…
- `iframe-tercero-breakpoint-del-proveedor` — **Embeber un checkout/widget de terceros — el ancho del contenedor lo manda el breakpoint del proveedor**
  Cuando se embebe en un iframe el checkout, formulario o widget de otro producto (ticketeras, pasarelas de…
- `ai-sdk-chatbot-grounded` — **Chatbot FAQ grounded con AI SDK v5 + Groq (widget Q&A)**
  Al agregar un widget de preguntas frecuentes / asistente virtual a un sitio, cuando la respuesta debe estar…
- `flotante-frena-antes-del-footer` — **Botón flotante que frena antes del footer — sticky en un carril, no JS atado al scroll**
  Cuando un elemento `position: fixed` en una esquina —burbuja de chat, CTA flotante, botón de WhatsApp…
- `jeeliz-web-ar-tryon` — **Jeeliz FaceFilter + Three.js — Web AR try-on**
  Al integrar el face tracker Jeeliz FaceFilter con Three.js en una app React (Vite) para probadores virtuales…
- `nextjs-persistent-shell-nav` — **Navegación con shell persistente (route group + framer-motion)**
  Cuando querés que la navegación entre páginas se sienta como **un mismo espacio que muta** (sensación "redes…
- `vercel-react-best-practices` — **Vercel + React — performance y patrones críticos**
  Al optimizar una página lenta, reducir el bundle, revisar re-renders, o hacer deploy en Vercel.
- `css-hover-dropdown-gap` — **Dropdown de navbar por :hover — se cierra antes de tiempo, o queda clavado**
  Cuando un menú desplegable de navbar (categorías, "más opciones", etc.) se abre con `:hover` puro (sin JS) y…
- `tailwind-clases-conflicto-orden-hoja` — **Bug silencioso — `hidden` no oculta si el componente ya trae `flex`/`inline-flex` en su base**
  Cada vez que un componente propio arme su `class` concatenando una base fija con un `className` que recibe…
- `fondo-full-bleed-recorte-y-mascara` — **Fondo full-bleed — dónde recorta `object-cover` y sobre qué caja se miden los % de la máscara**
  Al montar una sección con imagen de fondo a todo el ancho: un hero, un slide de diseño, un banner. Dos cosas…
- `busqueda-catalogo-bundle-componentes` — **Buscador y filtros de un catálogo que vende bundles — mirar los componentes, no solo la fila vendible**
  Cuando un catálogo deja de vender ítems sueltos y pasa a vender **paquetes/boxes/packs** (varios productos…
- `input-file-hidden-click-ios-webview` — **\"El botón de subir foto no hace nada\" — input file con display:none + .click() por JS**
  Cuando el cliente/usuario reporta que **aprieta "Subir foto" y no pasa nada**: no abre el selector de…
- `logo-png-padding-alpha` — **Logo PNG que se ve chico — padding alfa dentro del archivo**
  Cuando ponés un logo que mandó un diseñador (PNG/WebP con transparencia) en un navbar, footer o card, lo…
- `sqlite-insert-or-replace-reordena` — **INSERT OR REPLACE borra la fila — reordena el listado y pisa lo editado a mano**
  Cualquier script de import/seed idempotente sobre SQLite o **Cloudflare D1** que use `INSERT OR REPLACE` (o…
- `hover-touch-tailwind-v4` — **Hover en touch — Tailwind v4 ya lo protege, tu CSS a mano no**
  Al hacer tarjetas, grillas de servicios o cualquier elemento con efecto de hover que también se va a ver en…
- `vercel-deploy-deduplicado-arbol-identico` — **Vercel deduplica deploys por árbol idéntico y producción no se rebuildea**
  Cuando se pushea a `main` (o a la rama de producción) y **no aparece ningún deploy de producción nuevo** en…
- `youtube-embed-facade` — **Embeber YouTube sin pagar 1.3 MB — facade, ID normalizado y playlists**
  Al poner un reproductor de YouTube en una ficha de producto, un post o una landing — sobre todo si el link lo…
- `alineacion-ancho-contenido-por-seccion` — **Landing de secciones apiladas — el ancho de contenido tiene que salir de una sola fuente, no repetirse por sección**
  Al armar cualquier página de una sola pantalla larga con secciones apiladas (landing, "scrollytelling"…
- `deco-flotante-gutter` — **Decoración flotante que se monta sobre el contenido — capear el ancho con el gutter, no el z-index**
  Cuando el cliente reporta que una figura decorativa —un 3D, una ilustración, un personaje— **se superpone con…
- `backdrop-filter-fixed-menu-clipped` — **backdrop-filter (o filter) en el header confina los hijos position:fixed a su propia caja**
  Cuando un menú mobile (burger menu / overlay `position: fixed; inset: 0`) reportado como "no despliega bien"…
- `details-solo-el-boton-abre` — **<details> donde solo un botón abre, y que se expanda a todo el ancho de la grilla**
  Cuando hay que hacer un acordeón, una ficha ampliada o un "ver más" **sin JavaScript**, y aparece alguno de…
- `css-marquee-infinito-dos-tracks` — **Marquee CSS infinito — dos tracks, no uno animado a -50%**
  Cuando hay una franja de texto que scrollea en loop (ticker de promos, "envío gratis", mensajes de marca) y…
- `carrusel-deriva-automatica` — **Carrusel que se mueve solo — sub-píxel, scroll-snap y el retroceso al pausar**
  Cuando hay que hacer que una tira horizontal avance sola —para que quien no scrollea se entere de que hay…
- `gate-por-scroll-sin-overflow` — **Gate por scroll — el botón queda muerto cuando el texto entra sin scrollear**
  Cada vez que un botón se habilite **recién cuando el usuario llegó al final de un texto**: aceptar términos y…
- `title-rule-adaptive-width` — **Filete adaptativo con desvanecimiento asimétrico**
  Cuando necesitas una línea decorativa (filete, rule, underline) debajo de títulos o secciones que: Se adapte…
- `drawer-guardar-sin-propagar-estado` — **Guardar en un drawer/modal sin propagar al listado — "guardo y sigue el valor viejo**
  Cuando el cliente/admin reporta: **"edito, pongo guardar, dice guardado, y sigue apareciendo lo viejo.…
- `inputs-decimales-coma-es-ar` — **Inputs decimales en es-AR — coma como separador y estado string**
  Siempre que un formulario React/Next.js tenga campos numéricos con decimales (dimensiones, peso, precios…
- `astro-supabase-frontera-de-datos` — **Astro + Supabase — frontera de datos para enchufar el backend sin reestructurar**
  Cuando hay que construir el frontend de un sitio **Astro** antes de tener la cuenta/proyecto de Supabase, y…
- `sprites-por-cunas-costura-alfa` — **Partir una foto en sprites por cuñas sin que se vea la costura**
  Cuando hace falta una secuencia de estados de un objeto (una flor con 5, 4, 3… pétalos; una torta a la que se…
- `ruta-publica-sirve-bucket-entero` — **Archivo privado nuevo en un bucket que ya tenía ruta pública — la ruta vieja lo sirve**
  Cuando se agrega un **tipo de archivo nuevo** (comprobantes de pago, DNI, contratos, exports) a un…
- `carousel-framer-motion-aspect-ratio` — **Carrusel full-bleed con relación de aspecto fija (Framer Motion)**
  Cuando necesitas un carrusel que: Pase diapositivas automáticamente con transiciones fluidas Respete una…
- `vercel-hobby-limites-rompen-deploy` — **Vercel Hobby — los límites del plan rechazan el deploy entero, previews incluidos**
  Antes de deployar a una cuenta de Vercel **que no es la tuya** —la del cliente, sobre todo si es…
- `degrade-decorativo-rompe-contraste` — **El degradé decorativo de una card tira el contraste del texto abajo del mínimo**
  Al poner texto sobre una **superficie de color con degradé** —cards de color plano a las que se les agrega…
- `modal-scroll-centrado-corta-arriba` — **Modal centrado que se corta arriba en desktop (overflow + items-center)**
  Cuando un modal/dialog **se ve perfecto en mobile pero en desktop aparece cortado por arriba** y no hay forma…
- `claude-md-symlink-agents-sobreescrito` — **CLAUDE.md como symlink a AGENTS.md — la doc del proyecto se borra sola**
  Al documentar cualquier proyecto que tenga `AGENTS.md` generado por `brain-agents-inject` Cuando aparece un…
- `panel-foto-en-el-hueco` — **Panel de contenido — la foto se sube en su hueco, no en una biblioteca**
  Al diseñar la parte de imágenes de un panel de contenido propio (admin de un sitio, CMS a medida), o cuando…
- `tarjeta-button-centrado-vertical` — **Tarjeta hecha con <button> — el navegador le centra el contenido y la desalinea**
  Cuando en una fila o grilla de tarjetas **una sola** aparece corrida hacia abajo respecto de las otras, y el…
- `google-maps-embed-sin-key` — **Embeber un mapa sin API key — los tres endpoints de Google Maps**
  Al poner un mapa en una landing (contacto, sucursal, oficina) sin querer montar un proyecto en Google Cloud.…
- `clonar-wordpress-elementor-estatico` — **Clonar una home de WordPress + Elementor como estático idéntico (respaldo si el WP se cae)**
  Cuando el sitio viejo de un cliente (WordPress + Elementor/WooCommerce) se cae o puede caerse y hay que tener…
- `editor-de-lista-en-un-form-server-action` — **Editor de lista dentro de un form con server action**
  Cuando un formulario tiene que editar una **lista de filas** (un programa de horarios, ítems de un…
- `env-var-parity-branch-deploy` — **Paridad de env vars al mergear una rama a producción**
  Antes de mergear/pushear a `main` (o al proyecto de Vercel que sirve producción) una rama que estuvo en…
- `react-valor-anterior-estado-no-ref` — **Valor anterior en React — estado, no ref, si se lee en el render**
  Cuando el render necesita comparar **el valor actual contra el anterior**: un carrusel que decide si un item…
- `astro-session-get-async` — **Astro sessions — get() es async y el await que falta no da error**
  Cuando implementes login/sesión con `Astro.session` (driver KV de Cloudflare) en Astro y el flujo **parezca…
- `email-boton-fondo-blanco-mobile` — **Botón de mail con fondo blanco en el celular — bgcolor y color-scheme**
  Un mail HTML se ve bien en escritorio pero en el celular un botón (o cualquier bloque de color) aparece con…
- `z-index-negativo-fondo-body` — **El z-index negativo desaparece detrás del fondo del body**
  Cuando una imagen o capa de fondo puesta con `z-index: -1` / `-z-10` **no se ve**, y el sitio tiene un…
- `grid-hairlines-responsive-nth-child` — **Grillas con hairlines responsivas — reaplicar bordes en cada media query**
  Diseños "caged" / brutalistas donde las líneas de 1px entre celdas se dibujan con `border-top` /…
- `astro-checkorigin-content-type` — **Astro checkOrigin — solo bloquea POSTs con content-type de formulario**
  Antes de escribir un endpoint en Astro SSR que reciba POSTs de **terceros** (webhooks de pasarelas, callbacks…
- `overflow-clip-vs-hidden-scroll-horizontal` — **Scroll horizontal en mobile — overflow-x-clip vs overflow-hidden**
  Cuando en el teléfono **toda la página se mueve para los costados** y no se encuentra el culpable, o cuando…
- `react-odontogram-teeth-conditions` — **react-odontogram teethConditions espera nombres internos**
  Estás usando `react-odontogram` (v0.6.0, MIT) para pintar hallazgos sobre el odontograma (caries…
- `react-loading-vs-empty-state` — **Loading state vs empty state en fetch hooks**
  Cuando escribas un hook que fetch datos asincronos y retorna un estado que el componente usa para renderizar.…
- `woocommerce-store-api-headless` — **WooCommerce headless con el Store API**
  Cuando hay que armar una vidriera (Astro, Next, SvelteKit) contra un WordPress + WooCommerce que sigue siendo…
- `astro-partial-htmx-doctype` — **Fragmentos de htmx en Astro — sin `export const partial = true` viene con doctype**
  Al crear cualquier ruta de Astro cuyo destino sea que htmx (o un `fetch` + `innerHTML`) inserte el resultado…
- `tailwind-v4-root-absorption` — **Tailwind v4 descarta bloques :root sueltos en CSS de usuario**
  Cuando escribes custom properties (variables CSS) en un bloque `:root` en tu CSS global con Tailwind v4 y…
- `filtro-sobre-la-misma-tabla-no-dos-secciones` — **Cuando el cliente pide "dos secciones", casi siempre es un filtro sobre la misma tabla**
  El cliente pide separar el contenido en dos: "retiros" y "ceremonias", "productos" y "servicios", "cursos" y…
- `vercel-ls-crea-proyecto-fantasma` — **`vercel ls` en un directorio sin linkear crea un proyecto fantasma y lo conecta a GitHub**
  Antes de correr **cualquier** comando de la CLI de Vercel en un repo que todavía no tiene…
- `astro-cloudflare-imageservice-runtime` — **Astro + Cloudflare — las imágenes se optimizan en runtime sin avisar**
  Cualquier proyecto Astro con `@astrojs/cloudflare` que use `astro:assets` (`<Image>` / `<Picture>`)…
- `aspect-ratio-cabe-en-viewport` — **Video 16:9 que entre en pantalla — capear ancho, no alto, y usar svh**
  Un player, hero o cualquier caja con relación de aspecto fija que tiene que entrar completa en el primer…
- `sharp-vercel-pnpm-tracing` — **sharp en Vercel con pnpm — binarios nativos que no llegan al bundle**
  Cuando una ruta API de Next.js que usa `sharp` funciona en local pero en Vercel tira `ERR_DLOPEN_FAILED`…
- `r2-clave-con-espacios-url-pathname` — **La foto se subió pero da 404 — clave de R2 con espacios y pathname sin decodificar**
  Cuando el cliente dice **"no me deja subir la foto"** pero en la DB la fila **sí** tiene la URL nueva y el…
- `astro-picture-import-tapado-por-map` — **Astro — import de imagen tapado por la variable del map**
  Cuando `<Image>` o `<Picture>` de `astro:assets` rompe el build con: ``` Received unsupported format…
- `texto-descifrandose-scramble` — **Texto que entra "descifrándose" (scramble) sin que salte ni se trabe**
  Al animar una frase de hero o un título que aparece "decodificándose" (letras que ciclan caracteres al azar…
- `astro-dev-logger-json-agente-workerd` — **Astro 7 + Cloudflare — 500 en todas las rutas cuando el dev server lo corre un agente**
  Levantás `pnpm dev` desde Claude Code (o cualquier agente) en un proyecto **Astro 7 + `@astrojs/cloudflare`**…
- `capitalize-articulos-css` — **Capitulización correcta de frases con artículos en CSS**
  **Copywriting dinámico** con textos que el cliente puede editar **Listas de conceptos o keywords** extraídos…
- `css-texto-redondeado-difuso` — **Texto con esquinas redondeadas y borde difuso (filtro SVG "gooey")**
  Cuando un diseño pide un título con look "derretido": todas las esquinas redondeadas (también las de…
- `hono-set-signed-cookie-async` — **Hono setSignedCookie async sin await rompe cookies silenciosamente**
  Cuando uses `setSignedCookie` de Hono para auth con cookies firmadas y el login parezca funcionar (redirige)…
- `cloudflare-d1-dev-local-vs-produccion` — **D1/R2 en dev local no ve los datos de producción**
  Un proyecto en Astro/Cloudflare (Workers + D1 + R2) donde **en local se ve distinto que en producción**…
- `datetime-local-utc-bug` — **Bug silencioso de datetime-local con timestamps UTC**
  Siempre que un form tenga `<input type="datetime-local">` cuyo valor se carga desde un timestamp guardado en…
- `intersection-observer-rootmargin-negativo` — **rootMargin negativo que se arma con un template string**
  Al escribir o revisar un `IntersectionObserver` cuyo `rootMargin` se calcula en runtime —el caso típico…
- `react19-form-action-reset` — **React 19 vacía el formulario después de cada action, también con error**
  Cuando armes un formulario con `<form action={formAction}>` y `useActionState` que puede volver con error…
- `button-carousel-align-items-start` — **Alineación vertical de botones en carruseles flex**
  Cuando tienes un carrusel (Embla, Swiper, o flex manual) con items que son `<button>`, y notas desalineación…
- `verificacion-que-compara-vacio` — **Verificación que compara vacío contra vacío — el diff "idéntico" que no miró nada**
  Cada vez que se confirme un cambio con un `diff`, `grep -c` o comparación de un **tramo** de archivo (`sed -n…
- `flexbox-overflow-hidden-colapso` — **Flex item con overflow-hidden se aplasta a 0px en contenedores con scroll**
  Cuando un elemento "desaparece" dentro de un panel que es `flex flex-col` con `max-h-*` + `overflow-y-auto`…
- `zustand-persist-partialize` — **Zustand persist — partialize obligatorio para no persistir estado de UI**
  Siempre que un store de Zustand use el middleware `persist` y mezcle datos (items del carrito, preferencias)…
- `favicon-quitar-data-uri` — **Sacar el favicon no alcanza con borrar el archivo — hace falta href=\"data:,\**
  Cuando el cliente pide **no tener icono en la pestaña**, o cuando aparece un icono genérico/ajeno en alguna…
- `nextjs-modo-mantenimiento-dominio` — **Modo "en construcción" por dominio con bypass, sin tocar código**
  Cuando el dominio propio del cliente ya apunta a Vercel pero el sitio todavía no pasó las pruebas: hay que…
- `lenis-smooth-scroll` — **Lenis smooth scroll — bugs silenciosos con drawers y overlays**
  Cuando un proyecto usa Lenis para smooth scroll y hay drawers, modales o cualquier contenedor con…
- `secreto-server-en-client-component` — **Secreto de servidor leído en un client component — llega undefined y el endpoint da 401 siempre**
  Cuando un componente con `'use client'` (formularios, listas del panel) llama a un endpoint propio…
- `bajada-al-ancho-del-nombre` — **Bajada de marca estirada al ancho del nombre (letter-spacing medido)**
  Cuando un logotipo en texto tiene una segunda línea chica ("Arquitecto & Asociados", "Estudio Jurídico") que…
- `base-compartida-entre-ramas-rompe-build` — **Base compartida entre ramas — un cambio de datos en una rompe el build de la otra**
  Cuando dos ramas (producción y una de desarrollo largo) leen **la misma base de Supabase** y la rama de…
- `rail-snap-sangria-scroll-padding` — **Tira horizontal con scroll-snap que arranca corrida respecto del texto**
  Al armar un carrusel/tira de scroll nativo que se sale del contenedor hasta el borde de la pantalla (`-mx-5…
- `react19-img-preload-prefetch` — **React 19 precarga todas las <img> sin loading="lazy", también desde el prefetch de <Link>**
  Una página pesa mucho más de lo que muestra. El waterfall tiene `<link rel=preload as=image>` de fotos que no…

### Traídas por enlace

Estas no coinciden con el stack por tags, pero las skills de arriba las citan. Suelen ser el patrón general detrás del caso concreto.

- `onboarding-guest-rollback-storage-rls` — **Onboarding multi-paso con guest+fotos — rollback en fallo y RLS de storage por dueño**
  Cuando un flujo público (sin login) crea una fila "dueña" (guest, invitado, registro) y después, en el mismo…
  _citada por `client-side-image-compress`_
- `uploader-path-fijo-cache` — **Uploader con path fijo — la foto nueva nunca se ve (URL idéntica + CDN)**
  Cuando el cliente/admin dice **"subo la foto y no cambia nada en el sitio"** y en la DB la fila del asset no…
  _citada por `input-file-hidden-click-ios-webview`_
- `supabase-bucket-publico-select-listing` — **Bucket público de Supabase — la policy de SELECT abierta deja listar todo**
  Al crear cualquier bucket de Supabase Storage con `public: true` (avatares, portadas, adjuntos), y al copiar…
  _citada por `ruta-publica-sirve-bucket-entero`_
- `webhook-idempotencia-orden-registro` — **Webhooks de pago — registrar el evento DESPUÉS de aplicarlo, no antes**
  Al escribir el webhook de cualquier pasarela (Mercado Pago, Stripe, MODO) que tenga una tabla de eventos con…
  _citada por `astro-checkorigin-content-type`_
- `supabase-storage-egress` — **Supabase Storage — egress, límites y buenas prácticas**
  Al subir archivos a Supabase Storage, especialmente videos o imágenes pesadas que se sirven públicamente.…
  _citada por `nextjs-persistent-shell-nav`_
- `roles-lista-fija-vs-canales-dinamicos` — **Roles enumerados a mano cuando en realidad los crea el admin desde el panel**
  Cuando el proyecto tiene una tabla configurable por el admin que define "tipos de usuario" (`canales`…
  _citada por `filtro-sobre-la-misma-tabla-no-dos-secciones`_
- `supabase-conexion-cli` — **Conectar Supabase CLI con PAT**
  Cuando haya que conectar el CLI de Supabase con un PAT, usar la Management API, vincular un proyecto o…
  _citada por `astro-supabase-frontera-de-datos`_
- `supabase-embed-to-one-objeto` — **El embed to-one de PostgREST llega como objeto, no como array**
  Al leer con `select("…, tabla_relacionada (columna)")` en supabase-js, sobre todo con `!inner`, y más todavía…
  _citada por `panel-foto-en-el-hueco`_
