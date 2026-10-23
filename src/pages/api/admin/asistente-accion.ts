import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { ErrorAccion, ejecutar, prever, validar } from '../../../lib/acciones';

const plano = (t: string) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();

// Fechas y horas: el modelo tiene que citar la frase de la persona que las dice. Si la cita
// no aparece en lo que escribió, el dato lo inventó el modelo y la propuesta se descarta.
const CON_FECHA = new Set(['turno_crear', 'vencimiento_crear']);
function exigirCita(accion: unknown, dichos: unknown) {
  const a = (accion ?? {}) as { tipo?: string; cita?: unknown };
  if (!a.tipo || !CON_FECHA.has(a.tipo)) return;
  const cita = typeof a.cita === 'string' ? plano(a.cita) : '';
  const mensajes = (Array.isArray(dichos) ? dichos : []).filter((m): m is string => typeof m === 'string').map(plano);
  if (cita.length < 3 || !mensajes.some((m) => m.includes(cita))) {
    throw new ErrorAccion('Falta la fecha o la hora: el asistente tiene que preguntarlas.');
  }
}

export const prerender = false;

// Dos pasos con la misma entrada: `prever` describe lo que pasaría (sin tocar nada)
// y `ejecutar` lo hace. Ambos validan: lo que manda el navegador no se da por bueno.
export const POST: APIRoute = async ({ request, locals }) => {
  const usuario = locals.usuario;
  if (!usuario) return new Response('No autorizado', { status: 401 });

  const { accion, ejecutar: hacer, dichos } = (await request.json().catch(() => ({}))) as { accion?: unknown; ejecutar?: unknown; dichos?: unknown };
  try {
    exigirCita(accion, dichos);
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
