// /llms.txt — resumen curado del negocio para asistentes de IA (llmstxt.org).
//
// Se genera en build desde las MISMAS fuentes que pintan el sitio
// (servicios.ts, faqs.ts, contacto.ts, agente.ts), asi que la ficha que leen
// los modelos no puede divergir de lo que ve una persona ni de lo que sabe el
// chatbot. Mismo criterio que Schema.astro y Faq.astro.
import type { APIRoute } from 'astro';
import { servicios, desarrollo } from '../data/servicios';
import { faqs } from '../data/faqs';
import { phoneDisplay, email, whatsappUrl } from '../data/contacto';
import { TRAYECTORIA, REGISTRO, DIRECCION, HORARIO } from '../data/agente';

const SITE = 'https://escribaniatocagni.com';
const todos = [...servicios, desarrollo];

export const prerender = true;

export const GET: APIRoute = () => {
  const ficha = [
    '# Escribanía Tocagni',
    '',
    `> Escribanía notarial en Belgrano y Núñez, Ciudad Autónoma de Buenos Aires (CABA), Argentina. Dirigida por Inés Tocagni (${REGISTRO}), con ${TRAYECTORIA}. Brinda certificaciones, operaciones inmobiliarias, sucesiones, sociedades, fideicomisos y asesoramiento en desarrollos inmobiliarios.`,
    '',
    '## Datos clave',
    '',
    '- Rubro: escribanía / notaría (servicios notariales)',
    '- Titular: Inés Tocagni, escribana titular',
    `- Matrícula: ${REGISTRO} (Colegio de Escribanos de la Ciudad de Buenos Aires)`,
    `- Dirección: ${DIRECCION}`,
    '- Zona de atención: Belgrano y Núñez, CABA',
    `- Teléfono / WhatsApp: ${phoneDisplay}`,
    `- Email: ${email}`,
    `- Horario: ${HORARIO}`,
    '- Atención: con turno previo (se recomienda WhatsApp)',
    `- Sitio web: ${SITE}/`,
    '',
    '## Servicios',
    '',
    ...todos.map((s) => `- ${s.title}: ${s.description}`),
    '',
    '## Preguntas frecuentes',
    '',
    ...faqs.map((f) => `- ${f.question}`),
    '',
    '## Enlaces',
    '',
    `- Sitio web: ${SITE}/`,
    `- Contenido completo (servicios y respuestas): ${SITE}/llms-full.txt`,
    `- Contacto por WhatsApp: ${whatsappUrl}`,
    '',
  ].join('\n');

  return new Response(ficha, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
