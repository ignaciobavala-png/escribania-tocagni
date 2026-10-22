import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { auditar } from '../../../../lib/auditoria';
import { VISIBLES } from '../../../../lib/documentos';
import { esCategoria } from '../../../../data/expediente';

export const prerender = false;

// Sirve un adjunto. El bucket es privado: esta ruta (detrás de Access y del
// middleware) es la única forma de llegar al archivo, y cada acceso se audita.
export const GET: APIRoute = async ({ params, url, locals }) => {
  const usuario = locals.usuario;
  if (!usuario) return new Response('No autorizado', { status: 401 });

  const doc = await env.DB.prepare('SELECT ficha_id, tipo, nombre, clave_r2 FROM documentos WHERE id = ?')
    .bind(params.id)
    .first<{ ficha_id: string; tipo: string; nombre: string; clave_r2: string }>();
  if (!doc) return new Response('No existe el documento', { status: 404 });

  const objeto = await env.DOCS.get(doc.clave_r2);
  if (!objeto) return new Response('El archivo no está disponible', { status: 404 });

  await auditar(env.DB, usuario.email, 'documento_visto', { entidad: 'ficha', ref: doc.ficha_id, detalle: { documento: params.id } });

  // Se muestra en el navegador solo lo que es seguro mostrar (PDF e imágenes); el resto, descarga.
  const enLinea = url.searchParams.has('ver') && VISIBLES.has(doc.tipo);
  return new Response(objeto.body, {
    headers: {
      'Content-Type': doc.tipo,
      'Content-Length': String(objeto.size),
      'Content-Disposition': `${enLinea ? 'inline' : 'attachment'}; filename*=UTF-8''${encodeURIComponent(doc.nombre)}`,
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'private, no-store',
    },
  });
};

// Mover un archivo de carpeta (cambiar su categoría). El archivo no se toca.
export const PATCH: APIRoute = async ({ params, request, locals }) => {
  const usuario = locals.usuario;
  if (!usuario) return new Response('No autorizado', { status: 401 });

  const { categoria } = (await request.json().catch(() => ({}))) as { categoria?: unknown };
  if (!esCategoria(categoria)) return Response.json({ error: 'Categoría inválida.' }, { status: 400 });

  const doc = await env.DB.prepare('SELECT ficha_id FROM documentos WHERE id = ?').bind(params.id).first<{ ficha_id: string }>();
  if (!doc) return Response.json({ error: 'No existe el documento.' }, { status: 404 });
  await env.DB.prepare('UPDATE documentos SET categoria = ? WHERE id = ?').bind(categoria, params.id).run();
  await auditar(env.DB, usuario.email, 'documento_movido', { entidad: 'ficha', ref: doc.ficha_id, detalle: { documento: params.id, categoria } });
  return Response.json({ ok: true });
};
