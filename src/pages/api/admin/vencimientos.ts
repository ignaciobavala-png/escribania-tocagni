import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { auditar } from '../../../lib/auditoria';
import { esFechaISO } from '../../../lib/fechas';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  const usuario = locals.usuario;
  if (!usuario) return new Response('No autorizado', { status: 401 });

  let b: { ficha_id?: unknown; concepto?: unknown; vence?: unknown };
  try {
    b = await request.json();
  } catch {
    return Response.json({ error: 'Cuerpo inválido.' }, { status: 400 });
  }
  const concepto = typeof b.concepto === 'string' ? b.concepto.trim().slice(0, 160) : '';
  if (!concepto) return Response.json({ error: 'Falta el concepto.' }, { status: 400 });
  if (!esFechaISO(b.vence)) {
    return Response.json({ error: 'Fecha inválida.' }, { status: 400 });
  }
  const fichaId = typeof b.ficha_id === 'string' ? b.ficha_id : null;

  const id = crypto.randomUUID();
  await env.DB.prepare('INSERT INTO vencimientos (id, ficha_id, concepto, vence) VALUES (?, ?, ?, ?)')
    .bind(id, fichaId, concepto, b.vence)
    .run();
  await auditar(env.DB, usuario.email, 'vencimiento_creado', { entidad: 'vencimiento', ref: id });
  return Response.json({ id }, { status: 201 });
};
