import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// El sitio es `output: "static"`: una ruta del panel o de la API sin `prerender = false`
// se genera como archivo fijo en el build y en producción deja de funcionar, aunque en
// `astro dev` ande. Pasó el 2026-10-23 con /api/admin/asistente-accion.
function archivos(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? archivos(p) : /\.(ts|astro)$/.test(n) ? [p] : [];
  });
}

describe('rutas dinámicas', () => {
  const rutas = [...archivos('src/pages/api'), ...archivos('src/pages/admin')];

  it('hay rutas para revisar', () => {
    expect(rutas.length).toBeGreaterThan(10);
  });

  it.each(rutas)('%s declara prerender = false', (ruta) => {
    expect(readFileSync(ruta, 'utf8')).toMatch(/export const prerender = false/);
  });
});
