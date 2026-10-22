import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { auditar } from '../../../lib/auditoria';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  const usuario = locals.usuario;
  if (!usuario) return new Response('No autorizado', { status: 401 });

  let b: { ficha_id?: unknown; fecha?: unknown; hora?: unknown; motivo?: unknown };
  try {
    b = await request.json();
  } catch {
    return Response.json({ error: 'Cuerpo inválido.' }, { status: 400 });
  }
  if (typeof b.fecha !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(b.fecha)) {
    return Response.json({ error: 'Fecha inválida.' }, { status: 400 });
  }
  if (typeof b.hora !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(b.hora)) {
    return Response.json({ error: 'Hora inválida.' }, { status: 400 });
  }
  // La escribanía carga la hora de Buenos Aires (UTC-3, sin horario de verano);
  // se guarda como instante UTC para que `hora()` y las consultas por día coincidan.
  const inicio = new Date(`${b.fecha}T${b.hora}:00-03:00`);
  if (Number.isNaN(inicio.getTime())) return Response.json({ error: 'Fecha inválida.' }, { status: 400 });

  const motivo = typeof b.motivo === 'string' && b.motivo.trim() ? b.motivo.trim().slice(0, 160) : null;
  const fichaId = typeof b.ficha_id === 'string' && b.ficha_id ? b.ficha_id : null;
  if (!motivo && !fichaId) return Response.json({ error: 'Indicá el motivo o elegí una consulta.' }, { status: 400 });
  if (fichaId) {
    const existe = await env.DB.prepare('SELECT 1 FROM fichas WHERE id = ?').bind(fichaId).first();
    if (!existe) return Response.json({ error: 'La consulta no existe.' }, { status: 400 });
  }

  const id = crypto.randomUUID();
  await env.DB.prepare('INSERT INTO turnos (id, ficha_id, inicio, motivo) VALUES (?, ?, ?, ?)')
    .bind(id, fichaId, inicio.toISOString(), motivo)
    .run();
  await auditar(env.DB, usuario.email, 'turno_creado', { entidad: 'turno', ref: id });
  return Response.json({ id }, { status: 201 });
};
