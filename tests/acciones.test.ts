import { describe, expect, it } from 'vitest';
import { ErrorAccion, validar } from '../src/lib/acciones';

const F = '097a205a-08aa-4cf0-a0a7-9b873c82bd7d';

describe('validar (lo que propone el modelo no se toma como bueno)', () => {
  it('acepta cada tipo con sus campos', () => {
    expect(validar({ tipo: 'ficha_estado', ficha_id: F, estado: 'en_curso' })).toEqual({ tipo: 'ficha_estado', ficha_id: F, estado: 'en_curso' });
    expect(validar({ tipo: 'ficha_urgencia', ficha_id: F, urgencia: 'alta' }).tipo).toBe('ficha_urgencia');
    expect(validar({ tipo: 'ficha_servicio', ficha_id: F, servicio: '04' }).tipo).toBe('ficha_servicio');
    expect(validar({ tipo: 'ficha_nota', ficha_id: F, nota: 'llamó' }).tipo).toBe('ficha_nota');
    expect(validar({ tipo: 'vencimiento_crear', ficha_id: null, concepto: 'Certificado', vence: '2026-11-20' }).tipo).toBe('vencimiento_crear');
    expect(validar({ tipo: 'vencimiento_resolver', vencimiento_id: F }).tipo).toBe('vencimiento_resolver');
    expect(validar({ tipo: 'turno_crear', fecha: '2026-11-02', hora: '11:00', motivo: 'Firma' }).tipo).toBe('turno_crear');
    expect(validar({ tipo: 'turno_cancelar', turno_id: F }).tipo).toBe('turno_cancelar');
  });

  it('ficha_crear completa con valores por defecto y descarta lo inválido', () => {
    expect(validar({ tipo: 'ficha_crear', nombre: ' Ana ', servicio: '99', urgencia: 'altísima' })).toEqual({
      tipo: 'ficha_crear', nombre: 'Ana', contacto: null, resumen: null, servicio: null, urgencia: 'normal',
    });
  });

  it.each([
    [{ tipo: 'borrar_todo' }, /desconocida/],
    [{ tipo: 'ficha_estado', ficha_id: F, estado: 'archivada' }, /Estado/],
    [{ tipo: 'ficha_estado', estado: 'cerrada' }, /consulta/],
    [{ tipo: 'ficha_nota', ficha_id: "x'; DROP TABLE fichas; --", nota: 'a' }, /consulta/],
    [{ tipo: 'vencimiento_crear', concepto: 'X', vence: '31/02/2026' }, /Fecha/],
    [{ tipo: 'vencimiento_crear', concepto: 'X', vence: '2026-02-31' }, /Fecha/],
    [{ tipo: 'turno_crear', fecha: '2026-11-02', hora: '25:00', motivo: 'X' }, /Hora/],
    [{ tipo: 'turno_crear', fecha: '2026-11-02', hora: '10:00' }, /motivo/],
    [{ tipo: 'ficha_crear' }, /nombre/],
  ])('rechaza %o', (raw, msg) => {
    expect(() => validar(raw)).toThrow(ErrorAccion);
    expect(() => validar(raw)).toThrow(msg);
  });
});
