import { servicios, desarrollo } from '../data/servicios';

export const ESTADOS = {
  nueva: 'Nueva',
  en_curso: 'En curso',
  esperando_documentacion: 'Esperando documentación',
  cerrada: 'Cerrada',
} as const;
export type Estado = keyof typeof ESTADOS;

export const URGENCIAS = { baja: 'Baja', normal: 'Normal', alta: 'Alta' } as const;
export type Urgencia = keyof typeof URGENCIAS;

/** Clases de la etiqueta de estado; el texto siempre acompaña al color. */
export const claseEstado: Record<Estado, string> = {
  nueva: 'bg-accent/15 text-accent-dark',
  en_curso: 'bg-primary/10 text-primary',
  esperando_documentacion: 'bg-amber-100 text-amber-900',
  cerrada: 'bg-neutral-200 text-neutral-600',
};

const todos = [...servicios, desarrollo];
export const serviciosOpciones = todos.map((s) => ({ valor: s.number, texto: `${s.number} · ${s.title}` }));
export const nombreServicio = (n: string | null) => todos.find((s) => s.number === n)?.title ?? null;

export const esEstado = (v: unknown): v is Estado => typeof v === 'string' && v in ESTADOS;
export const esUrgencia = (v: unknown): v is Urgencia => typeof v === 'string' && v in URGENCIAS;
export const esServicio = (v: unknown): v is string => typeof v === 'string' && todos.some((s) => s.number === v);
