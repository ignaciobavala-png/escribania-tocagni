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

Paleta definida en `src/styles/global.css` via `@theme`:

| Token | Color | Uso |
|-------|-------|-----|
| `--color-primary` | #1e3a5f (navy) | Fondo hero, headings, iconos |
| `--color-accent` | #c9a84c (dorado) | Botones CTA, badges, detalles |
| `--color-neutral-*` | escala 50-900 | Fondos, texto, bordes |

Fuentes: Playfair Display (serif, headings) + Inter (sans, cuerpo).

## Estructura

```
src/
├── components/
│   ├── Header.astro       → navegacion sticky sobre el hero
│   ├── Hero.astro         → seccion principal, titulo, CTA
│   ├── Servicios.astro    → grilla de 6 servicios (cards)
│   └── Contacto.astro     → datos de contacto + footer
├── layouts/Layout.astro   → base HTML, meta tags, Google Fonts
├── pages/index.astro      → unica pagina (landing single-page)
└── styles/global.css      → Tailwind v4 + @theme tokens
```

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
