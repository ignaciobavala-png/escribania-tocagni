// Único punto de salida de avisos. Hoy el canal es Cloudflare Email Sending;
// WhatsApp (fase 3) se suma acá sin tocar a quien llama.
import { email as emailEstudio } from '../data/contacto';

// Dirección del dominio incorporado a Email Sending (no la del estudio).
const REMITENTE = { email: 'avisos@escribaniatocagni.com', name: 'Escribanía Tocagni' };

export interface Aviso {
  asunto: string;
  texto: string;
  html?: string;
}

/** Aviso interno: va siempre a la casilla del estudio. */
export function avisarAlEstudio(mail: SendEmail, aviso: Aviso) {
  return enviar(mail, emailEstudio, aviso);
}

/** Mail a una persona puntual (p. ej. quien tiene un turno). Siempre debería
 *  salir de una acción aprobada: ver niveles de autonomía en el plan. */
export function avisarA(mail: SendEmail, destinatario: string, aviso: Aviso) {
  return enviar(mail, destinatario, aviso);
}

async function enviar(mail: SendEmail, to: string, { asunto, texto, html }: Aviso) {
  return mail.send({ to, from: REMITENTE, subject: asunto, text: texto, ...(html && { html }) });
}
