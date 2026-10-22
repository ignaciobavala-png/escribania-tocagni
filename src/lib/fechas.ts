// Fechas del panel. Todo se razona en hora de Buenos Aires: el Worker corre en
// UTC y, pasadas las 21 hs locales, "hoy" en UTC ya sería mañana.

const TZ = 'America/Argentina/Buenos_Aires';

/** YYYY-MM-DD de hoy en Buenos Aires. */
export function hoyAR(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date());
}

/** Días desde hoy hasta una fecha YYYY-MM-DD (negativo = ya venció). */
export function diasHasta(fecha: string): number {
  const [y, m, d] = fecha.split('-').map(Number);
  const [hy, hm, hd] = hoyAR().split('-').map(Number);
  return Math.round((Date.UTC(y, m - 1, d) - Date.UTC(hy, hm - 1, hd)) / 86_400_000);
}

/** "sáb 25 oct" */
export function fechaCorta(fecha: string): string {
  const [y, m, d] = fecha.split('-').map(Number);
  return new Intl.DateTimeFormat('es-AR', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })
    .format(new Date(Date.UTC(y, m - 1, d)))
    .replace(/\./g, '');
}

/** "09:30" a partir de un instante ISO. */
export function hora(iso: string): string {
  return new Intl.DateTimeFormat('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: TZ }).format(new Date(iso));
}

/** "hace 3 h", "ayer", "hace 4 días" para la antigüedad de una consulta. */
export function haceCuanto(iso: string): string {
  const min = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 60_000));
  if (min < 1) return 'recién';
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.round(h / 24);
  return d === 1 ? 'ayer' : `hace ${d} días`;
}

export interface Semaforo {
  texto: string;
  /** Clases de Tailwind para el punto; el texto va aparte para no depender del color. */
  punto: string;
  nivel: 'rojo' | 'ambar' | 'verde';
}

export function semaforo(fecha: string): Semaforo {
  const d = diasHasta(fecha);
  if (d < 0) return { texto: d === -1 ? 'venció ayer' : `venció hace ${-d} días`, punto: 'bg-red-600', nivel: 'rojo' };
  if (d === 0) return { texto: 'vence hoy', punto: 'bg-red-600', nivel: 'rojo' };
  if (d <= 7) return { texto: d === 1 ? 'vence mañana' : `en ${d} días`, punto: 'bg-red-600', nivel: 'rojo' };
  if (d <= 30) return { texto: `en ${d} días`, punto: 'bg-amber-500', nivel: 'ambar' };
  return { texto: `en ${d} días`, punto: 'bg-emerald-600', nivel: 'verde' };
}

/** YYYY-MM-DD en Buenos Aires de un instante ISO (para fechas de ingreso en planillas). */
export function fechaDeInstante(iso: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date(iso));
}
