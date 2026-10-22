import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const prerender = false;

// Tope de ~2 MB (varios minutos de voz en webm/opus): evita que un envío
// enorme se traduzca en costo o en un Worker colgado.
const MAX_BYTES = 2_000_000;

export const POST: APIRoute = async ({ request }) => {
  const buf = await request.arrayBuffer();
  if (buf.byteLength === 0) return Response.json({ error: 'Audio vacío.' }, { status: 400 });
  if (buf.byteLength > MAX_BYTES) return Response.json({ error: 'Audio demasiado largo.' }, { status: 413 });

  // Base64 por bloques: String.fromCharCode(...arr) revienta la pila con audios grandes.
  const bytes = new Uint8Array(buf);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }

  try {
    const r = (await env.AI.run('@cf/openai/whisper-large-v3-turbo', {
      audio: btoa(bin),
      language: 'es',
      // Sin initial_prompt a propósito: con audio sin voz el modelo devolvía el
      // prompt como si lo hubieran dicho. El VAD descarta silencio y ruido.
      vad_filter: true,
    })) as { text?: string };
    return Response.json({ texto: (r.text ?? '').trim() });
  } catch (e) {
    console.error('[dictar] error de Workers AI:', e);
    return Response.json({ error: 'No se pudo transcribir el audio.' }, { status: 502 });
  }
};
