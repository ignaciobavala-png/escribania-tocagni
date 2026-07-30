# Escribania Togcani — Landing Page

## Cliente

Escribania (notaria) con mas de 20 anos de trayectoria en Buenos Aires. Servicios:
certificaciones, contratos, tramites societarios, compraventa de inmuebles,
sucesiones, asesoramiento notarial.

## Stack

| Capa | Tecnologia |
|------|------------|
| Framework | Astro 7 (SSG, output: "static") |
| Estilos | Tailwind CSS v4 (Vite plugin `@tailwindcss/vite`) |
| Deploy | Cloudflare Workers Static Assets (Wrangler v4) |
| Package | pnpm |
| Lenguaje | TypeScript strict |

Build: ~48 KB, 0 JS. Solamente HTML + CSS.

### Dependencias instaladas (sin usar aun)

- `@astrojs/react` + `react` / `react-dom` — para el chatbot futuro
- `@astrojs/cloudflare` — para SSR/API routes cuando se agregue el chatbot

**No removerlas**, son necesarias para la fase 2 (chatbot con Groq).

## Deploy

```bash
pnpm run build          # genera dist/
pnpm exec wrangler deploy # sube a Cloudflare Workers
```

URL: `https://escribania-togcani.ethoslogliberty.workers.dev`

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

Fuentes: Playfair Display (serif, headings) + Inter (sans, cuerpo).

Reglas de diseno:
- Regla dorada fina (w-16 h-px) al inicio de cada seccion
- Labels en uppercase con tracking-[0.3em]
- Titulos grandes en Playfair Display con tracking-tight
- Numeros de seccion en la tipografia serif (01, 02, 03...)
- Sin iconos ni imagenes decorativas, solo tipografia y espacio
- Bordes sutiles (divide-x, border-t) en white/8 o neutral/200

## Estructura

```
src/
├── components/
│   ├── Header.astro       → nav liviana, tracking wide, telefono visible
│   ├── Hero.astro         → titulo centrado 8xl, regla dorada, grid geometrico
│   ├── QuienesSomos.astro → layout 3 columnas, texto institucional, "20" grande
│   ├── Servicios.astro    → grilla numerada 01-06 con lineas divisorias
│   └── Contacto.astro     → footer navy, datos en grid 2x2, mapa OSM
├── layouts/Layout.astro   → base HTML, meta tags, Google Fonts
├── pages/index.astro      → unica pagina (landing single-page)
└── styles/global.css      → Tailwind v4 + @theme tokens
```

### Datos reales

- Direccion: Av. del Libertador 6328, Buenos Aires
- Coordenadas: -34.55368, -58.45052 (Nominatim, Belgrano/Barrio Chino)
- Mapa: OpenStreetMap iframe sin API key, filtro CSS monocromatico

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
