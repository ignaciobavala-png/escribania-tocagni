// Propuestas de acción del asistente: cómo se leen de su respuesta y cuándo se aceptan.
// Sin dependencias de Cloudflare ni del navegador, para poder probarlo (`pnpm test`).
//
// El modelo cierra su respuesta con líneas `ACCION: tipo=...; campo=valor`. El cajón las
// saca del texto visible y las convierte en tarjetas; el servidor las filtra con
// `exigirPedido` antes de mostrarlas. Ver CLAUDE.md > Asistente del panel.

const MARCA = 'ACCION:';

/** Texto para mostrar: todo lo anterior a la primera línea ACCION. */
export function textoVisible(t: string): string {
  const i = t.indexOf(MARCA);
  return (i < 0 ? t : t.slice(0, i)).trimEnd();
}

/** Propuestas de la respuesta (máximo 3). Acepta `clave=valor; ...` y, por si acaso, JSON. */
export function leerPropuestas(t: string): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = [];
  for (const l of t.split('\n')) {
    const i = l.indexOf(MARCA);
    if (i < 0) continue;
    const crudo = l.slice(i + MARCA.length).trim();
    if (crudo.startsWith('{')) {
      try { out.push(JSON.parse(crudo)); } catch { /* mal formado: se ignora */ }
      continue;
    }
    const campos: Record<string, string | null> = {};
    for (const par of crudo.split(';')) {
      const k = par.indexOf('=');
      if (k < 1) continue;
      const v = par.slice(k + 1).trim().replace(/^["']|["']$/g, '');
      campos[par.slice(0, k).trim()] = v === '' || v === 'null' ? null : v;
    }
    if (campos.tipo) out.push(campos);
  }
  return out.slice(0, 3);
}

export const plano = (t: string) =>
  t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();

// Verbos de pedido (imperativo o infinitivo, ya sin tildes, con pronombre pegado o no:
// "pasala", "agendale", "cargalo") y qué tipos de acción habilita cada uno. "cargados" no
// cuenta: después del verbo tiene que venir un pronombre o el fin de la palabra.
const CLITICO = '(?:me|te|le|la|lo|les|las|los|nos|selo|sela|melo|mela)?';
const VERBOS: [string, string[]][] = [
  ['agend(?:a|ar|e|emos)|program(?:a|ar)|reprogram(?:a|ar)|reserv(?:a|ar)', ['turno_crear']],
  ['cancel(?:a|ar|emos)|suspend(?:e|er)', ['turno_cancelar']],
  ['marc(?:a|ar|ue)|resolv(?:e|er)', ['vencimiento_resolver', 'ficha_estado']],
  ['pas(?:a|ar)|cambi(?:a|ar)|mov(?:e|er)|cerr(?:a|ar)|reabr(?:i|ir)|actualiz(?:a|ar)|pon(?:e|er)|sub(?:i|ir)|baj(?:a|ar)', ['ficha_estado', 'ficha_urgencia', 'ficha_servicio']],
  ['agreg(?:a|ar|ue)|anot(?:a|ar|e)|dej(?:a|ar)|sum(?:a|ar)', ['ficha_nota', 'turno_crear', 'vencimiento_crear']],
  ['carg(?:a|ar|ue)|registr(?:a|ar)|cre(?:a|ar)|abr(?:i|ir)|arm(?:a|ar)', ['vencimiento_crear', 'ficha_crear', 'turno_crear', 'ficha_nota']],
];
const REGLAS = VERBOS.map(([v, tipos]) => [new RegExp(`\\b(?:${v})${CLITICO}\\b`), tipos] as const);
const CONFIRMA = /^(si|dale|ok|okey|bueno|perfecto|de una|hacelo|hacela|confirmo|confirmalo|adelante|por favor)\b/;
const CON_FECHA = new Set(['turno_crear', 'vencimiento_crear']);

/** Tipos de acción que habilita un mensaje; `'todos'` si es una confirmación ("dale"). */
export function tiposPedidos(texto: string): Set<string> | 'todos' | 'ninguno' {
  const t = plano(texto);
  const tipos = new Set(REGLAS.filter(([re]) => re.test(t)).flatMap(([, ts]) => ts));
  if (tipos.size) return tipos;
  return CONFIRMA.test(t) ? 'todos' : 'ninguno';
}

/**
 * Frenos que no dependen del modelo (Llama proponía acciones ante simples preguntas e
 * inventaba fechas). Devuelve el motivo del rechazo, o null si la propuesta puede mostrarse.
 * 1. Lo último que escribió la persona tiene que pedir ese tipo de acción, o ser una
 *    confirmación corta. "agregá una nota" no habilita un cambio de estado.
 * 2. En turnos y vencimientos, `cita` (la frase que dice la fecha) tiene que estar en lo
 *    que escribió la persona: si no, la fecha la eligió el modelo.
 */
export function motivoRechazo(accion: Record<string, unknown>, dichos: string[]): string | null {
  const mensajes = dichos.map(plano);
  const permitidos = tiposPedidos(dichos[dichos.length - 1] ?? '');
  const tipo = typeof accion.tipo === 'string' ? accion.tipo : '';
  if (permitidos === 'ninguno') return 'Eso fue una pregunta, no un pedido: no se propone ningún cambio.';
  if (permitidos !== 'todos' && !permitidos.has(tipo)) return 'El asistente propuso algo distinto de lo que pediste.';
  if (CON_FECHA.has(tipo)) {
    const cita = typeof accion.cita === 'string' ? plano(accion.cita) : '';
    if (cita.length < 3 || !mensajes.some((m) => m.includes(cita))) {
      return 'Falta la fecha o la hora: el asistente tiene que preguntarlas.';
    }
  }
  return null;
}
