import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { auditar } from '../../../../lib/auditoria';
import { esEstado, esServicio, esUrgencia } from '../../../../lib/fichas';

export const prerender = false;

const texto = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) || null : null);

export const PATCH: APIRoute = async ({ params, request, locals }) => {
  const usuario = locals.usuario;
  if (!usuario) return new Response('No autorizado', { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Cuerpo inválido.' }, { status: 400 });
  }

  // Solo se aceptan estos campos y cada uno se valida: nada del body llega
  // al SQL como nombre de columna.
  const cambios: Record<string, string | null> = {};
  if ('estado' in body) {
    if (!esEstado(body.estado)) return Response.json({ error: 'Estado inválido.' }, { status: 400 });
    cambios.estado = body.estado;
  }
  if ('urgencia' in body) {
    if (!esUrgencia(body.urgencia)) return Response.json({ error: 'Urgencia inválida.' }, { status: 400 });
    cambios.urgencia = body.urgencia;
  }
  if ('servicio' in body) {
    if (body.servicio !== '' && !esServicio(body.servicio)) return Response.json({ error: 'Servicio inválido.' }, { status: 400 });
    cambios.servicio = body.servicio === '' ? null : (body.servicio as string);
  }
  if ('nombre' in body) cambios.nombre = texto(body.nombre, 120);
  if ('contacto' in body) cambios.contacto = texto(body.contacto, 120);
  if ('resumen' in body) cambios.resumen = texto(body.resumen, 2000);

  const columnas = Object.keys(cambios);
  if (columnas.length === 0) return Response.json({ error: 'Nada para actualizar.' }, { status: 400 });

  const r = await env.DB.prepare(`UPDATE fichas SET ${columnas.map((c) => `${c} = ?`).join(', ')} WHERE id = ?`)
    .bind(...columnas.map((c) => cambios[c]), params.id)
    .run();
  if (!r.meta.changes) return Response.json({ error: 'No existe la consulta.' }, { status: 404 });

  // Se registran los campos tocados, no sus valores: la auditoría no copia datos de clientes.
  await auditar(env.DB, usuario.email, 'ficha_editada', { entidad: 'ficha', ref: params.id, detalle: { campos: columnas } });
  return Response.json({ ok: true });
};
