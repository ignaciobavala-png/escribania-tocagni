// Archivos adjuntos de las consultas. Tipos permitidos por extensión: el tipo
// que declara el navegador no se toma en cuenta, porque lo controla quien sube.

export const MAX_BYTES = 10 * 1024 * 1024;

/** Extensión (sin punto) -> tipo de contenido con el que se sirve. */
export const TIPOS: Record<string, string> = {
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  heic: 'image/heic',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

/** Los que el navegador puede mostrar sin descargar. */
export const VISIBLES = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp']);

export const ACCEPT = Object.keys(TIPOS).map((e) => `.${e}`).join(',');

export const extension = (nombre: string) => nombre.split('.').pop()?.toLowerCase() ?? '';

/** Nombre apto para mostrar y para el header de descarga: sin rutas ni caracteres de control. */
export const limpiarNombre = (nombre: string) =>
  // eslint-disable-next-line no-control-regex
  nombre.replace(/[\\/\x00-\x1f\x7f"]/g, '_').trim().slice(0, 120) || 'archivo';

export const tamano = (bytes: number) =>
  bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
