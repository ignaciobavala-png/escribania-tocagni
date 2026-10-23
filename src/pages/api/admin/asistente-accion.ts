import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { ErrorAccion, ejecutar, prever, validar } from '../../../lib/acciones';
import { motivoRechazo } from '../../../lib/propuestas';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  const usuario = locals.usuario;
  if (!usuario) return new Response('No autorizado', { status: 401 });

  const { accion, ejecutar: hacer, dichos } = (await request.json().catch(() => ({}))) as { accion?: unknown; ejecutar?: unknown; dichos?: unknown };
  try {
    // El freno de intención va solo al proponer: al confirmar, el clic es el pedido
    // (y lo último escrito puede ser otra cosa, si la tarjeta quedó de antes).
    if (hacer !== true) {
      const textos = (Array.isArray(dichos) ? dichos : []).filter((m): m is string => typeof m === 'string');
      const motivo = motivoRechazo((accion ?? {}) as Record<string, unknown>, textos);
      if (motivo) throw new ErrorAccion(motivo);
    }
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
