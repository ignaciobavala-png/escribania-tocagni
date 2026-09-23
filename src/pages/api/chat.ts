import type { APIRoute } from 'astro';
import { streamText, convertToModelMessages, type UIMessage } from 'ai';
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
