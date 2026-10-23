import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { auditar } from '../../lib/auditoria';
import { avisarAlEstudio } from '../../lib/notificar';
import { ESTADOS, esServicio, esUrgencia, nombreServicio, URGENCIAS } from '../../lib/fichas';

// Endpoint PÚBLICO: lo llama el formulario del chat. El nombre y el contacto
// viajan acá y NUNCA pasan por el modelo (ver docs/plan-automatizacion.md,
// "Privacidad"). Como cualquiera puede pegarle, se defiende solo.
export const prerender = false;

// Tope global por hora: corta una inundación de fichas y, sobre todo, de mails
// al estudio. Pasado el tope se deriva a WhatsApp en vez de fallar mudo.
const MAX_POR_HORA = 15;

const limpiar = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
// Los saltos de línea en el asunto de un mail son la puerta a la inyección de cabeceras.
const unaLinea = (s: string) => s.replace(/[\r\n]+/g, ' ');

export const POST: APIRoute = async ({ request, url }) => {
  // Tope por IP (el mismo binding que el chat): sin esto, una sola persona podía agotar
  // el cupo global de la hora y dejar sin formulario a los clientes reales.
  if (env.LIMITE_CHAT) {
    const { success } = await env.LIMITE_CHAT.limit({ key: `consulta:${request.headers.get('cf-connecting-ip') ?? 'sin-ip'}` });
    if (!success) return Response.json({ error: 'Enviaste varias consultas seguidas. Probá en un minuto o escribinos por WhatsApp.' }, { status: 429 });
  }

  let b: Record<string, unknown>;
  try {
    b = await request.json();
  } catch {
    return Response.json({ error: 'Cuerpo inválido.' }, { status: 400 });
  }

  // Campo trampa: un humano no lo ve ni lo completa. Se responde "ok" igual para no dar pistas.
  if (limpiar(b.web, 100)) return Response.json({ ok: true });

  const nombre = limpiar(b.nombre, 120);
  const contacto = limpiar(b.contacto, 120);
  const resumen = limpiar(b.resumen, 1000);
  if (!nombre) return Response.json({ error: 'Falta tu nombre.' }, { status: 400 });
  const esMail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contacto);
  const esTel = (contacto.match(/\d/g) ?? []).length >= 8;
  if (!esMail && !esTel) {
    return Response.json({ error: 'Dejanos un teléfono o un mail válido para poder responderte.' }, { status: 400 });
  }
  const servicio = esServicio(b.servicio) ? b.servicio : null;
  const urgencia = esUrgencia(b.urgencia) ? b.urgencia : 'normal';

  const { n } = (await env.DB.prepare(
    `SELECT count(*) AS n FROM fichas WHERE origen = 'chat' AND creada > strftime('%Y-%m-%dT%H:%M:%SZ', 'now', '-1 hour')`,
  ).first<{ n: number }>())!;
  if (n >= MAX_POR_HORA) {
    return Response.json({ error: 'Hay muchas consultas en este momento. Escribinos por WhatsApp.' }, { status: 429 });
  }

  const id = crypto.randomUUID();
  await env.DB.prepare(
    `INSERT INTO fichas (id, nombre, contacto, servicio, urgencia, resumen, origen) VALUES (?, ?, ?, ?, ?, ?, 'chat')`,
  ).bind(id, nombre, contacto, servicio, urgencia, resumen || null).run();
  await auditar(env.DB, 'chat-web', 'ficha_creada', { entidad: 'ficha', ref: id });

  // Si el mail falla, la consulta igual queda guardada y visible en el panel.
  const enlace = new URL(`/admin/fichas/${id}`, url.origin).href;
  try {
    await avisarAlEstudio(env.EMAIL, {
      asunto: unaLinea(`Nueva consulta${servicio ? ` · ${nombreServicio(servicio)}` : ''} · ${nombre}`),
      texto: [
        'Llegó una consulta desde el chat de la web.',
        '',
        `Nombre: ${nombre}`,
        `Contacto: ${contacto}`,
        `Trámite: ${nombreServicio(servicio) ?? 'sin definir'}`,
        `Urgencia: ${URGENCIAS[urgencia]}`,
        `Estado: ${ESTADOS.nueva}`,
        '',
        resumen ? `Resumen:\n${resumen}` : 'Sin resumen.',
        '',
        `Abrirla en el panel: ${enlace}`,
      ].join('\n'),
    });
    await auditar(env.DB, 'sistema', 'aviso_enviado', { entidad: 'ficha', ref: id });
  } catch (e) {
    console.error('[consulta] no se pudo avisar al estudio:', e);
    await auditar(env.DB, 'sistema', 'aviso_fallido', { entidad: 'ficha', ref: id });
  }

  return Response.json({ ok: true }, { status: 201 });
};
