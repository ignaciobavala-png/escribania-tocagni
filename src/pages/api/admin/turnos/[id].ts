import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { auditar } from '../../../../lib/auditoria';

export const prerender = false;

const ESTADOS = ['pendiente', 'confirmado', 'cancelado', 'realizado'];

// Un turno no se borra: cambia de estado y queda el rastro en la auditoría.
export const PATCH: APIRoute = async ({ params, request, locals }) => {
  const usuario = locals.usuario;
  if (!usuario) return new Response('No autorizado', { status: 401 });

  const { estado } = (await request.json().catch(() => ({}))) as { estado?: unknown };
  if (typeof estado !== 'string' || !ESTADOS.includes(estado)) {
    return Response.json({ error: 'Estado inválido.' }, { status: 400 });
  }

  const r = await env.DB.prepare('UPDATE turnos SET estado = ? WHERE id = ?').bind(estado, params.id).run();
  if (!r.meta.changes) return Response.json({ error: 'No existe el turno.' }, { status: 404 });
  await auditar(env.DB, usuario.email, `turno_${estado}`, { entidad: 'turno', ref: params.id });
  return Response.json({ ok: true });
};
