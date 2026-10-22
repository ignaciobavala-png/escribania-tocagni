import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { auditar } from '../../../lib/auditoria';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  const usuario = locals.usuario;
  if (!usuario) return new Response('No autorizado', { status: 401 });

  let body: { nombre?: string; contacto?: string; resumen?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Cuerpo inválido.' }, { status: 400 });
  }
  const limpiar = (v: unknown, max: number) =>
    typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null;

  const nombre = limpiar(body.nombre, 120);
  const contacto = limpiar(body.contacto, 120);
  const resumen = limpiar(body.resumen, 2000);
  if (!nombre && !resumen) {
    return Response.json({ error: 'Falta el nombre o el detalle.' }, { status: 400 });
  }

  const id = crypto.randomUUID();
  await env.DB.prepare('INSERT INTO fichas (id, nombre, contacto, resumen, origen) VALUES (?, ?, ?, ?, ?)')
    .bind(id, nombre, contacto, resumen, 'manual')
    .run();
  await auditar(env.DB, usuario.email, 'ficha_creada', { entidad: 'ficha', ref: id });

  return Response.json({ id }, { status: 201 });
};
