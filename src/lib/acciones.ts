// Acciones que el asistente del panel puede proponer.
//
// El modelo NUNCA escribe en la base: propone una acción en texto, el servidor
// la valida y la describe (`prever`), la persona la confirma con un botón y recién
// ahí se ejecuta (`ejecutar`), que vuelve a validar. Así un dato de cliente con
// instrucciones escondidas no puede mover nada solo. No hay acciones de borrado.

import { auditar } from './auditoria';
import { esFechaISO, fechaCorta } from './fechas';
import { ESTADOS, URGENCIAS, esEstado, esServicio, esUrgencia, nombreServicio, type Estado, type Urgencia } from './fichas';

export type Accion =
  | { tipo: 'ficha_crear'; nombre: string | null; contacto: string | null; servicio: string | null; urgencia: Urgencia; resumen: string | null }
  | { tipo: 'ficha_estado'; ficha_id: string; estado: Estado }
  | { tipo: 'ficha_urgencia'; ficha_id: string; urgencia: Urgencia }
  | { tipo: 'ficha_servicio'; ficha_id: string; servicio: string }
  | { tipo: 'ficha_nota'; ficha_id: string; nota: string }
  | { tipo: 'vencimiento_crear'; ficha_id: string | null; concepto: string; vence: string }
  | { tipo: 'vencimiento_resolver'; vencimiento_id: string }
  | { tipo: 'turno_crear'; ficha_id: string | null; fecha: string; hora: string; motivo: string | null }
  | { tipo: 'turno_cancelar'; turno_id: string };

export class ErrorAccion extends Error {}

const txt = (v: unknown, max: number) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null);
const id = (v: unknown) => (typeof v === 'string' && /^[\w-]{8,64}$/.test(v) ? v : null);
const fecha = (v: unknown) => (esFechaISO(v) ? v : null);
const hora = (v: unknown) => (typeof v === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(v) ? v : null);

/** Normaliza lo que propuso el modelo. Lo que no entra en un tipo conocido se rechaza. */
export function validar(raw: unknown): Accion {
  const o = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const falta = (m: string) => { throw new ErrorAccion(m); };
  switch (o.tipo) {
    case 'ficha_crear': {
      const a = { nombre: txt(o.nombre, 120), contacto: txt(o.contacto, 120), resumen: txt(o.resumen, 2000) };
      if (!a.nombre && !a.resumen) falta('Falta el nombre o el detalle de la consulta.');
      return { tipo: 'ficha_crear', ...a, servicio: esServicio(o.servicio) ? o.servicio : null, urgencia: esUrgencia(o.urgencia) ? o.urgencia : 'normal' };
    }
    case 'ficha_estado':
      if (!id(o.ficha_id)) falta('Falta la consulta.');
      if (!esEstado(o.estado)) falta('Estado inválido.');
      return { tipo: 'ficha_estado', ficha_id: id(o.ficha_id)!, estado: o.estado as Estado };
    case 'ficha_urgencia':
      if (!id(o.ficha_id)) falta('Falta la consulta.');
      if (!esUrgencia(o.urgencia)) falta('Urgencia inválida.');
      return { tipo: 'ficha_urgencia', ficha_id: id(o.ficha_id)!, urgencia: o.urgencia as Urgencia };
    case 'ficha_servicio':
      if (!id(o.ficha_id)) falta('Falta la consulta.');
      if (!esServicio(o.servicio)) falta('Trámite inválido.');
      return { tipo: 'ficha_servicio', ficha_id: id(o.ficha_id)!, servicio: o.servicio as string };
    case 'ficha_nota':
      if (!id(o.ficha_id)) falta('Falta la consulta.');
      if (!txt(o.nota, 600)) falta('Falta el texto de la nota.');
      return { tipo: 'ficha_nota', ficha_id: id(o.ficha_id)!, nota: txt(o.nota, 600)! };
    case 'vencimiento_crear':
      if (!txt(o.concepto, 160)) falta('Falta el concepto del vencimiento.');
      if (!fecha(o.vence)) falta('Fecha inválida.');
      return { tipo: 'vencimiento_crear', ficha_id: id(o.ficha_id), concepto: txt(o.concepto, 160)!, vence: fecha(o.vence)! };
    case 'vencimiento_resolver':
      if (!id(o.vencimiento_id)) falta('Falta el vencimiento.');
      return { tipo: 'vencimiento_resolver', vencimiento_id: id(o.vencimiento_id)! };
    case 'turno_crear': {
      if (!fecha(o.fecha)) falta('Fecha inválida.');
      if (!hora(o.hora)) falta('Hora inválida.');
      const a = { ficha_id: id(o.ficha_id), motivo: txt(o.motivo, 160) };
      if (!a.ficha_id && !a.motivo) falta('Indicá el motivo o la consulta del turno.');
      return { tipo: 'turno_crear', ...a, fecha: fecha(o.fecha)!, hora: hora(o.hora)! };
    }
    case 'turno_cancelar':
      if (!id(o.turno_id)) falta('Falta el turno.');
      return { tipo: 'turno_cancelar', turno_id: id(o.turno_id)! };
    default:
      return falta('Acción desconocida.');
  }
}

async function ficha(db: D1Database, fid: string) {
  const f = await db.prepare('SELECT nombre, estado, urgencia, resumen FROM fichas WHERE id = ?').bind(fid).first<{ nombre: string | null; estado: Estado; urgencia: Urgencia; resumen: string | null }>();
  if (!f) throw new ErrorAccion('Esa consulta no existe.');
  return f;
}
const quien = (n: string | null) => n ?? 'la consulta sin nombre';

/** Texto claro de lo que va a pasar. También comprueba que lo referido exista. */
export async function prever(db: D1Database, a: Accion): Promise<string> {
  switch (a.tipo) {
    case 'ficha_crear':
      return `Crear la consulta de ${a.nombre ?? 'una persona sin nombre'}${a.servicio ? ` (${nombreServicio(a.servicio)})` : ''}, urgencia ${URGENCIAS[a.urgencia].toLowerCase()}.`;
    case 'ficha_estado': {
      const f = await ficha(db, a.ficha_id);
      if (f.estado === a.estado) throw new ErrorAccion(`La consulta de ${quien(f.nombre)} ya está «${ESTADOS[a.estado]}».`);
      return `Pasar la consulta de ${quien(f.nombre)} de «${ESTADOS[f.estado]}» a «${ESTADOS[a.estado]}».`;
    }
    case 'ficha_urgencia': {
      const f = await ficha(db, a.ficha_id);
      if (f.urgencia === a.urgencia) throw new ErrorAccion(`La consulta de ${quien(f.nombre)} ya tiene urgencia ${URGENCIAS[a.urgencia].toLowerCase()}.`);
      return `Cambiar la urgencia de ${quien(f.nombre)} de ${URGENCIAS[f.urgencia].toLowerCase()} a ${URGENCIAS[a.urgencia].toLowerCase()}.`;
    }
    case 'ficha_servicio': {
      const f = await ficha(db, a.ficha_id);
      return `Marcar la consulta de ${quien(f.nombre)} como «${nombreServicio(a.servicio)}».`;
    }
    case 'ficha_nota': {
      const f = await ficha(db, a.ficha_id);
      return `Agregar al detalle de ${quien(f.nombre)}: «${a.nota}».`;
    }
    case 'vencimiento_crear': {
      const f = a.ficha_id ? await ficha(db, a.ficha_id) : null;
      return `Cargar el vencimiento «${a.concepto}» para el ${fechaCorta(a.vence)}${f ? `, de ${quien(f.nombre)}` : ''}.`;
    }
    case 'vencimiento_resolver': {
      const v = await db.prepare('SELECT concepto, vence, estado FROM vencimientos WHERE id = ?').bind(a.vencimiento_id).first<{ concepto: string; vence: string; estado: string }>();
      if (!v) throw new ErrorAccion('Ese vencimiento no existe.');
      if (v.estado === 'resuelto') throw new ErrorAccion('Ese vencimiento ya estaba resuelto.');
      return `Marcar como resuelto el vencimiento «${v.concepto}» (${fechaCorta(v.vence)}).`;
    }
    case 'turno_crear': {
      if (new Date(`${a.fecha}T${a.hora}:00-03:00`).getTime() < Date.now()) {
        throw new ErrorAccion('Esa fecha y hora ya pasaron: no se puede agendar un turno en el pasado.');
      }
      const f = a.ficha_id ? await ficha(db, a.ficha_id) : null;
      return `Agendar un turno el ${fechaCorta(a.fecha)} a las ${a.hora}${f ? ` con ${quien(f.nombre)}` : ''}${a.motivo ? `: ${a.motivo}` : ''}.`;
    }
    case 'turno_cancelar': {
      const t = await db.prepare(`SELECT t.inicio, t.motivo, t.estado, f.nombre FROM turnos t LEFT JOIN fichas f ON f.id = t.ficha_id WHERE t.id = ?`).bind(a.turno_id).first<{ inicio: string; motivo: string | null; estado: string; nombre: string | null }>();
      if (!t) throw new ErrorAccion('Ese turno no existe.');
      if (t.estado === 'cancelado') throw new ErrorAccion('Ese turno ya estaba cancelado.');
      return `Cancelar el turno del ${fechaCorta(new Date(new Date(t.inicio).getTime() - 3 * 3_600_000).toISOString().slice(0, 10))}${t.nombre ? ` con ${t.nombre}` : ''}${t.motivo ? ` (${t.motivo})` : ''}.`;
    }
  }
}

/** Ejecuta una acción ya confirmada. Devuelve el id de lo creado, si corresponde. */
export async function ejecutar(db: D1Database, email: string, a: Accion): Promise<{ id?: string }> {
  await prever(db, a); // revalida que todo exista y siga vigente
  const via = { via: 'asistente' };
  switch (a.tipo) {
    case 'ficha_crear': {
      const nuevo = crypto.randomUUID();
      await db.prepare('INSERT INTO fichas (id, nombre, contacto, resumen, servicio, urgencia, origen) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .bind(nuevo, a.nombre, a.contacto, a.resumen, a.servicio, a.urgencia, 'manual').run();
      await auditar(db, email, 'ficha_creada', { entidad: 'ficha', ref: nuevo, detalle: via });
      return { id: nuevo };
    }
    case 'ficha_estado':
    case 'ficha_urgencia':
    case 'ficha_servicio': {
      const [col, val] = a.tipo === 'ficha_estado' ? ['estado', a.estado] : a.tipo === 'ficha_urgencia' ? ['urgencia', a.urgencia] : ['servicio', a.servicio];
      await db.prepare(`UPDATE fichas SET ${col} = ? WHERE id = ?`).bind(val, a.ficha_id).run();
      await auditar(db, email, 'ficha_editada', { entidad: 'ficha', ref: a.ficha_id, detalle: { campos: [col], ...via } });
      return {};
    }
    case 'ficha_nota': {
      const f = await ficha(db, a.ficha_id);
      const hoy = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' }).format(new Date());
      const nuevo = [f.resumen, `[${hoy}] ${a.nota}`].filter(Boolean).join('\n').slice(-2000);
      await db.prepare('UPDATE fichas SET resumen = ? WHERE id = ?').bind(nuevo, a.ficha_id).run();
      await auditar(db, email, 'ficha_editada', { entidad: 'ficha', ref: a.ficha_id, detalle: { campos: ['resumen'], ...via } });
      return {};
    }
    case 'vencimiento_crear': {
      const nuevo = crypto.randomUUID();
      await db.prepare('INSERT INTO vencimientos (id, ficha_id, concepto, vence) VALUES (?, ?, ?, ?)').bind(nuevo, a.ficha_id, a.concepto, a.vence).run();
      await auditar(db, email, 'vencimiento_creado', { entidad: 'vencimiento', ref: nuevo, detalle: via });
      return { id: nuevo };
    }
    case 'vencimiento_resolver':
      await db.prepare(`UPDATE vencimientos SET estado = 'resuelto' WHERE id = ?`).bind(a.vencimiento_id).run();
      await auditar(db, email, 'vencimiento_resuelto', { entidad: 'vencimiento', ref: a.vencimiento_id, detalle: via });
      return {};
    case 'turno_crear': {
      // Hora de Buenos Aires (UTC-3, sin horario de verano), guardada como instante UTC.
      const inicio = new Date(`${a.fecha}T${a.hora}:00-03:00`);
      if (Number.isNaN(inicio.getTime())) throw new ErrorAccion('Fecha inválida.');
      const nuevo = crypto.randomUUID();
      await db.prepare('INSERT INTO turnos (id, ficha_id, inicio, motivo) VALUES (?, ?, ?, ?)').bind(nuevo, a.ficha_id, inicio.toISOString(), a.motivo).run();
      await auditar(db, email, 'turno_creado', { entidad: 'turno', ref: nuevo, detalle: via });
      return { id: nuevo };
    }
    case 'turno_cancelar':
      await db.prepare(`UPDATE turnos SET estado = 'cancelado' WHERE id = ?`).bind(a.turno_id).run();
      await auditar(db, email, 'turno_cancelado', { entidad: 'turno', ref: a.turno_id, detalle: via });
      return {};
  }
}
