// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  // Dominio definitivo. Lo consumen el canonical y las etiquetas og: de
  // Layout.astro via Astro.site. Si cambia, se cambia solo aca.
  site: 'https://escribaniatocagni.com',
  // El adapter habilita el render on-demand de /api/chat (con
  // `export const prerender = false`). Las paginas siguen pre-renderizadas:
  // agregar el adapter NO cambia el sitio a SSR, solo permite rutas sueltas.
  adapter: cloudflare({ imageService: 'compile' }),
  // React entra solo para la isla del chatbot (ChatWidget.tsx).
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
});
