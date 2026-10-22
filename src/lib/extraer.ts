// Interpreta el relato de una consulta ("Marta Gómez, 11 5527 6746, quiere
// vender un departamento, es urgente") y devuelve los campos de la ficha.
// Dos caminos: el modelo (src/pages/api/admin/extraer.ts) y estas reglas, que
// sirven de respaldo si el modelo falla y como validación de lo que él devuelve.

import { servicios, desarrollo } from '../data/servicios';
import { esServicio, esUrgencia, type Urgencia } from './fichas';

export interface Extraido {
  nombre: string | null;
  contacto: string | null;
  servicio: string | null;
  urgencia: Urgencia;
  resumen: string | null;
}

const texto = (v: unknown, max: number) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null);

/** Lo que devuelve el modelo no se toma como bueno: se normaliza campo a campo. */
export function validar(raw: unknown): Extraido {
  const o = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  return {
    nombre: texto(o.nombre, 120),
    contacto: texto(o.contacto, 120),
    servicio: esServicio(o.servicio) ? o.servicio : null,
    urgencia: esUrgencia(o.urgencia) ? o.urgencia : 'normal',
    resumen: texto(o.resumen, 600),
  };
}

/** Catálogo para el prompt: el modelo elige entre estos números y no inventa otros. */
export const catalogoServicios = [...servicios, desarrollo]
  .map((s) => `${s.number} ${s.title}: ${s.description.slice(0, 110)}`)
  .join('\n');

const PALABRAS: [RegExp, string][] = [
  [/desarrollo inmobiliario|emprendimiento|obra en construccion|fideicomiso al costo/, '09'],
  [/fideicomiso/, '07'],
  [/sucesion|herencia|heredero|declaratoria|fallec/, '05'],
  [/testamento|planificacion|patrimonial/, '06'],
  [/sociedad|estatuto|\bsrl\b|\bsas\b|\bsa\b|libros|acciones|cuotas/, '04'],
  [/poder|autorizacion|viaje|menor/, '03'],
  [/acta|constatacion|notificacion|intimacion/, '08'],
  [/compra|venta|vender|comprar|escritura|inmueble|departamento|casa|hipoteca|donacion|permuta|usufructo|lote/, '02'],
  [/certificacion|certificar|firma|apostilla|legalizacion/, '01'],
];

const sinAcentos = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export function porReglas(relato: string): Extraido {
  const t = relato.trim();
  const plano = sinAcentos(t);
  const email = t.match(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/)?.[0] ?? null;
  const tel = t.match(/\+?\d[\d\s().-]{6,}\d/)?.[0]?.trim() ?? null;
  const contacto = email ?? (tel && tel.replace(/\D/g, '').length >= 8 ? tel : null);
  // Nombre: dos o tres palabras con mayúscula inicial, al comienzo del relato.
  const nombre = t.match(/^([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+){1,2})\b/)?.[1] ?? null;
  const servicio = PALABRAS.find(([re]) => re.test(plano))?.[1] ?? null;
  const urgencia: Urgencia = /urgente|urgencia|cuanto antes|lo antes posible|para hoy|para manana|vence/.test(plano) ? 'alta' : 'normal';
  const resumen = t.slice(0, 600) || null;
  return { nombre, contacto, servicio, urgencia, resumen };
}
