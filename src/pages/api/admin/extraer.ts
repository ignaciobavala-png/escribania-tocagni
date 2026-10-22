import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { catalogoServicios, porReglas, validar, type Extraido } from '../../../lib/extraer';

export const prerender = false;

// Tope del relato: alcanza de sobra para una consulta y acota el costo por pedido.
const MAX_CHARS = 4000;

const SISTEMA = `Sos el asistente de una escribanía de Buenos Aires. Recibís el relato de una consulta, dictado o escrito por el estudio, y extraés los datos de la ficha.
Reglas:
- Usá SOLO lo que el relato dice. Si un dato no está, devolvé null. No inventes nombres, teléfonos ni mails.
- "nombre": la persona o empresa que consulta (no la escribana ni el personal del estudio).
- "contacto": un teléfono o un mail, tal como aparece.
- "servicio": el número del trámite que mejor corresponde, o null si no queda claro:
${catalogoServicios}
  Ojo: pedir o necesitar un "certificado" (de dominio, de libre deuda, etc.) como parte de una compraventa NO es el servicio 01; el 01 es certificar firmas y copias. Vender, comprar o hipotecar un inmueble es el 02.
- "urgencia": "alta" solo si el relato habla de urgencia, de un plazo cercano o de un vencimiento; "baja" si dice que no hay apuro; si no, "normal".
- "resumen": una o dos frases claras en español rioplatense sobre qué necesita, sin repetir el teléfono ni el mail.`;

const ESQUEMA = {
  type: 'object',
  properties: {
    nombre: { type: ['string', 'null'] },
    contacto: { type: ['string', 'null'] },
    servicio: { type: ['string', 'null'] },
    urgencia: { type: 'string', enum: ['baja', 'normal', 'alta'] },
    resumen: { type: ['string', 'null'] },
  },
  required: ['nombre', 'contacto', 'servicio', 'urgencia', 'resumen'],
};

export const POST: APIRoute = async ({ request }) => {
  const { texto } = (await request.json().catch(() => ({}))) as { texto?: unknown };
  if (typeof texto !== 'string' || texto.trim().length < 3) {
    return Response.json({ error: 'Falta el relato.' }, { status: 400 });
  }
  const relato = texto.trim().slice(0, MAX_CHARS);

  let datos: Extraido;
  let via: 'ia' | 'reglas' = 'ia';
  try {
    const r = (await Promise.race([
      env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
        messages: [
          { role: 'system', content: SISTEMA },
          { role: 'user', content: relato },
        ],
        response_format: { type: 'json_schema', json_schema: ESQUEMA },
        max_tokens: 400,
        temperature: 0,
      }),
      new Promise((_, rechazar) => setTimeout(() => rechazar(new Error('tiempo agotado')), 20_000)),
    ])) as { response?: unknown };
    // Con json_schema la respuesta puede venir ya como objeto o como texto.
    const bruto = typeof r.response === 'string' ? JSON.parse(r.response) : r.response;
    datos = validar(bruto);
  } catch (e) {
    console.error('[extraer] falló el modelo, se usan reglas:', e);
    datos = porReglas(relato);
    via = 'reglas';
  }
  return Response.json({ ...datos, via });
};
