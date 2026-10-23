import { describe, expect, it } from 'vitest';
import { leerPropuestas, motivoRechazo, textoVisible, tiposPedidos } from '../src/lib/propuestas';

const F = '097a205a-08aa-4cf0-a0a7-9b873c82bd7d';

describe('leerPropuestas', () => {
  it('lee el formato clave=valor y no muestra la línea', () => {
    const r = `Te dejo el turno para confirmar.\nACCION: tipo=turno_crear; ficha_id=${F}; fecha=2026-11-02; hora=11:00; motivo=Firma; cita=el lunes 2 de noviembre a las 11`;
    expect(textoVisible(r)).toBe('Te dejo el turno para confirmar.');
    expect(leerPropuestas(r)).toEqual([
      { tipo: 'turno_crear', ficha_id: F, fecha: '2026-11-02', hora: '11:00', motivo: 'Firma', cita: 'el lunes 2 de noviembre a las 11' },
    ]);
  });

  it('acepta JSON e ignora el JSON roto (el error típico de Llama)', () => {
    const r = `ACCION: {"tipo":"ficha_estado","ficha_id":"${F}","estado":"en_curso"}\nACCION: {"tipo":"turno_crear", "ficha_id:${F}", "hora":"15:00"}`;
    expect(leerPropuestas(r)).toEqual([{ tipo: 'ficha_estado', ficha_id: F, estado: 'en_curso' }]);
  });

  it('convierte vacío y null en null, saca comillas y corta en 3', () => {
    const r = 'ACCION: tipo=ficha_crear; nombre="Ana"; contacto=; servicio=null\n'.repeat(5);
    const p = leerPropuestas(r);
    expect(p).toHaveLength(3);
    expect(p[0]).toEqual({ tipo: 'ficha_crear', nombre: 'Ana', contacto: null, servicio: null });
  });

  it('una respuesta sin acciones no propone nada', () => {
    expect(leerPropuestas('No puedo borrar consultas.')).toEqual([]);
  });
});

describe('tiposPedidos', () => {
  it.each([
    ['¿Qué expedientes tenemos cargados?'],
    ['cuántas consultas hay'],
    ['¿Cuáles están cerradas?'],
    ['Resumime este caso'],
    ['¿Qué es lo más urgente hoy?'],
  ])('una pregunta no pide nada: %s', (t) => {
    expect(tiposPedidos(t)).toBe('ninguno');
  });

  it.each([
    ['Pasala a esperando documentación', 'ficha_estado'],
    ['agendale un turno el martes', 'turno_crear'],
    ['cargalo como vencimiento', 'vencimiento_crear'],
    ['anotale que llamó', 'ficha_nota'],
    ['Marcá como resuelto el de Estudio Rivas', 'vencimiento_resolver'],
    ['cancelá el turno de mañana', 'turno_cancelar'],
    ['subile la urgencia', 'ficha_urgencia'],
    ['¿la podés pasar a en curso?', 'ficha_estado'],
  ])('reconoce el pedido: %s', (t, tipo) => {
    const r = tiposPedidos(t);
    expect(r instanceof Set && r.has(tipo)).toBe(true);
  });

  it('una confirmación corta habilita cualquier acción', () => {
    expect(tiposPedidos('dale')).toBe('todos');
    expect(tiposPedidos('Sí, hacelo')).toBe('todos');
  });
});

describe('motivoRechazo', () => {
  const estado = { tipo: 'ficha_estado', ficha_id: F, estado: 'en_curso' };
  const nota = { tipo: 'ficha_nota', ficha_id: F, nota: 'trae el DNI' };

  it('ante una pregunta descarta cualquier propuesta', () => {
    expect(motivoRechazo(nota, ['¿Qué expedientes tenemos cargados?'])).toMatch(/pregunta/);
  });

  it('una nota no habilita un cambio de estado de yapa', () => {
    expect(motivoRechazo(nota, ['agregá una nota: el socio trae el DNI el lunes'])).toBeNull();
    expect(motivoRechazo(estado, ['agregá una nota: el socio trae el DNI el lunes'])).toMatch(/distinto/);
  });

  it('mira solo el último mensaje', () => {
    expect(motivoRechazo(estado, ['pasala a en curso', '¿y qué documentos faltan?'])).toMatch(/pregunta/);
  });

  it('un turno sin la fecha dicha por la persona se descarta', () => {
    const inventado = { tipo: 'turno_crear', fecha: '2026-10-30', hora: '10:00', motivo: 'Consulta general', cita: 'el viernes 30 a las 10' };
    expect(motivoRechazo(inventado, ['agendemos un turno'])).toMatch(/fecha/);
    expect(motivoRechazo({ ...inventado, cita: undefined }, ['agendá un turno el viernes 30 a las 10'])).toMatch(/fecha/);
  });

  it('un turno con la fecha citada pasa (sin importar tildes ni mayúsculas)', () => {
    const ok = { tipo: 'turno_crear', fecha: '2026-11-02', hora: '11:00', cita: 'el LUNES 2 de noviembre a las 11' };
    expect(motivoRechazo(ok, ['Agendá un turno con Carlos el lunes 2 de noviembre a las 11'])).toBeNull();
  });
});
