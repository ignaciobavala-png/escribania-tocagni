import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { auditar } from '../../../lib/auditoria';
import { MAX_FILAS, norm, validarFicha, validarVencimiento } from '../../../lib/importar';

export const prerender = false;

// D1 acepta lotes de varias sentencias en una sola ida; se parte en tandas.
const TANDA = 50;
async function insertar(sentencias: D1PreparedStatement[]) {
  for (let i = 0; i < sentencias.length; i += TANDA) await env.DB.batch(sentencias.slice(i, i + TANDA));
}

export const POST: APIRoute = async ({ request, locals }) => {
  const usuario = locals.usuario;
  if (!usuario) return new Response('No autorizado', { status: 401 });

  const body = (await request.json().catch(() => null)) as { tipo?: string; filas?: unknown } | null;
  if (!body || !Array.isArray(body.filas)) return Response.json({ error: 'Cuerpo inválido.' }, { status: 400 });
  if (body.filas.length > MAX_FILAS) return Response.json({ error: `Máximo ${MAX_FILAS} filas por importación.` }, { status: 413 });

  let importadas = 0;
  let omitidas = 0;
  let invalidas = 0;
  let sinVincular = 0;

  if (body.tipo === 'fichas') {
    // Una planilla importada dos veces no debe duplicar todo: se omiten las
    // filas idénticas a una ya existente (o repetidas dentro del propio archivo).
    const clave = (n: string | null, c: string | null, r: string | null) => `${norm(n)}|${norm(c)}|${norm(r)}`;
    const existentes = new Set(
      (await env.DB.prepare('SELECT nombre, contacto, resumen FROM fichas').all<{ nombre: string | null; contacto: string | null; resumen: string | null }>())
        .results.map((f) => clave(f.nombre, f.contacto, f.resumen)),
    );
    const sentencias: D1PreparedStatement[] = [];
    for (const cruda of body.filas) {
      const f = validarFicha(cruda);
      if (!f) { invalidas++; continue; }
      const k = clave(f.nombre, f.contacto, f.resumen);
      if (existentes.has(k)) { omitidas++; continue; }
      existentes.add(k);
      sentencias.push(
        env.DB.prepare(
          `INSERT INTO fichas (id, nombre, contacto, servicio, urgencia, estado, resumen, origen) VALUES (?, ?, ?, ?, ?, ?, ?, 'excel')`,
        ).bind(crypto.randomUUID(), f.nombre, f.contacto, f.servicio, f.urgencia, f.estado, f.resumen),
      );
    }
    await insertar(sentencias);
    importadas = sentencias.length;
  } else if (body.tipo === 'vencimientos') {
    // Se vincula a una ficha por nombre exacto. Si el nombre está repetido
    // (dos fichas "Rivas SRL") no se adivina: queda sin vincular.
    const porNombre = new Map<string, string | null>();
    for (const f of (await env.DB.prepare('SELECT id, nombre FROM fichas WHERE nombre IS NOT NULL').all<{ id: string; nombre: string }>()).results) {
      const k = norm(f.nombre);
      porNombre.set(k, porNombre.has(k) ? null : f.id);
    }
    const clave = (c: string, v: string, f: string | null) => `${norm(c)}|${v}|${f ?? ''}`;
    const existentes = new Set(
      (await env.DB.prepare('SELECT concepto, vence, ficha_id FROM vencimientos').all<{ concepto: string; vence: string; ficha_id: string | null }>())
        .results.map((v) => clave(v.concepto, v.vence, v.ficha_id)),
    );
    const sentencias: D1PreparedStatement[] = [];
    for (const cruda of body.filas) {
      const v = validarVencimiento(cruda);
      if (!v) { invalidas++; continue; }
      const fichaId = v.cliente ? (porNombre.get(norm(v.cliente)) ?? null) : null;
      if (v.cliente && !fichaId) sinVincular++;
      const k = clave(v.concepto, v.vence, fichaId);
      if (existentes.has(k)) { omitidas++; continue; }
      existentes.add(k);
      sentencias.push(
        env.DB.prepare('INSERT INTO vencimientos (id, ficha_id, concepto, vence, estado) VALUES (?, ?, ?, ?, ?)')
          .bind(crypto.randomUUID(), fichaId, v.concepto, v.vence, v.estado),
      );
    }
    await insertar(sentencias);
    importadas = sentencias.length;
  } else {
    return Response.json({ error: 'Tipo inválido.' }, { status: 400 });
  }

  await auditar(env.DB, usuario.email, 'importacion', { entidad: body.tipo, detalle: { importadas, omitidas, invalidas } });
  return Response.json({ importadas, omitidas, invalidas, sinVincular });
};
