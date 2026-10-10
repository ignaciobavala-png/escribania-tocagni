// /sitemap.xml — generado en build para que el lastmod no quede congelado a
// mano. Cuando la landing se abra en paginas por servicio, aca se suman las
// URLs nuevas (o se cambia por @astrojs/sitemap).
import type { APIRoute } from 'astro';

const SITE = 'https://escribaniatocagni.com';

export const prerender = true;

export const GET: APIRoute = () => {
  const lastmod = new Date().toISOString().slice(0, 10);
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE}/</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
`;
  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
