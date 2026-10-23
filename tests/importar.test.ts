import { describe, expect, it } from 'vitest';
import { leerPlanilla, parseFecha } from '../src/lib/importar';

describe('parseFecha', () => {
  it('lee los formatos del estudio', () => {
    expect(parseFecha('25/10/2026')).toBe('2026-10-25');
    expect(parseFecha('5-11-26')).toBe('2026-11-05');
    expect(parseFecha('2026-11-05')).toBe('2026-11-05');
    expect(parseFecha(46320)).toBe('2026-10-25'); // número de serie de Excel
  });

  it('una fecha de Excel a medianoche UTC no se corre al día anterior', () => {
    expect(parseFecha(new Date(Date.UTC(2026, 9, 25)))).toBe('2026-10-25');
  });

  it('rechaza fechas imposibles', () => {
    expect(parseFecha('31/02/2026')).toBeNull();
    expect(parseFecha('mañana')).toBeNull();
    expect(parseFecha(5)).toBeNull();
  });
});

describe('leerPlanilla', () => {
  it('reconoce columnas por sinónimos y avisa lo que no entiende', () => {
    const r = leerPlanilla('fichas', [
      ['Apellido y nombre', 'Celular', 'Tipo de trámite', 'Observaciones', 'Columna rara'],
      ['Ana López', '11 5555-1234', 'Compraventa', 'Vende depto', 'x'],
      ['', '', '', '', ''],
      ['Juan Pérez', '', 'algo raro', '', ''],
    ]);
    expect(r.columnas).toMatchObject({ nombre: 'Apellido y nombre', contacto: 'Celular', servicio: 'Tipo de trámite', resumen: 'Observaciones' });
    expect(r.ignoradas).toEqual(['Columna rara']);
    expect(r.filas).toHaveLength(2); // la fila vacía no cuenta
    expect(r.filas[0].valores).toMatchObject({ nombre: 'Ana López', servicio: '02' });
    expect(r.filas[1].avisos[0]).toMatch(/no reconocido/);
  });

  it('vencimientos sin la columna de fecha no se evalúan fila por fila', () => {
    const r = leerPlanilla('vencimientos', [['Concepto'], ['Certificado']]);
    expect(r.filas[0].errores[0]).toMatch(/columna/);
  });

  it.each([
    ['Certificado de dominio para compraventa', '02'],
    ['Firma de escritura de compraventa', '02'],
    ['Certificación de firmas', '01'],
    ['Sucesión', '05'],
  ])('trámite "%s" -> %s', (tramite, servicio) => {
    const r = leerPlanilla('fichas', [['Nombre', 'Trámite'], ['Ana', tramite]]);
    expect(r.filas[0].valores?.servicio).toBe(servicio);
  });
});
