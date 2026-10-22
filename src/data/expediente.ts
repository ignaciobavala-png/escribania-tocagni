// Expediente de cada trámite: categorías de documentos, qué suele hacer falta
// según el servicio y un clasificador por nombre de archivo.
//
// IMPORTANTE: las listas de `REQUERIDOS` son una sugerencia de arranque, no un
// criterio jurídico. Hay que validarlas con la escribana antes de tomarlas como
// referencia (mismo criterio que las FAQ: es contenido legal, no copy).

export interface Categoria {
  clave: string;
  titulo: string;
  /** Una línea para quien sube el archivo. */
  ayuda: string;
}

export const CATEGORIAS: Categoria[] = [
  { clave: 'identidad', titulo: 'Identidad de las partes', ayuda: 'DNI, pasaporte, CUIT/CUIL' },
  { clave: 'titulo', titulo: 'Título de propiedad', ayuda: 'Escritura anterior o antecedente de dominio' },
  { clave: 'cert_dominio', titulo: 'Certificado de dominio', ayuda: 'Informe del Registro de la Propiedad' },
  { clave: 'cert_inhibicion', titulo: 'Certificado de inhibición', ayuda: 'Informe de inhibiciones de las partes' },
  { clave: 'libre_deuda', titulo: 'Libre deuda e impuestos', ayuda: 'ABL, ARBA/AGIP, expensas' },
  { clave: 'plano', titulo: 'Planos y catastro', ayuda: 'Planos, mensura, datos catastrales' },
  { clave: 'estatuto', titulo: 'Estatuto o contrato social', ayuda: 'Documentación constitutiva de la sociedad' },
  { clave: 'partida', titulo: 'Partidas', ayuda: 'Nacimiento, matrimonio, defunción' },
  { clave: 'informes', titulo: 'Informes', ayuda: 'Informes recibidos o preparados' },
  { clave: 'borradores', titulo: 'Borradores', ayuda: 'Proyectos y minutas en revisión' },
  { clave: 'escritura', titulo: 'Escritura y copias', ayuda: 'Copia de trabajo del acto otorgado' },
  { clave: 'otros', titulo: 'Otros', ayuda: 'Todo lo demás' },
];

export const categoriaPorClave = (clave: string | null) =>
  CATEGORIAS.find((c) => c.clave === clave) ?? CATEGORIAS[CATEGORIAS.length - 1];

export const esCategoria = (v: unknown): v is string => typeof v === 'string' && CATEGORIAS.some((c) => c.clave === v);

/** Por número de servicio (data/servicios.ts): qué categorías suelen hacer falta. */
export const REQUERIDOS: Record<string, string[]> = {
  '01': ['identidad'],
  '02': ['identidad', 'titulo', 'cert_dominio', 'cert_inhibicion', 'libre_deuda'],
  '03': ['identidad'],
  '04': ['identidad', 'estatuto'],
  '05': ['identidad', 'partida', 'titulo'],
  '06': ['identidad', 'titulo'],
  '07': ['identidad', 'titulo'],
  '08': ['identidad'],
  '09': ['identidad', 'titulo', 'plano'],
};

export interface Progreso {
  /** Categorías sugeridas para el servicio ([] si todavía no se definió). */
  requeridos: Categoria[];
  completos: Categoria[];
  faltan: Categoria[];
  /** 0 a 1; null si no hay lista sugerida. */
  avance: number | null;
}

export function progreso(servicio: string | null, conArchivos: Set<string>): Progreso {
  const claves = (servicio && REQUERIDOS[servicio]) || [];
  const requeridos = claves.map((k) => categoriaPorClave(k));
  const completos = requeridos.filter((c) => conArchivos.has(c.clave));
  const faltan = requeridos.filter((c) => !conArchivos.has(c.clave));
  return { requeridos, completos, faltan, avance: requeridos.length ? completos.length / requeridos.length : null };
}

const normalizar = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[_\-.]+/g, ' ');

// El orden importa: lo específico antes que lo genérico ("certificado de
// dominio" no debe caer en "titulo", ni "escritura anterior" en "escritura").
const REGLAS: [RegExp, string][] = [
  [/inhibicion/, 'cert_inhibicion'],
  [/dominio/, 'cert_dominio'],
  [/libre deuda|deuda|\babl\b|arba|agip|expensa|impuesto/, 'libre_deuda'],
  [/plano|catastr|mensura/, 'plano'],
  [/estatuto|contrato social|\bsas\b|\bsrl\b/, 'estatuto'],
  [/partida|nacimiento|defuncion|matrimonio/, 'partida'],
  [/\bdni\b|documento|pasaporte|cuil|cuit|identidad|cedula/, 'identidad'],
  [/titulo|escritura anterior|antecedente/, 'titulo'],
  [/informe/, 'informes'],
  [/borrador|proyecto|minuta/, 'borradores'],
  [/escritura|copia/, 'escritura'],
];

/** Sugiere la categoría a partir del nombre del archivo (el usuario puede cambiarla). */
export function sugerirCategoria(nombreArchivo: string): { clave: string; segura: boolean } {
  const n = normalizar(nombreArchivo);
  for (const [re, clave] of REGLAS) if (re.test(n)) return { clave, segura: true };
  return { clave: 'otros', segura: false };
}
