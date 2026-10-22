import type { APIRoute } from 'astro';
import { streamText, convertToModelMessages, tool, jsonSchema, type UIMessage } from 'ai';
import { createDeepSeek } from '@ai-sdk/deepseek';
import { env } from 'cloudflare:workers';
import { buildSystemPrompt } from '../../data/agente';

// Ruta on-demand: el resto del sitio sigue pre-renderizado a estatico.
export const prerender = false;

// Topes defensivos: el endpoint es publico y pago. Recorta el historial y el
// largo de cada mensaje para que un abuso no se traduzca en una factura.
const MAX_MENSAJES = 16;
const MAX_CHARS = 2000;

function sanear(messages: UIMessage[]): UIMessage[] {
  return messages
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .slice(-MAX_MENSAJES)
    .map((m) => ({
      ...m,
      parts: m.parts.map((p) =>
        p.type === 'text' ? { ...p, text: p.text.slice(0, MAX_CHARS) } : p,
      ),
    }));
}

// Herramienta que el modelo usa para ofrecer que el estudio contacte a la
// persona. NO recibe ni devuelve datos personales: solo clasifica la consulta.
// El formulario con nombre y contacto lo muestra el widget y va directo a
// /api/consulta, sin pasar por el modelo.
const ofrecerRegistro = tool({
  description:
    'Ofrece a la persona dejar sus datos para que la escribanía la contacte. Usala cuando tenga un caso concreto, pida presupuesto o turno, o quiera que la llamen. Nunca incluyas nombres, teléfonos, mails, DNI ni montos en los argumentos.',
  inputSchema: jsonSchema<{ servicio?: string; urgencia: 'baja' | 'normal' | 'alta'; resumen: string }>({
    type: 'object',
    properties: {
      servicio: { type: 'string', description: 'Número del servicio (01 a 09) que mejor encaja, si está claro.' },
      urgencia: { type: 'string', enum: ['baja', 'normal', 'alta'], description: 'alta solo si hay una fecha límite próxima.' },
      resumen: { type: 'string', description: 'Resumen de 1 a 2 oraciones del trámite, sin datos personales.' },
    },
    required: ['urgencia', 'resumen'],
    additionalProperties: false,
  }),
  // No hay nada que ejecutar en el servidor: el widget dibuja el formulario a partir de los argumentos.
  execute: async () => ({ mostrado: true }),
});

export const POST: APIRoute = async ({ request }) => {
  const apiKey = env.DEEPSEEK_API_KEY;
  // Si falta la key, se corta aca: sin esto la request "funcionaria" pero el
  // asistente quedaria mudo sin decir por que.
  if (!apiKey) {
    return Response.json(
      { error: 'El asistente no está configurado (falta DEEPSEEK_API_KEY).' },
      { status: 500 },
    );
  }

  let body: { messages?: UIMessage[] };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Cuerpo inválido.' }, { status: 400 });
  }

  const messages = Array.isArray(body.messages) ? sanear(body.messages) : [];
  if (messages.length === 0) {
    return Response.json({ error: 'No hay mensajes.' }, { status: 400 });
  }

  const deepseek = createDeepSeek({ apiKey });

  const result = streamText({
    model: deepseek('deepseek-flash'),
    system: buildSystemPrompt(),
    messages: await convertToModelMessages(messages),
    tools: { ofrecer_registro: ofrecerRegistro },
    maxOutputTokens: 700,
    // Sin "thinking": es un bot de FAQ, no necesita cadena de razonamiento.
    // Ahorra latencia y tokens; el widget igual lo ignoraria.
    providerOptions: { deepseek: { thinking: { type: 'disabled' } } },
    onError: ({ error }) => {
      console.error('[chat] error de DeepSeek:', error);
    },
  });

  return result.toUIMessageStreamResponse();
};
