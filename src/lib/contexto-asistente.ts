// Qué ve el asistente del panel según la pantalla en la que está la persona.
//
// El navegador manda solo la ruta; los datos se leen acá, en el servidor, con el
// mismo D1 que usa el panel. El modelo corre en Workers AI: nada sale de Cloudflare.
// Solo lectura: el asistente explica y sugiere, nunca modifica una ficha.

import { CATEGORIAS, REQUERIDOS, categoriaPorClave } from '../data/expediente';
import { ESTADOS, nombreServicio } from './fichas';
import { diasHasta, fechaCorta, hoyAR } from './fechas';

export interface Contexto {
  /** Nombre corto de la pantalla, para el saludo y el prompt. */
  seccion: string;
  /** Texto con los datos que el modelo puede usar. */
  datos: string;
  sugerencias: string[];
}

const SUGERENCIAS: Record<string, string[]> = {
  inicio: ['¿Qué es lo más urgente hoy?', 'Resumime el día', '¿Qué consultas siguen sin responder?'],
  consultas: ['¿Cuáles son las consultas más urgentes?', '¿Quién espera documentación?'],
  ficha: ['Resumime este caso', '¿Qué documentos faltan?', '¿Cuál es el próximo paso?'],
  expedientes: ['¿Qué expedientes están más incompletos?'],
  expediente: ['¿Qué falta en este expediente?', '¿Qué documentos suelen pedirse para este trámite?'],
  turnos: ['¿Qué turnos hay esta semana?', '¿Hay algún turno sin ficha?'],
  vencimientos: ['¿Qué vence primero?', '¿Hay algo vencido?'],
  nueva: ['¿Qué datos conviene pedir en una consulta?', '¿Qué documentos pide una compraventa?'],
  excel: ['¿Cómo tiene que ser el Excel para importar?'],
};

const ROTULOS: Record<string, string> = {
  inicio: 'Inicio', consultas: 'Consultas', ficha: 'Ficha de una consulta', expedientes: 'Lista de expedientes',
  expediente: 'Expediente de una consulta', turnos: 'Turnos', vencimientos: 'Vencimientos', nueva: 'Nueva consulta', excel: 'Excel (importar y exportar)',
};

function seccionDe(ruta: string): { clave: string; id?: string } {
  const r = ruta.replace(/\/$/, '');
  const m = r.match(/^\/admin\/(fichas|expedientes)\/([\w-]+)$/);
  if (m) return { clave: m[1] === 'fichas' ? 'ficha' : 'expediente', id: m[2] };
  const s = r.replace(/^\/admin\/?/, '');
  return { clave: s in SUGERENCIAS ? s : 'inicio' };
}

/** Instante UTC -> "2026-10-24 15:30" en hora de Buenos Aires (UTC-3, sin horario de verano). */
const horaAR = (iso: string) => new Date(new Date(iso).getTime() - 3 * 3_600_000).toISOString().slice(0, 16).replace('T', ' ');

const linea = (...p: (string | null | undefined)[]) => p.filter(Boolean).join(' · ');

async function abiertas(db: D1Database): Promise<string> {
  const { results } = await db
    .prepare(
      `SELECT id, nombre, servicio, urgencia, estado, creada, resumen FROM fichas WHERE estado != 'cerrada'
       ORDER BY CASE urgencia WHEN 'alta' THEN 0 WHEN 'normal' THEN 1 ELSE 2 END, creada DESC LIMIT 25`,
    )
    .all<{ id: string; nombre: string | null; servicio: string | null; urgencia: string; estado: keyof typeof ESTADOS; creada: string; resumen: string | null }>();
  if (!results.length) return 'No hay consultas abiertas.';
  return results
    .map((f) => `- /admin/fichas/${f.id} (id ${f.id}) · ${linea(f.nombre ?? 'Sin nombre', nombreServicio(f.servicio), `urgencia ${f.urgencia}`, ESTADOS[f.estado], `creada ${fechaCorta(f.creada.slice(0, 10))}`, f.resumen?.slice(0, 120))}`)
    .join('\n');
}

async function venc(db: D1Database, dias: number): Promise<string> {
  const { results } = await db
    .prepare(
      `SELECT v.id, v.concepto, v.vence, v.ficha_id, f.nombre FROM vencimientos v LEFT JOIN fichas f ON f.id = v.ficha_id
       WHERE v.estado = 'abierto' AND v.vence <= date(?, '+' || ? || ' days') ORDER BY v.vence LIMIT 25`,
    )
    .bind(hoyAR(), dias)
    .all<{ id: string; concepto: string; vence: string; ficha_id: string | null; nombre: string | null }>();
  if (!results.length) return 'No hay vencimientos abiertos en ese plazo.';
  return results
    .map((v) => {
      const d = diasHasta(v.vence);
      const cuando = d < 0 ? `VENCIDO hace ${-d} días` : d === 0 ? 'vence HOY' : `vence en ${d} días`;
      return `- [vencimiento ${v.id}] ${v.concepto} · ${fechaCorta(v.vence)} (${cuando})${v.nombre ? ` · ${v.nombre}` : ''}${v.ficha_id ? ` · /admin/fichas/${v.ficha_id}` : ''}`;
    })
    .join('\n');
}

async function turnos(db: D1Database, dias: number): Promise<string> {
  const { results } = await db
    .prepare(
      `SELECT t.id, t.inicio, t.motivo, t.estado, t.ficha_id, f.nombre FROM turnos t LEFT JOIN fichas f ON f.id = t.ficha_id
       WHERE t.estado != 'cancelado' AND date(t.inicio, '-3 hours') BETWEEN ? AND date(?, '+' || ? || ' days') ORDER BY t.inicio LIMIT 25`,
    )
    .bind(hoyAR(), hoyAR(), dias)
    .all<{ id: string; inicio: string; motivo: string | null; estado: string; ficha_id: string | null; nombre: string | null }>();
  if (!results.length) return 'No hay turnos en ese plazo.';
  return results
    .map((t) => `- [turno ${t.id}] ${linea(horaAR(t.inicio), t.nombre ?? 'sin ficha asociada', t.motivo, t.estado)}`)
    .join('\n');
}

async function detalleFicha(db: D1Database, id: string): Promise<string> {
  const f = await db
    .prepare('SELECT * FROM fichas WHERE id = ?')
    .bind(id)
    .first<{ nombre: string | null; contacto: string | null; servicio: string | null; urgencia: string; estado: keyof typeof ESTADOS; creada: string; resumen: string | null; origen: string }>();
  if (!f) return 'La consulta no existe.';
  const [docs, vs, ts] = await Promise.all([
    db.prepare(`SELECT nombre, coalesce(categoria, 'otros') AS categoria FROM documentos WHERE ficha_id = ?`).bind(id).all<{ nombre: string; categoria: string }>(),
    db.prepare(`SELECT id, concepto, vence, estado FROM vencimientos WHERE ficha_id = ? ORDER BY vence`).bind(id).all<{ id: string; concepto: string; vence: string; estado: string }>(),
    db.prepare(`SELECT id, inicio, motivo, estado FROM turnos WHERE ficha_id = ? ORDER BY inicio`).bind(id).all<{ id: string; inicio: string; motivo: string | null; estado: string }>(),
  ]);
  const presentes = new Set(docs.results.map((d) => d.categoria));
  const pedidos = (f.servicio && REQUERIDOS[f.servicio]) || [];
  const faltan = pedidos.filter((k) => !presentes.has(k)).map((k) => categoriaPorClave(k).titulo);
  return [
    `ID de la consulta: ${id}`,
    `Nombre: ${f.nombre ?? 'sin nombre'}`,
    `Contacto: ${f.contacto ?? 'sin dato'}`,
    `Trámite: ${nombreServicio(f.servicio) ?? 'sin definir'}`,
    `Urgencia: ${f.urgencia} · Estado: ${ESTADOS[f.estado]} · Origen: ${f.origen} · Creada: ${fechaCorta(f.creada.slice(0, 10))}`,
    `Detalle: ${f.resumen ?? 'sin detalle'}`,
    `Documentos cargados (${docs.results.length}): ${docs.results.map((d) => `${d.nombre} [${categoriaPorClave(d.categoria).titulo}]`).join('; ') || 'ninguno'}`,
    pedidos.length ? `Categorías sugeridas que faltan (lista orientativa sin validar): ${faltan.join(', ') || 'ninguna, está completo'}` : 'Este trámite no tiene lista de documentos sugerida.',
    `Vencimientos: ${vs.results.map((v) => `[vencimiento ${v.id}] ${v.concepto} ${fechaCorta(v.vence)} (${v.estado})`).join('; ') || 'ninguno'}`,
    `Turnos: ${ts.results.map((t) => `[turno ${t.id}] ${horaAR(t.inicio)} ${t.motivo ?? ''} (${t.estado})`).join('; ') || 'ninguno'}`,
  ].join('\n');
}

export async function contextoPara(db: D1Database, ruta: string): Promise<Contexto> {
  const { clave, id } = seccionDe(ruta);
  let datos = '';
  switch (clave) {
    case 'ficha':
    case 'expediente':
      datos = `Consulta que está mirando:\n${await detalleFicha(db, id!)}`;
      break;
    case 'turnos':
      datos = `Turnos de los próximos 14 días:\n${await turnos(db, 14)}`;
      break;
    case 'vencimientos':
      datos = `Vencimientos abiertos (próximos 60 días y vencidos):\n${await venc(db, 60)}`;
      break;
    case 'nueva':
    case 'excel':
      datos = 'Esta pantalla no muestra datos de clientes.';
      break;
    default: {
      const [f, v, t] = await Promise.all([abiertas(db), venc(db, 30), turnos(db, 1)]);
      datos = `Consultas abiertas (más urgentes primero):\n${f}\n\nVencimientos (próximos 30 días y vencidos):\n${v}\n\nTurnos de hoy y mañana:\n${t}`;
    }
  }
  return { seccion: ROTULOS[clave], datos, sugerencias: SUGERENCIAS[clave] };
}

/** Solo las sugerencias, sin tocar la base: las usa el layout para pintar los atajos. */
export const sugerenciasDe = (ruta: string) => SUGERENCIAS[seccionDe(ruta).clave];
export const rotuloDe = (ruta: string) => ROTULOS[seccionDe(ruta).clave];

// Para que el prompt conozca las categorías sin repetirlas a mano.
export const nombresCategorias = CATEGORIAS.map((c) => c.titulo).join(', ');
