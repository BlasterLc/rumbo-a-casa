import { describe, it, expect } from 'vitest';
import { generarPlanPapeles } from '../../src/chat/papeles';
import type { EstadoElegibilidad, Programa, ResultadoPrograma } from '../../src/rules-engine/index';

const resultado = (
  programa: Programa,
  estado: EstadoElegibilidad,
  detalle?: Record<string, unknown>,
): ResultadoPrograma => ({
  programa,
  estado,
  motivo: 'x',
  regla: { decreto: 'x', fuente: 'x', fechaConsulta: '2026-09-22' },
  detalle,
});

const nombres = (plan: ReturnType<typeof generarPlanPapeles>[number]) =>
  plan.documentos.map((d) => d.nombre).join(' | ');

describe('generarPlanPapeles', () => {
  it('sin programas elegibles devuelve un plan vacío', () => {
    expect(
      generarPlanPapeles([resultado('DS49', 'no_elegible'), resultado('DS52', 'falta_dato')]),
    ).toEqual([]);
  });

  it('solo arma plan para los programas elegibles, en orden', () => {
    const plan = generarPlanPapeles([
      resultado('DS49', 'elegible'),
      resultado('DS1', 'no_elegible'),
      resultado('DS52', 'elegible'),
    ]);
    expect(plan.map((p) => p.programa)).toEqual(['DS49', 'DS52']);
  });

  it('todo plan incluye cédula y Cartola Hogar del RSH', () => {
    const plan = generarPlanPapeles(
      (['DS49', 'DS1', 'DS19', 'DS52'] as const).map((p) => resultado(p, 'elegible')),
    );
    for (const p of plan) {
      expect(nombres(p)).toContain('Cédula de identidad vigente');
      expect(nombres(p)).toContain('Cartola Hogar');
      expect(p.fuente.length).toBeGreaterThan(0);
    }
  });

  it('DS49 incluye las tres declaraciones y el formulario de postulación', () => {
    const [ds49] = generarPlanPapeles([resultado('DS49', 'elegible')]);
    expect(nombres(ds49)).toContain('Declaración de Núcleo Familiar');
    expect(nombres(ds49)).toContain('Declaración Jurada de Postulación');
    expect(nombres(ds49)).toContain('Mandato de Ahorro');
    expect(nombres(ds49)).toContain('Formulario de Postulación');
  });

  it('DS52 incluye los formularios A-01, A-02 y A-03', () => {
    const [ds52] = generarPlanPapeles([resultado('DS52', 'elegible')]);
    expect(nombres(ds52)).toContain('A-01');
    expect(nombres(ds52)).toContain('A-02');
    expect(nombres(ds52)).toContain('A-03');
  });

  it('DS19 ruta A agrega el certificado de subsidio; ruta B no', () => {
    const [rutaA] = generarPlanPapeles([resultado('DS19', 'elegible', { ruta: 'A' })]);
    const [rutaB] = generarPlanPapeles([resultado('DS19', 'elegible', { ruta: 'B' })]);
    expect(nombres(rutaA)).toContain('Certificado de subsidio');
    expect(nombres(rutaB)).not.toContain('Certificado de subsidio');
  });

  it('DS1 avisa en la fuente que los formularios son los del llamado vigente', () => {
    const [ds1] = generarPlanPapeles([resultado('DS1', 'elegible')]);
    expect(ds1.fuente).toContain('669/2026');
  });
});

describe('generarPlanPapeles por idioma', () => {
  const todos = () =>
    generarPlanPapeles([
      resultado('DS49', 'elegible'),
      resultado('DS1', 'elegible'),
      resultado('DS19', 'elegible', { ruta: 'A' }),
      resultado('DS52', 'elegible'),
    ], 'en');

  it('en español no cambia nada respecto de antes', () => {
    const [ds49] = generarPlanPapeles([resultado('DS49', 'elegible')]);
    expect(ds49.documentos[0]).toEqual({
      nombre: 'Cédula de identidad vigente',
      detalle: 'De quien postula y de cada integrante del grupo familiar mayor de 18 años.',
    });
    expect(ds49.documentos[2]).toEqual({ nombre: 'Formulario de Postulación Individual (FSEV)' });
    expect(generarPlanPapeles([resultado('DS49', 'elegible')], 'es')).toEqual([ds49]);
  });

  it('en inglés el nombre oficial no se traduce', () => {
    const es = generarPlanPapeles([resultado('DS49', 'elegible'), resultado('DS52', 'elegible')], 'es');
    const en = generarPlanPapeles([resultado('DS49', 'elegible'), resultado('DS52', 'elegible')], 'en');
    expect(en.map((p) => p.documentos.map((d) => d.nombre))).toEqual(
      es.map((p) => p.documentos.map((d) => d.nombre)),
    );
  });

  it('en inglés todo documento trae una explicación', () => {
    for (const plan of todos()) {
      for (const doc of plan.documentos) {
        expect(doc.detalle, `${plan.programa}: ${doc.nombre}`).toBeTruthy();
        expect(doc.detalle!.length).toBeGreaterThan(15);
      }
    }
  });

  it('en inglés la fuente cambia de idioma y DS1 sigue citando la resolución', () => {
    const es = generarPlanPapeles([resultado('DS1', 'elegible')], 'es')[0];
    const en = generarPlanPapeles([resultado('DS1', 'elegible')], 'en')[0];
    expect(en.fuente).not.toBe(es.fuente);
    expect(en.fuente).toContain('669/2026');
  });

  it('en inglés la ruta A de DS19 suma el certificado de subsidio, y la ruta B no', () => {
    const rutaA = generarPlanPapeles([resultado('DS19', 'elegible', { ruta: 'A' })], 'en')[0];
    const rutaB = generarPlanPapeles([resultado('DS19', 'elegible', { ruta: 'B' })], 'en')[0];
    expect(rutaA.documentos.map((d) => d.nombre)).toContain('Certificado de subsidio vigente');
    expect(rutaB.documentos.map((d) => d.nombre)).not.toContain('Certificado de subsidio vigente');
  });

  it('solo incluye los programas elegibles, en cualquier idioma', () => {
    const plan = generarPlanPapeles([resultado('DS49', 'no_elegible'), resultado('DS52', 'falta_dato')], 'en');
    expect(plan).toEqual([]);
  });
});
