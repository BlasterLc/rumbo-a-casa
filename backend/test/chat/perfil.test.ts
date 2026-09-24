import { describe, it, expect } from 'vitest';
import { PERFIL_VACIO, VALOR_UF, aplicarCambios } from '../../src/chat/perfil';
import { PerfilSchema, evaluarTodosLosProgramas } from '../../src/rules-engine/index';

describe('PERFIL_VACIO', () => {
  it('es un Perfil válido con los 13 campos en "desconocido"', () => {
    expect(() => PerfilSchema.parse(PERFIL_VACIO)).not.toThrow();
    const valores = Object.values(PERFIL_VACIO);
    expect(valores).toHaveLength(13);
    expect(valores.every((v) => v === 'desconocido')).toBe(true);
  });

  it('con el perfil vacío los 4 programas piden datos', () => {
    const resultados = evaluarTodosLosProgramas(PERFIL_VACIO);
    expect(resultados.every((r) => r.estado === 'falta_dato')).toBe(true);
  });
});

describe('aplicarCambios', () => {
  it('aplica campos válidos y los lista en aceptados', () => {
    const r = aplicarCambios(PERFIL_VACIO, { tramoRSH: 40, region: 'Biobío', tienePropiedad: false });
    expect(r.perfil.tramoRSH).toBe(40);
    expect(r.perfil.region).toBe('Biobío');
    expect(r.perfil.tienePropiedad).toBe(false);
    expect(r.aceptados.sort()).toEqual(['region', 'tienePropiedad', 'tramoRSH']);
    expect(r.rechazados).toEqual([]);
  });

  it('rechaza solo el campo inválido y aplica los demás de la misma llamada', () => {
    const r = aplicarCambios(PERFIL_VACIO, { tramoRSH: 150, region: 'Valparaíso' });
    expect(r.perfil.region).toBe('Valparaíso');
    expect(r.perfil.tramoRSH).toBe('desconocido');
    expect(r.aceptados).toEqual(['region']);
    expect(r.rechazados).toHaveLength(1);
    expect(r.rechazados[0].campo).toBe('tramoRSH');
    expect(r.rechazados[0].error.length).toBeGreaterThan(0);
  });

  it('rechaza una región que no es una de las 16', () => {
    const r = aplicarCambios(PERFIL_VACIO, { region: 'Santiago' });
    expect(r.perfil.region).toBe('desconocido');
    expect(r.rechazados.map((x) => x.campo)).toEqual(['region']);
  });

  it('rechaza campos que no existen en el perfil', () => {
    const r = aplicarCambios(PERFIL_VACIO, { rut: '11.111.111-1' });
    expect(r.rechazados).toEqual([{ campo: 'rut', error: 'Campo desconocido.' }]);
    expect(r.perfil).toEqual(PERFIL_VACIO);
  });

  it('convierte ahorroCLP a ahorroUF', () => {
    const r = aplicarCambios(PERFIL_VACIO, { ahorroCLP: VALOR_UF.clp * 10 });
    expect(r.perfil.ahorroUF).toBe(10);
    expect(r.aceptados).toEqual(['ahorroUF']);
  });

  it('rechaza un ahorroCLP negativo', () => {
    const r = aplicarCambios(PERFIL_VACIO, { ahorroCLP: -5 });
    expect(r.perfil.ahorroUF).toBe('desconocido');
    expect(r.rechazados.map((x) => x.campo)).toEqual(['ahorroCLP']);
  });

  it('si llegan ahorroUF y ahorroCLP, gana ahorroUF', () => {
    const r = aplicarCambios(PERFIL_VACIO, { ahorroUF: 12, ahorroCLP: 1 });
    expect(r.perfil.ahorroUF).toBe(12);
    expect(r.aceptados).toEqual(['ahorroUF']);
  });

  it('deriva el ingreso en UF cuando llega en pesos', () => {
    const r = aplicarCambios(PERFIL_VACIO, { ingresoFamiliarMensualCLP: VALOR_UF.clp * 20 });
    expect(r.perfil.ingresoFamiliarMensualCLP).toBe(VALOR_UF.clp * 20);
    expect(r.perfil.ingresoFamiliarMensualUF).toBe(20);
  });

  it('deriva el ingreso en pesos cuando llega en UF', () => {
    const r = aplicarCambios(PERFIL_VACIO, { ingresoFamiliarMensualUF: 20 });
    expect(r.perfil.ingresoFamiliarMensualCLP).toBe(Math.round(VALOR_UF.clp * 20));
  });

  it('no muta el perfil de entrada', () => {
    const original = { ...PERFIL_VACIO };
    aplicarCambios(PERFIL_VACIO, { tramoRSH: 40 });
    expect(PERFIL_VACIO).toEqual(original);
  });
});
