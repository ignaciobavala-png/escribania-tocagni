# AGENTS.md — escribania_togcani

> Generado automáticamente por brain-agents-inject desde brain-data.
> No editar manualmente — se sobreescribe al abrir Claude Code.

## Proyecto

| Campo | Valor |
|-------|-------|
| Nombre | escribania_togcani |
| Tipo | — |
| Cliente | — |
| Stack | React 19.2.8 + Tailwind v4 |
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
- **Jeeliz FaceFilter + Three.js — Web AR try-on** (`/home/nch/Escritorio/brain-data/skills/jeeliz-web-ar-tryon/SKILL.md`)
  ## Cuando usarla Al integrar el face tracker Jeeliz FaceFilter con Three.js en una app React (Vite) para probadores virtuales de anteojos. La API de Jeeliz es singleton global y opera sobre WebGL crudo; Three.js debe com…
- **Vercel + React — performance y patrones críticos** (`/home/nch/Escritorio/brain-data/skills/vercel-react-best-practices/SKILL.md`)
  Al optimizar una página lenta, reducir el bundle, revisar re-renders, o hacer deploy en Vercel.
- **Inputs decimales en es-AR — coma como separador y estado string** (`/home/nch/Escritorio/brain-data/skills/inputs-decimales-coma-es-ar/SKILL.md`)
  Siempre que un formulario React/Next.js tenga campos numéricos con decimales (dimensiones, peso, precios, porcentajes) para usuarios argentinos. Síntoma típico reportado por el usuario: **"el input no toma decimales"** —…
- **Bug silencioso de datetime-local con timestamps UTC** (`/home/nch/Escritorio/brain-data/skills/datetime-local-utc-bug/SKILL.md`)
  Siempre que un form tenga `<input type="datetime-local">` cuyo valor se carga desde un timestamp guardado en UTC (Supabase `timestamptz`, ISO strings) y se vuelve a guardar.
- **Flex item con overflow-hidden se aplasta a 0px en contenedores con scroll** (`/home/nch/Escritorio/brain-data/skills/flexbox-overflow-hidden-colapso/SKILL.md`)
  Cuando un elemento "desaparece" dentro de un panel que es `flex flex-col` con `max-h-*` + `overflow-y-auto` (sidebars sticky, drawers, resúmenes de checkout). El elemento sigue en el DOM (aparece en el accessibility tree…
- **Zustand persist — partialize obligatorio para no persistir estado de UI** (`/home/nch/Escritorio/brain-data/skills/zustand-persist-partialize/SKILL.md`)
  Siempre que un store de Zustand use el middleware `persist` y mezcle datos (items del carrito, preferencias) con estado efímero de UI (drawer abierto, loading, tab activa).
- **Lenis smooth scroll — bugs silenciosos con drawers y overlays** (`/home/nch/Escritorio/brain-data/skills/lenis-smooth-scroll/SKILL.md`)
  Cuando un proyecto usa Lenis para smooth scroll y hay drawers, modales o cualquier contenedor con `overflow-y-auto` que no responde al trackpad.
