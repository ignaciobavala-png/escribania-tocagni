// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  // Dominio definitivo. Lo consumen el canonical y las etiquetas og: de
  // Layout.astro via Astro.site. Si cambia, se cambia solo aca.
  site: 'https://escribaniatocagni.com',
  vite: {
    plugins: [tailwindcss()],
  },
});