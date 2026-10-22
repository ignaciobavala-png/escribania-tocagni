import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { auditar } from '../../../lib/auditoria';

export const prerender = false;

// Devuelve las filas en crudo; el armado del .xlsx se hace en el navegador.
// Es una salida masiva de datos de clientes, por eso queda en la auditoría.
export const GET: APIRoute = async ({ url, locals }) => {
  const usuario = locals.usuario;
  if (!usuario) return new Response('No autorizado', { status: 401 });

  const tipo = url.searchParams.get('tipo');
  let filas: unknown[];
  if (tipo === 'fichas') {
    filas = (await env.DB.prepare(
      'SELECT nombre, contacto, servicio, urgencia, estado, resumen, creada FROM fichas ORDER BY creada DESC',
    ).all()).results;
  } else if (tipo === 'vencimientos') {
    filas = (await env.DB.prepare(
      `SELECT v.concepto, v.vence, v.estado, f.nombre AS cliente
       FROM vencimientos v LEFT JOIN fichas f ON f.id = v.ficha_id ORDER BY v.vence`,
    ).all()).results;
  } else {
    return Response.json({ error: 'Tipo inválido.' }, { status: 400 });
  }

  await auditar(env.DB, usuario.email, 'exportacion', { entidad: tipo, detalle: { filas: filas.length } });
  return Response.json({ filas });
};
