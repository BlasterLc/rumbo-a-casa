import { describe, it, expect } from 'vitest';
import { construirDemo } from '../../src/chat/demo';
import { PerfilSchema, evaluarTodosLosProgramas } from '../../src/rules-engine/index';
import { generarPlanPapeles } from '../../src/chat/papeles';

const estados = (resultados: { programa: string; estado: string }[]) =>
  Object.fromEntries(resultados.map((r) => [r.programa, r.estado]));

describe('construirDemo', () => {
  it('marca la respuesta como modo demo y describe a la familia ficticia', () => {
    const demo = construirDemo();
    expect(demo.modo).toBe('demo');
    expect(demo.familia.descripcion).toMatch(/ficticia/i);
    expect(demo.pasos.length).toBeGreaterThanOrEqual(3);
  });

  it('cada paso trae el mensaje del usuario y la respuesta fija del asistente', () => {
    for (const paso of construirDemo().pasos) {
      expect(paso.usuario.length).toBeGreaterThan(0);
      expect(paso.respuesta.length).toBeGreaterThan(0);
    }
  });

  it('el perfil de cada paso es válido y solo va completándose', () => {
    const { pasos } = construirDemo();
    const conocidos = (perfil: object) =>
      Object.entries(perfil).filter(([, valor]) => valor !== 'desconocido').map(([campo]) => campo);

    let anteriores: string[] = [];
    for (const paso of pasos) {
      expect(PerfilSchema.safeParse(paso.perfil).success).toBe(true);
      const actuales = conocidos(paso.perfil);
      expect(actuales).toEqual(expect.arrayContaining(anteriores));
      expect(actuales.length).toBeGreaterThan(anteriores.length);
      anteriores = actuales;
    }
  });

  it('resultados y plan salen del motor de reglas real, no están escritos a mano', () => {
    for (const paso of construirDemo().pasos) {
      const esperados = evaluarTodosLosProgramas(paso.perfil);
      expect(paso.resultados).toEqual(esperados);
      expect(paso.plan).toEqual(generarPlanPapeles(esperados));
    }
  });

  it('al principio no se puede decidir nada: los 4 programas piden datos', () => {
    const [primero] = construirDemo().pasos;
    expect(Object.values(estados(primero.resultados))).toEqual(Array(4).fill('falta_dato'));
    expect(primero.plan).toEqual([]);
  });

  it('al final la familia califica a DS49, DS19 y DS52 pero no a DS1', () => {
    const { pasos } = construirDemo();
    const ultimo = pasos[pasos.length - 1];
    expect(estados(ultimo.resultados)).toEqual({
      DS49: 'elegible',
      DS1: 'no_elegible',
      DS19: 'elegible',
      DS52: 'elegible',
    });
    expect(ultimo.plan.map((p) => p.programa).sort()).toEqual(['DS19', 'DS49', 'DS52']);
  });

  it('el motivo de DS1 explica por qué no califica y cita el decreto', () => {
    const ultimo = construirDemo().pasos.at(-1)!;
    const ds1 = ultimo.resultados.find((r) => r.programa === 'DS1')!;
    expect(ds1.motivo.length).toBeGreaterThan(0);
    expect(ds1.regla.decreto).toMatch(/D\.S\./);
  });

  it('devuelve una copia nueva cada vez, sin compartir objetos entre llamadas', () => {
    const a = construirDemo();
    const b = construirDemo();
    expect(a).toEqual(b);
    expect(a.pasos[0].perfil).not.toBe(b.pasos[0].perfil);
  });
});
