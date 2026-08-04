# AGENTS.md — escribania-tocagni

> Generado automáticamente por brain-agents-inject desde brain-data.
> No editar manualmente — se sobreescribe al abrir Claude Code.

## Proyecto

| Campo | Valor |
|-------|-------|
| Nombre | escribania-tocagni |
| Tipo | — |
| Cliente | — |
| Stack | Astro 7.1.6 + React 19.2.8 + Tailwind + Wrangler / Cloudflare + Cloudflare |
| Estado | desconocido |
| Último commit | — |

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

## ESLint

Usar flat config (`eslint.config.mjs`):
```js
import { dirname } from "path"
import { fileURLToPath } from "url"
import { FlatCompat } from "@eslint/eslintrc"
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const compat = new FlatCompat({ baseDirectory: __dirname })
const eslintConfig = [...compat.extends("next/core-web-vitals", "next/typescript")]
export default eslintConfig
```

## Skills relevantes para este proyecto

Leer el archivo completo solo si la tarea actual lo requiere — esta lista es solo un índice.

- **Tiquetera Vite + Supabase — bugs silenciosos y patrones seguros** (`/home/nch/Escritorio/brain-data/skills/tiquetera-vite-supabase/SKILL.md`)
  Al trabajar en cualquier sistema de tickets/entradas con: localStorage como caché de tickets en el cliente Supabase como fuente de verdad Escaneo de QR con confirmación de ingreso Registro de asistentes por email
- **Next.js 16 — App Router patterns y convenciones** (`/home/nch/Escritorio/brain-data/skills/nextjs-app-router-patterns/SKILL.md`)
  Al iniciar o trabajar en cualquier proyecto Next.js: estructura de rutas, data fetching, Server Actions, proxy (middleware), metadata, layouts.
- **Tailwind CSS v4 — configuración y patrones mobile-first** (`/home/nch/Escritorio/brain-data/skills/tailwindcss-mobile-first/SKILL.md`)
  Al configurar Tailwind v4 en un proyecto nuevo, definir tokens de diseño, o implementar layouts responsivos.
- **Cloudflare Wrangler — setup, assets estáticos y deploy seguro** (`/home/nch/Escritorio/brain-data/skills/cloudflare-wrangler-deploy/SKILL.md`)
  Cualquier proyecto con `wrangler.jsonc`/`wrangler.toml` (Worker o sitio estático servido con `assets.directory`), especialmente al instalar wrangler desde cero, autenticar, o antes de un `wrangler deploy` en un proyecto…
- **Jeeliz FaceFilter + Three.js — Web AR try-on** (`/home/nch/Escritorio/brain-data/skills/jeeliz-web-ar-tryon/SKILL.md`)
  ## Cuando usarla Al integrar el face tracker Jeeliz FaceFilter con Three.js en una app React (Vite) para probadores virtuales de anteojos. La API de Jeeliz es singleton global y opera sobre WebGL crudo; Three.js debe com…
- **Navegación con shell persistente (route group + framer-motion)** (`/home/nch/Escritorio/brain-data/skills/nextjs-persistent-shell-nav/SKILL.md`)
  Cuando querés que la navegación entre páginas se sienta como **un mismo espacio que muta** (sensación "redes sociales / cinta transportadora": nunca entrás ni salís del todo), o cuando necesitás elementos de UI que **sob…
- **Comprimir imágenes client-side antes de subir al storage** (`/home/nch/Escritorio/brain-data/skills/client-side-image-compress/SKILL.md`)
  Siempre que se implemente un uploader de imágenes (flyers, avatares, fondos, productos, etc.). Sin compresión, los usuarios pueden subir archivos de 10–25 MB que se sirven a cada visitante, generando egress masivo en Sup…
- **Vercel + React — performance y patrones críticos** (`/home/nch/Escritorio/brain-data/skills/vercel-react-best-practices/SKILL.md`)
  Al optimizar una página lenta, reducir el bundle, revisar re-renders, o hacer deploy en Vercel.
- **Bug silencioso — `hidden` no oculta si el componente ya trae `flex`/`inline-flex` en su base** (`/home/nch/Escritorio/brain-data/skills/tailwind-clases-conflicto-orden-hoja/SKILL.md`)
  Cada vez que un componente propio arme su `class` concatenando una base fija con un `className` que recibe por props: ```tsx <Link className={`inline-flex items-center ... ${VARIANTS[variant]} ${className}`}> ``` Y sobre…
- **Hover en touch — Tailwind v4 ya lo protege, tu CSS a mano no** (`/home/nch/Escritorio/brain-data/skills/hover-touch-tailwind-v4/SKILL.md`)
  Al hacer tarjetas, grillas de servicios o cualquier elemento con efecto de hover que también se va a ver en teléfono. Y cuando el síntoma es "el efecto queda pegado después de tocar".
- **Scaffold Next.js 16 + Supabase (kickstart)** (`/home/nch/Escritorio/brain-data/skills/scaffold-nextjs-supabase/SKILL.md`)
  Al arrancar cualquier proyecto nuevo. En vez de re-hacer el setup a mano y re-debuggear los mismos bugs silenciosos en cada cliente, generar el proyecto ya con todo baked-in. Dos targets según el peso del proyecto: **`ve…
- **Marquee CSS infinito — dos tracks, no uno animado a -50%** (`/home/nch/Escritorio/brain-data/skills/css-marquee-infinito-dos-tracks/SKILL.md`)
  Cuando hay una franja de texto que scrollea en loop (ticker de promos, "envío gratis", mensajes de marca) y el cliente reporta que **"se corta y deja de aparecer"**, o que el loop tiene un salto o un hueco. También al es…
- **Chatbot FAQ grounded con AI SDK v5 + Groq (widget Q&A)** (`/home/nch/Escritorio/brain-data/skills/ai-sdk-chatbot-grounded/SKILL.md`)
  Al agregar un widget de preguntas frecuentes / asistente virtual a un sitio, cuando la respuesta debe estar **anclada a un FAQ oficial** (sin inventar datos) y el objetivo es un chat simple con streaming, no un agente co…
- **Inputs decimales en es-AR — coma como separador y estado string** (`/home/nch/Escritorio/brain-data/skills/inputs-decimales-coma-es-ar/SKILL.md`)
  Siempre que un formulario React/Next.js tenga campos numéricos con decimales (dimensiones, peso, precios, porcentajes) para usuarios argentinos. Síntoma típico reportado por el usuario: **"el input no toma decimales"** —…
- **Cloudflare D1 — Migraciones y patrones SQLite** (`/home/nch/Escritorio/brain-data/skills/cloudflare-d1-migrations/SKILL.md`)
  Cualquier proyecto con Cloudflare D1 (SQLite) que necesite migraciones de schema, especialmente cambios que SQLite no soporta directamente.
- **Embeber un mapa sin API key — los tres endpoints de Google Maps** (`/home/nch/Escritorio/brain-data/skills/google-maps-embed-sin-key/SKILL.md`)
  Al poner un mapa en una landing (contacto, sucursal, oficina) sin querer montar un proyecto en Google Cloud. También cuando un iframe de Google Maps aparece vacío, en blanco o con un error.
- **Paridad de env vars al mergear una rama a producción** (`/home/nch/Escritorio/brain-data/skills/env-var-parity-branch-deploy/SKILL.md`)
  Antes de mergear/pushear a `main` (o al proyecto de Vercel que sirve producción) una rama que estuvo en desarrollo aislado y que **agregó una feature nueva con su propia env var** (una API key, un secret, un feature flag…
- **CLAUDE.md como symlink a AGENTS.md — la doc del proyecto se borra sola** (`/home/nch/Escritorio/brain-data/skills/claude-md-symlink-agents-sobreescrito/SKILL.md`)
  Al documentar cualquier proyecto que tenga `AGENTS.md` generado por `brain-agents-inject` Cuando aparece un `AGENTS.md` con muchas líneas modificadas en `git status` sin que nadie lo haya tocado Cuando documentación de p…
- **Scroll horizontal en mobile — overflow-x-clip vs overflow-hidden** (`/home/nch/Escritorio/brain-data/skills/overflow-clip-vs-hidden-scroll-horizontal/SKILL.md`)
  Cuando en el teléfono **toda la página se mueve para los costados** y no se encuentra el culpable, o cuando un elemento decorativo (óvalo, blob, glow, imagen rotada) está posicionado *a propósito* fuera del ancho de cont…
- **Logo PNG que se ve chico — padding alfa dentro del archivo** (`/home/nch/Escritorio/brain-data/skills/logo-png-padding-alpha/SKILL.md`)
  Cuando ponés un logo que mandó un diseñador (PNG/WebP con transparencia) en un navbar, footer o card, lo dimensionás con `h-10` / `h-12` y **se ve notablemente más chico de lo que debería**. El reflejo es subir la clase…
- **backdrop-filter (o filter) en el header confina los hijos position:fixed a su propia caja** (`/home/nch/Escritorio/brain-data/skills/backdrop-filter-fixed-menu-clipped/SKILL.md`)
  Cuando un menú mobile (burger menu / overlay `position: fixed; inset: 0`) reportado como "no despliega bien", "se ve cortado", "solo ocupa una franja arriba" o "no se ve" — y ese overlay está anidado **dentro** de un `<h…
- **sharp en Vercel con pnpm — binarios nativos que no llegan al bundle** (`/home/nch/Escritorio/brain-data/skills/sharp-vercel-pnpm-tracing/SKILL.md`)
  Cuando una ruta API de Next.js que usa `sharp` funciona en local pero en Vercel tira `ERR_DLOPEN_FAILED` (buscando `libvips-cpp.so.X`) o el cliente recibe `JSON.parse: unexpected character at line 1 column 1` (la función…
- **Hono setSignedCookie async sin await rompe cookies silenciosamente** (`/home/nch/Escritorio/brain-data/skills/hono-set-signed-cookie-async/SKILL.md`)
  Cuando uses `setSignedCookie` de Hono para auth con cookies firmadas y el login parezca funcionar (redirige) pero luego las rutas protegidas fallen (loop infinito de login).
- **Bug silencioso de datetime-local con timestamps UTC** (`/home/nch/Escritorio/brain-data/skills/datetime-local-utc-bug/SKILL.md`)
  Siempre que un form tenga `<input type="datetime-local">` cuyo valor se carga desde un timestamp guardado en UTC (Supabase `timestamptz`, ISO strings) y se vuelve a guardar.
- **Dropdown por :hover con gap visual se cierra antes de poder hacer click** (`/home/nch/Escritorio/brain-data/skills/css-hover-dropdown-gap/SKILL.md`)
  Cuando un menú desplegable de navbar (categorías, "más opciones", etc.) se abre con `:hover` puro (sin JS) y el usuario reporta que "el menú desaparece cuando intento llegar a una opción" — especialmente si el trigger y…
- **Flex item con overflow-hidden se aplasta a 0px en contenedores con scroll** (`/home/nch/Escritorio/brain-data/skills/flexbox-overflow-hidden-colapso/SKILL.md`)
  Cuando un elemento "desaparece" dentro de un panel que es `flex flex-col` con `max-h-*` + `overflow-y-auto` (sidebars sticky, drawers, resúmenes de checkout). El elemento sigue en el DOM (aparece en el accessibility tree…
- **Zustand persist — partialize obligatorio para no persistir estado de UI** (`/home/nch/Escritorio/brain-data/skills/zustand-persist-partialize/SKILL.md`)
  Siempre que un store de Zustand use el middleware `persist` y mezcle datos (items del carrito, preferencias) con estado efímero de UI (drawer abierto, loading, tab activa).
- **Lenis smooth scroll — bugs silenciosos con drawers y overlays** (`/home/nch/Escritorio/brain-data/skills/lenis-smooth-scroll/SKILL.md`)
  Cuando un proyecto usa Lenis para smooth scroll y hay drawers, modales o cualquier contenedor con `overflow-y-auto` que no responde al trackpad.
