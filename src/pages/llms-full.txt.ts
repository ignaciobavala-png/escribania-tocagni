// /llms-full.txt — version completa de la ficha para asistentes de IA: incluye
// las respuestas enteras de las FAQ y las etapas de los desarrollos
// inmobiliarios. Mismas fuentes que el sitio (ver llms.txt.ts).
import type { APIRoute } from 'astro';
import { servicios, desarrollo, etapasDesarrollo } from '../data/servicios';
import { faqs } from '../data/faqs';
import { phoneDisplay, email, whatsappUrl } from '../data/contacto';
import { TRAYECTORIA, REGISTRO, DIRECCION, HORARIO } from '../data/agente';

const SITE = 'https://escribaniatocagni.com';
const todos = [...servicios, desarrollo];

export const prerender = true;

export const GET: APIRoute = () => {
  const full = [
    '# Escribanía Tocagni — ficha completa',
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
    ...todos.map((s) => `### ${s.title}\n\n${s.description}`),
    '',
    '## Desarrollos inmobiliarios — etapas del acompañamiento',
    '',
    ...etapasDesarrollo.map((e, i) => `${i + 1}. ${e}`),
    '',
    '## Preguntas frecuentes',
    '',
    ...faqs.map((f) => `### ${f.question}\n\n${f.answer}`),
    '',
    '## Contacto',
    '',
    `- WhatsApp / Teléfono: ${phoneDisplay} (${whatsappUrl})`,
    `- Email: ${email}`,
    `- Dirección: ${DIRECCION}`,
    `- Horario: ${HORARIO}`,
    '',
  ].join('\n');

  return new Response(full, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
