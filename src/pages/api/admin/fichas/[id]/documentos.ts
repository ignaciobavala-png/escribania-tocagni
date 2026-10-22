import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { auditar } from '../../../../../lib/auditoria';
import { MAX_BYTES, TIPOS, extension, limpiarNombre } from '../../../../../lib/documentos';
import { esCategoria, sugerirCategoria } from '../../../../../data/expediente';

export const prerender = false;

// Un archivo por pedido (multipart, campo `archivo`); el cliente sube de a uno
// para poder mostrar cuál falló y no perder el resto.
export const POST: APIRoute = async ({ params, request, locals }) => {
  const usuario = locals.usuario;
  if (!usuario) return new Response('No autorizado', { status: 401 });

  // Se corta por el tamaño declarado ANTES de leer el cuerpo: `formData()` carga
  // el archivo entero en memoria, y un envío enorme no debe llegar a eso.
  // (Margen de 1 MB por los encabezados del multipart.)
  if (Number(request.headers.get('content-length')) > MAX_BYTES + 1024 * 1024) {
    return Response.json({ error: 'El archivo supera los 10 MB.' }, { status: 413 });
  }

  const ficha = await env.DB.prepare('SELECT 1 FROM fichas WHERE id = ?').bind(params.id).first();
  if (!ficha) return Response.json({ error: 'No existe la consulta.' }, { status: 404 });

  const form = await request.formData().catch(() => null);
  const archivo = form?.get('archivo');
  if (!(archivo instanceof File) || archivo.size === 0) {
    return Response.json({ error: 'No llegó ningún archivo.' }, { status: 400 });
  }
  const ext = extension(archivo.name);
  if (!(ext in TIPOS)) {
    return Response.json({ error: 'Tipo de archivo no permitido. Subí PDF, foto, Word o Excel.' }, { status: 415 });
  }
  if (archivo.size > MAX_BYTES) {
    return Response.json({ error: 'El archivo supera los 10 MB.' }, { status: 413 });
  }

  const id = crypto.randomUUID();
  const nombre = limpiarNombre(archivo.name);
  // Si el cliente no indica carpeta, la sugiere el clasificador por nombre.
  const pedida = form?.get('categoria');
  const categoria = esCategoria(pedida) ? pedida : sugerirCategoria(nombre).clave;
  const clave = `fichas/${params.id}/${id}.${ext}`;
  await env.DOCS.put(clave, archivo.stream(), { httpMetadata: { contentType: TIPOS[ext] } });
  await env.DB.prepare('INSERT INTO documentos (id, ficha_id, tipo, nombre, clave_r2, bytes, categoria) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .bind(id, params.id, TIPOS[ext], nombre, clave, archivo.size, categoria)
    .run();
  await auditar(env.DB, usuario.email, 'documento_subido', {
    entidad: 'ficha',
    ref: params.id,
    detalle: { documento: id, nombre, bytes: archivo.size, categoria },
  });
  return Response.json({ id }, { status: 201 });
};
