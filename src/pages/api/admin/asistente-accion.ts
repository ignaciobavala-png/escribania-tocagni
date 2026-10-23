import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { ErrorAccion, ejecutar, prever, validar } from '../../../lib/acciones';

export const prerender = false;

// Dos pasos con la misma entrada: `prever` describe lo que pasaría (sin tocar nada)
// y `ejecutar` lo hace. Ambos validan: lo que manda el navegador no se da por bueno.
export const POST: APIRoute = async ({ request, locals }) => {
  const usuario = locals.usuario;
  if (!usuario) return new Response('No autorizado', { status: 401 });

  const { accion, ejecutar: hacer } = (await request.json().catch(() => ({}))) as { accion?: unknown; ejecutar?: unknown };
  try {
    const a = validar(accion);
    if (hacer !== true) return Response.json({ accion: a, descripcion: await prever(env.DB, a) });
    const r = await ejecutar(env.DB, usuario.email, a);
    return Response.json({ ok: true, ...r });
  } catch (e) {
    if (e instanceof ErrorAccion) return Response.json({ error: e.message }, { status: 400 });
    console.error('[asistente-accion]', e);
    return Response.json({ error: 'No se pudo completar la acción.' }, { status: 500 });
  }
};
