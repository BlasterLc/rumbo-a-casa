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
    const porPrograma = <T extends { programa: string }>(xs: T[]) =>
      [...xs].sort((a, b) => a.programa.localeCompare(b.programa));
    for (const paso of construirDemo().pasos) {
      const esperados = evaluarTodosLosProgramas(paso.perfil);
      expect(porPrograma(paso.resultados)).toEqual(porPrograma(esperados));
      expect(porPrograma(paso.plan)).toEqual(porPrograma(generarPlanPapeles(esperados)));
    }
  });

  it('en cada paso los programas a los que aplica van primero y el que no aplica al final', () => {
    const RANGO = { elegible: 0, falta_dato: 1, no_elegible: 2 } as const;
    for (const paso of construirDemo().pasos) {
      const rangos = paso.resultados.map((r) => RANGO[r.estado]);
      expect(rangos).toEqual([...rangos].sort((a, b) => a - b));
    }
    const ultimo = construirDemo().pasos.at(-1)!;
    expect(ultimo.resultados.map((r) => r.programa)).toEqual(['DS49', 'DS19', 'DS52', 'DS1']);
    expect(ultimo.plan.map((p) => p.programa)).toEqual(['DS49', 'DS19', 'DS52']);
  });

  it('la conclusión nombra los programas que aplican antes del que no aplica', () => {
    const texto = construirDemo().pasos.at(-1)!.respuesta;
    const pos = (s: string) => texto.indexOf(s);
    expect(pos('Calificas a DS49')).toBeGreaterThanOrEqual(0);
    expect(pos('Calificas a DS49')).toBeLessThan(pos('Calificas a DS19'));
    expect(pos('Calificas a DS19')).toBeLessThan(pos('Calificas a DS52'));
    expect(pos('Calificas a DS52')).toBeLessThan(pos('No calificas a DS1'));
  });

  it('en inglés: mismos veredictos, mismo orden y sin texto en español', () => {
    const es = construirDemo('es').pasos.at(-1)!;
    const en = construirDemo('en').pasos.at(-1)!;
    expect(en.resultados.map((r) => [r.programa, r.estado])).toEqual(
      es.resultados.map((r) => [r.programa, r.estado]),
    );
    expect(en.respuesta).toMatch(/You qualify for DS49/);
    expect(en.respuesta).toMatch(/You don't qualify for DS1/);
    expect(en.respuesta).toContain('Serviu');
    expect(en.respuesta).not.toMatch(/Calificas/);
    expect(construirDemo('en').pasos).toHaveLength(construirDemo('es').pasos.length);
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

  it('las respuestas del asistente hablan de tú en singular', () => {
    for (const paso of construirDemo().pasos) {
      expect(paso.respuesta).not.toMatch(/\b(ustedes?|les|su|sus|viven|quieren|tienen|califican)\b/i);
    }
  });

  it('los motivos de los resultados del demo no usan impersonal', () => {
    for (const paso of construirDemo().pasos) {
      for (const r of paso.resultados) {
        expect(r.motivo).not.toMatch(/\b(ustedes?|el postulante|cuenta con|es propietario)\b/i);
      }
    }
  });

  it('la conclusión no promete: recuerda que lo confirma el Serviu', () => {
    const ultimo = construirDemo().pasos.at(-1)!;
    expect(ultimo.respuesta).toContain('Serviu');
    expect(ultimo.respuesta).toMatch(/Calificas a DS49/);
    expect(ultimo.respuesta).toMatch(/No calificas a DS1/);
  });
});
