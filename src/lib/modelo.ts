// Modelo de lenguaje del panel (asistente y Nueva consulta). Corre en Workers AI:
// los datos de clientes no salen de Cloudflare. Cambiarlo es tocar solo este archivo.
//
// Los modelos nuevos de Workers AI responden con el formato de OpenAI
// (`choices[0].delta.content`) y los viejos con `response`; `textoDe` entiende los dos.

// DeepSeek V4.1 Flash (2026-10-23): en una batería de 12 situaciones armó bien las 5
// acciones pedidas, no propuso ninguna de más, preguntó cuando faltaban datos y no
// obedeció instrucciones escondidas en una ficha. Llama 3.3 (el anterior) propuso 9
// acciones que nadie pidió. Kimi K2.6 y GLM 5.3 rindieron bien pero tardaban 15-25 s.
// Para comparar de nuevo: `node scripts/comparar-modelos.mjs <modelo>` contra `astro dev`.
export const MODELO_PANEL = '@cf/deepseek-ai/deepseek-v4.1-flash-1017';

/** En `astro dev` se puede probar otro modelo con el encabezado `x-modelo` (para comparar). */
export function modeloPara(request: Request): string {
  const pedido = import.meta.env.DEV ? request.headers.get('x-modelo') : null;
  return pedido?.startsWith('@cf/') ? pedido : MODELO_PANEL;
}

/** Opciones propias de cada familia: sin "razonamiento" largo, que suma segundos de espera. */
export function opcionesDe(modelo: string): Record<string, unknown> {
  if (modelo.startsWith('@cf/openai/gpt-oss')) return { reasoning: { effort: 'low' } };
  if (/deepseek-v4|kimi-k2|glm-5/.test(modelo)) return { chat_template_kwargs: { enable_thinking: false } };
  return {};
}

/** Texto de una respuesta (o de un trozo del streaming), en cualquiera de los dos formatos. */
export function textoDe(r: unknown): string | null {
  const o = r as { response?: unknown; choices?: { delta?: { content?: unknown }; message?: { content?: unknown } }[] };
  const t = o?.response ?? o?.choices?.[0]?.delta?.content ?? o?.choices?.[0]?.message?.content;
  if (typeof t === 'string') return t;
  return t && typeof t === 'object' ? JSON.stringify(t) : null; // json_schema puede venir ya como objeto
}
