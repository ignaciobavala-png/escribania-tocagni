// Lectura de planillas de Excel. Lógica pura, sin dependencias del navegador ni
// del Worker: la usa la vista previa (cliente) y la validación definitiva (servidor).
//
// El estudio lleva sus datos "a su manera", así que no se exige una plantilla
// rígida: las columnas se reconocen por sinónimos ("Teléfono", "Celular" y
// "Contacto" son lo mismo) y lo que no se reconoce se ignora y se avisa.
import { ESTADOS, URGENCIAS, esEstado, esUrgencia, serviciosOpciones, type Estado, type Urgencia } from './fichas';

export const MAX_FILAS = 500;

export type Tipo = 'fichas' | 'vencimientos';

export interface FichaImport {
  nombre: string | null;
  contacto: string | null;
  servicio: string | null;
  urgencia: Urgencia;
  estado: Estado;
  resumen: string | null;
}
export interface VencimientoImport {
  concepto: string;
  /** YYYY-MM-DD */
  vence: string;
  /** Nombre de la persona/ficha a la que pertenece, si la planilla lo trae. */
  cliente: string | null;
  estado: 'abierto' | 'resuelto';
}

export type Celda = string | number | boolean | Date | null | undefined;

export interface FilaLeida<T> {
  /** Número de fila en la planilla (1 = encabezado), para que se pueda ubicar. */
  fila: number;
  valores: T | null;
  errores: string[];
  avisos: string[];
}

export interface Lectura<T> {
  filas: FilaLeida<T>[];
  /** Campo reconocido -> título de columna de la planilla. */
  columnas: Record<string, string | null>;
  ignoradas: string[];
  truncada: boolean;
}

export const norm = (s: unknown): string =>
  String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();

// Orden = prioridad: si hay dos columnas candidatas gana la primera de la lista.
const SINONIMOS: Record<Tipo, Record<string, string[]>> = {
  fichas: {
    nombre: ['nombre', 'cliente', 'apellido y nombre', 'nombre y apellido', 'persona', 'titular'],
    contacto: ['contacto', 'telefono', 'tel', 'celular', 'whatsapp', 'mail', 'email', 'correo'],
    servicio: ['tramite', 'tipo de tramite', 'servicio', 'acto', 'tipo'],
    urgencia: ['urgencia', 'prioridad'],
    estado: ['estado', 'situacion'],
    resumen: ['detalle', 'resumen', 'consulta', 'observaciones', 'notas', 'descripcion'],
  },
  vencimientos: {
    concepto: ['concepto', 'vencimiento', 'documento', 'tramite', 'descripcion', 'detalle'],
    vence: ['vence', 'fecha de vencimiento', 'fecha vencimiento', 'vto', 'fecha limite', 'fecha'],
    cliente: ['cliente', 'nombre', 'persona', 'sociedad', 'titular'],
    estado: ['estado', 'situacion'],
  },
};

const OBLIGATORIAS: Record<Tipo, string[]> = { fichas: [], vencimientos: ['concepto', 'vence'] };

const texto = (v: Celda): string | null => {
  if (v === null || v === undefined) return null;
  const s = v instanceof Date ? v.toISOString().slice(0, 10) : String(v).trim();
  return s === '' ? null : s;
};

/** Devuelve YYYY-MM-DD o null. Acepta Date, número de serie de Excel y texto. */
export function parseFecha(v: Celda): string | null {
  const iso = (y: number, m: number, d: number) => {
    const t = new Date(Date.UTC(y, m - 1, d));
    // Rechaza 31/02 y similares: Date los "corrige" en silencio.
    if (t.getUTCFullYear() !== y || t.getUTCMonth() !== m - 1 || t.getUTCDate() !== d) return null;
    return t.toISOString().slice(0, 10);
  };
  if (v === null || v === undefined || v === '') return null;
  // IMPORTANTE: getUTC*. La librería devuelve la fecha como medianoche UTC; con
  // getDate() local, en Argentina (UTC-3) el 25 se corre al 24.
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : iso(v.getUTCFullYear(), v.getUTCMonth() + 1, v.getUTCDate());
  if (typeof v === 'number') {
    // Número de serie de Excel (días desde 1899-12-30).
    if (v < 20_000 || v > 80_000) return null;
    const t = new Date(Date.UTC(1899, 11, 30) + Math.floor(v) * 86_400_000);
    return iso(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate());
  }
  const s = String(v).trim();
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return iso(+m[1], +m[2], +m[3]);
  // Formato argentino: día primero.
  m = s.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2}|\d{4})$/);
  if (m) return iso(m[3].length === 2 ? 2000 + +m[3] : +m[3], +m[2], +m[1]);
  return null;
}

// Cómo lo llamaría el estudio en una planilla, por trámite (ver data/servicios.ts).
const PALABRAS_SERVICIO: [string, RegExp][] = [
  // El 09 va primero: "desarrollos inmobiliarios" también contiene "inmobil" (02).
  ['09', /desarrollo|emprendimiento|loteo/],
  // El 02 antes que el 01: "certificado de dominio para compraventa" o "firma de escritura"
  // son operaciones inmobiliarias, no certificaciones (el 01 es certificar firmas y copias).
  ['02', /inmobil|compraventa|compra|venta|escritura|hipotec|donacion|permuta|usufructo|propiedad horizontal/],
  ['01', /certific|firma|apostill|legaliz/],
  ['03', /poder|autorizacion|viaje/],
  ['04', /societ|sociedad|estatuto|libros|rubrica|srl|\bsa\b|cuotas|acciones/],
  ['05', /sucesi|heredero|testamentaria|tracto/],
  ['06', /testamento|patrimon|planificacion/],
  ['07', /fideicomis/],
  ['08', /acta|constatacion/],
];

function parseServicio(v: Celda): string | null {
  const t = norm(v);
  if (!t) return null;
  const num = t.match(/^0?([1-9])$/);
  if (num) return `0${num[1]}`;
  const porPalabra = PALABRAS_SERVICIO.find(([, re]) => re.test(t));
  if (porPalabra) return porPalabra[0];
  // "operaciones inmobiliarias", "inmobiliaria", "poder"... por coincidencia parcial.
  const hit = serviciosOpciones.find((o) => {
    const titulo = norm(o.texto.split('·')[1]);
    return titulo === t || titulo.includes(t) || (t.length >= 5 && t.includes(titulo));
  });
  return hit?.valor ?? null;
}

function parseUrgencia(v: Celda): Urgencia | null {
  const t = norm(v);
  if (!t) return null;
  if (esUrgencia(t)) return t;
  if (/urgent|alta|inmediat/.test(t)) return 'alta';
  if (/baja|sin apuro/.test(t)) return 'baja';
  return null;
}

function parseEstadoFicha(v: Celda): Estado | null {
  const t = norm(v);
  if (!t) return null;
  if (esEstado(t)) return t;
  const porEtiqueta = (Object.entries(ESTADOS) as [Estado, string][]).find(([, e]) => norm(e) === t);
  if (porEtiqueta) return porEtiqueta[0];
  if (/cerrad|termin|finaliz|listo|archiv/.test(t)) return 'cerrada';
  if (/document|falta|pendiente/.test(t)) return 'esperando_documentacion';
  if (/curso|proceso|tramit|trabaj/.test(t)) return 'en_curso';
  if (/nuev/.test(t)) return 'nueva';
  return null;
}

function parseEstadoVenc(v: Celda): 'abierto' | 'resuelto' | null {
  const t = norm(v);
  if (!t) return null;
  if (/resuelt|cumplid|hech|ok|cerrad|renovad|listo/.test(t)) return 'resuelto';
  if (/abiert|pendiente|vigente/.test(t)) return 'abierto';
  return null;
}

/** Asigna a cada campo la primera columna cuyo título coincide con un sinónimo. */
function detectar(tipo: Tipo, titulos: string[]) {
  const usados = new Set<number>();
  const columnas: Record<string, number | null> = {};
  for (const [campo, sinonimos] of Object.entries(SINONIMOS[tipo])) {
    let idx: number | null = null;
    for (const s of sinonimos) {
      const i = titulos.findIndex((t, k) => !usados.has(k) && norm(t) === s);
      if (i !== -1) { idx = i; break; }
    }
    if (idx !== null) usados.add(idx);
    columnas[campo] = idx;
  }
  const ignoradas = titulos.filter((t, i) => t.trim() !== '' && !usados.has(i));
  return { columnas, ignoradas };
}

/** Convierte las filas crudas de la hoja (la primera es el encabezado) en datos validados. */
export function leerPlanilla(tipo: 'fichas', datos: Celda[][]): Lectura<FichaImport>;
export function leerPlanilla(tipo: 'vencimientos', datos: Celda[][]): Lectura<VencimientoImport>;
export function leerPlanilla(tipo: Tipo, datos: Celda[][]): Lectura<FichaImport> | Lectura<VencimientoImport> {
  const [encabezado = [], ...cuerpo] = datos;
  const titulos = encabezado.map((c) => String(c ?? '').trim());
  const { columnas, ignoradas } = detectar(tipo, titulos);

  const faltan = OBLIGATORIAS[tipo].filter((c) => columnas[c] === null);
  const mapa = Object.fromEntries(Object.entries(columnas).map(([k, i]) => [k, i === null ? null : titulos[i]]));
  const base = { columnas: mapa, ignoradas, truncada: cuerpo.length > MAX_FILAS };

  if (faltan.length) {
    // Sin las columnas esenciales no tiene sentido evaluar fila por fila.
    return { ...base, filas: [{ fila: 1, valores: null, avisos: [], errores: [`No se encontró la columna: ${faltan.join(', ')}.`] }] };
  }

  const get = (fila: Celda[], campo: string): Celda => (columnas[campo] === null ? null : fila[columnas[campo]!]);
  const filas: FilaLeida<never>[] = [];

  cuerpo.slice(0, MAX_FILAS).forEach((fila, i) => {
    // Las filas totalmente vacías (típico de Excel con formato arrastrado) no cuentan.
    if (fila.every((c) => texto(c) === null)) return;
    const errores: string[] = [];
    const avisos: string[] = [];
    let valores: unknown = null;

    if (tipo === 'fichas') {
      const nombre = texto(get(fila, 'nombre'));
      const resumen = texto(get(fila, 'resumen'));
      const rawServ = get(fila, 'servicio');
      const servicio = parseServicio(rawServ);
      if (texto(rawServ) && !servicio) avisos.push(`Trámite "${texto(rawServ)}" no reconocido: queda sin definir.`);
      const rawUrg = get(fila, 'urgencia');
      const urgencia = parseUrgencia(rawUrg);
      if (texto(rawUrg) && !urgencia) avisos.push(`Urgencia "${texto(rawUrg)}" no reconocida: se usa Normal.`);
      const rawEst = get(fila, 'estado');
      const estado = parseEstadoFicha(rawEst);
      if (texto(rawEst) && !estado) avisos.push(`Estado "${texto(rawEst)}" no reconocido: se usa Nueva.`);
      if (!nombre && !resumen) errores.push('Falta el nombre o el detalle.');
      valores = { nombre, contacto: texto(get(fila, 'contacto')), servicio, urgencia: urgencia ?? 'normal', estado: estado ?? 'nueva', resumen } satisfies FichaImport;
    } else {
      const concepto = texto(get(fila, 'concepto'));
      const rawFecha = get(fila, 'vence');
      const vence = parseFecha(rawFecha);
      if (!concepto) errores.push('Falta el concepto.');
      if (!vence) errores.push(texto(rawFecha) ? `Fecha "${texto(rawFecha)}" no válida (usá dd/mm/aaaa).` : 'Falta la fecha de vencimiento.');
      const rawEst = get(fila, 'estado');
      const estado = parseEstadoVenc(rawEst);
      if (texto(rawEst) && !estado) avisos.push(`Estado "${texto(rawEst)}" no reconocido: se usa Abierto.`);
      valores = { concepto: concepto ?? '', vence: vence ?? '', cliente: texto(get(fila, 'cliente')), estado: estado ?? 'abierto' } satisfies VencimientoImport;
    }
    filas.push({ fila: i + 2, valores: errores.length ? null : (valores as never), errores, avisos });
  });

  return { ...base, filas } as Lectura<FichaImport> | Lectura<VencimientoImport>;
}

// Validación del servidor sobre datos YA canónicos: no se confía en lo que
// manda el navegador aunque venga de la vista previa.
const corto = (v: unknown, max: number) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null);

export function validarFicha(o: unknown): FichaImport | null {
  const r = (o ?? {}) as Record<string, unknown>;
  const nombre = corto(r.nombre, 120);
  const resumen = corto(r.resumen, 2000);
  if (!nombre && !resumen) return null;
  return {
    nombre,
    contacto: corto(r.contacto, 120),
    servicio: serviciosOpciones.some((s) => s.valor === r.servicio) ? (r.servicio as string) : null,
    urgencia: esUrgencia(r.urgencia) ? r.urgencia : 'normal',
    estado: esEstado(r.estado) ? r.estado : 'nueva',
    resumen,
  };
}

export function validarVencimiento(o: unknown): VencimientoImport | null {
  const r = (o ?? {}) as Record<string, unknown>;
  const concepto = corto(r.concepto, 160);
  const vence = typeof r.vence === 'string' ? parseFecha(r.vence) : null;
  if (!concepto || !vence) return null;
  return { concepto, vence, cliente: corto(r.cliente, 120), estado: r.estado === 'resuelto' ? 'resuelto' : 'abierto' };
}

export { URGENCIAS };
