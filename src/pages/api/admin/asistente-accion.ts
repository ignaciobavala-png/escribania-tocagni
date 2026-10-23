import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { ErrorAccion, ejecutar, prever, validar } from '../../../lib/acciones';

const plano = (t: string) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();

// Dos frenos que no dependen del modelo (Llama proponía acciones ante simples preguntas):
// 1. Lo último que escribió la persona tiene que ser un pedido (verbo de acción) o una
//    confirmación corta ("dale", "sí"). Una pregunta ("¿qué expedientes hay?") no mueve nada.
// 2. En turnos y vencimientos, la frase `cita` tiene que estar en lo que escribió: si no,
//    la fecha la inventó el modelo.
// Solo formas de pedido (imperativo e infinitivo, ya sin tildes): "cargados" no cuenta.
const PEDIDO = /\b(agend(a|ar|emos|e)|carg(a|ar|ue|uemos)|cre(a|ar|emos)|pas(a|ar|emos)|cambi(a|ar|emos)|marc(a|ar|ue|uemos)|resolv(e|er|amos)|cancel(a|ar|emos)|agreg(a|ar|ue|uemos)|anot(a|ar|e|emos)|reabr(i|ir)|cerr(a|ar|emos)|registr(a|ar|emos)|program(a|ar|emos)|reprogram(a|ar)|actualiz(a|ar|emos)|dej(a|ar)|sum(a|ar)|mov(e|er))\b/;
const CONFIRMA = /^(si|dale|ok|okey|bueno|perfecto|de una|hacelo|hacela|confirmo|confirmalo|adelante|por favor)\b/;
const CON_FECHA = new Set(['turno_crear', 'vencimiento_crear']);

function exigirPedido(accion: unknown, dichos: unknown) {
  const mensajes = (Array.isArray(dichos) ? dichos : []).filter((m): m is string => typeof m === 'string').map(plano);
  const ultimo = mensajes[mensajes.length - 1] ?? '';
  const esPregunta = ultimo.includes('?') && !PEDIDO.test(ultimo);
  if (esPregunta || !(PEDIDO.test(ultimo) || CONFIRMA.test(ultimo))) {
    throw new ErrorAccion('Eso fue una pregunta, no un pedido: no se propone ningún cambio.');
  }
  const a = (accion ?? {}) as { tipo?: string; cita?: unknown };
  if (a.tipo && CON_FECHA.has(a.tipo)) {
    const cita = typeof a.cita === 'string' ? plano(a.cita) : '';
    if (cita.length < 3 || !mensajes.some((m) => m.includes(cita))) {
      throw new ErrorAccion('Falta la fecha o la hora: el asistente tiene que preguntarlas.');
    }
  }
}

export const POST: APIRoute = async ({ request, locals }) => {
  const usuario = locals.usuario;
  if (!usuario) return new Response('No autorizado', { status: 401 });

  const { accion, ejecutar: hacer, dichos } = (await request.json().catch(() => ({}))) as { accion?: unknown; ejecutar?: unknown; dichos?: unknown };
  try {
    exigirPedido(accion, dichos);
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
