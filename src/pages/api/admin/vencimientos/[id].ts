import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { auditar } from '../../../../lib/auditoria';

export const prerender = false;

// Un vencimiento no se borra: se marca resuelto (o se reabre) y queda el rastro.
export const PATCH: APIRoute = async ({ params, request, locals }) => {
  const usuario = locals.usuario;
  if (!usuario) return new Response('No autorizado', { status: 401 });

  const { estado } = (await request.json().catch(() => ({}))) as { estado?: unknown };
  if (estado !== 'abierto' && estado !== 'resuelto') return Response.json({ error: 'Estado inválido.' }, { status: 400 });

  const r = await env.DB.prepare('UPDATE vencimientos SET estado = ? WHERE id = ?').bind(estado, params.id).run();
  if (!r.meta.changes) return Response.json({ error: 'No existe el vencimiento.' }, { status: 404 });
  await auditar(env.DB, usuario.email, `vencimiento_${estado}`, { entidad: 'vencimiento', ref: params.id });
  return Response.json({ ok: true });
};
