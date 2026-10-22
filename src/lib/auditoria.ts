// Registro de auditoría: toda acción del panel o del agente deja una fila.
// Es solo-agregar; nada del código edita ni borra estas filas.

export type Actor = string | 'agente' | 'sistema';

export async function auditar(
  db: D1Database,
  actor: Actor,
  accion: string,
  datos: { entidad?: string; ref?: string; detalle?: unknown } = {},
): Promise<void> {
  await db
    .prepare('INSERT INTO auditoria (actor, accion, entidad, ref, detalle) VALUES (?, ?, ?, ?, ?)')
    .bind(
      actor,
      accion,
      datos.entidad ?? null,
      datos.ref ?? null,
      datos.detalle === undefined ? null : JSON.stringify(datos.detalle),
    )
    .run();
}
