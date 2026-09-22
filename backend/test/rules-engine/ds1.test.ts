import { describe, it, expect } from 'vitest';
import { evaluarDS1 } from '../../src/rules-engine/ds1';
import type { Perfil } from '../../src/rules-engine/perfil.schema';

const base: Perfil = {
  postulanteEdad: 30,
  region: 'Metropolitana',
  zonaEspecial: 'ninguna',
  tramoRSH: 50,
  tienePropiedad: false,
  ahorroUF: 35,
  antiguedadCuentaAhorroMeses: 14,
  ingresoFamiliarMensualUF: 20,
  ingresoFamiliarMensualCLP: 900000,
  integrantesGrupoFamiliar: [{ edad: 28, discapacidadCertificada: false }],
  excepcionPostulacionIndividualDS49: false,
  subsidioPrevio: 'ninguno',
  objetivo: 'comprar',
};

describe('evaluarDS1', () => {
  it('elegible Tramo 1 con RSH 50% y ahorro 35 UF', () => {
    const r = evaluarDS1(base);
    expect(r.estado).toBe('elegible');
    expect(r.detalle?.tramo).toBe(1);
  });

  it('elegible Tramo 2 cuando el RSH supera el 60% del Tramo 1', () => {
    const r = evaluarDS1({ ...base, tramoRSH: 75, ahorroUF: 45 });
    expect(r.estado).toBe('elegible');
    expect(r.detalle?.tramo).toBe(2);
  });

  it('elegible Tramo 3 por RSH ≤90% con ahorro de 80 UF', () => {
    const r = evaluarDS1({ ...base, tramoRSH: 88, ahorroUF: 85 });
    expect(r.estado).toBe('elegible');
    expect(r.detalle?.tramo).toBe(3);
  });

  it('elegible Tramo 3 por tope de ingreso familiar aunque el RSH supere 90%', () => {
    const r = evaluarDS1({
      ...base,
      tramoRSH: 95,
      ahorroUF: 85,
      integrantesGrupoFamiliar: [{ edad: 28, discapacidadCertificada: false }],
      ingresoFamiliarMensualCLP: 3_000_000, // bajo el tope de 2 integrantes ($3.386.546)
    });
    expect(r.estado).toBe('elegible');
    expect(r.detalle?.tramo).toBe(3);
  });

  it('adulto mayor (60+) accede a Tramo 1 con RSH hasta 90%', () => {
    const r = evaluarDS1({ ...base, postulanteEdad: 65, tramoRSH: 85, ahorroUF: 30 });
    expect(r.estado).toBe('elegible');
    expect(r.detalle?.tramo).toBe(1);
  });

  it('no_elegible si ya es propietario', () => {
    expect(evaluarDS1({ ...base, tienePropiedad: true }).estado).toBe('no_elegible');
  });

  it('no_elegible si la cuenta de ahorro tiene menos de 12 meses', () => {
    expect(evaluarDS1({ ...base, antiguedadCuentaAhorroMeses: 6 }).estado).toBe('no_elegible');
  });

  it('no_elegible si no alcanza el ahorro mínimo de ningún tramo', () => {
    expect(evaluarDS1({ ...base, ahorroUF: 10 }).estado).toBe('no_elegible');
  });

  it('falta_dato si no se conoce el tramo RSH', () => {
    const r = evaluarDS1({ ...base, tramoRSH: 'desconocido' });
    expect(r.estado).toBe('falta_dato');
    expect(r.camposFaltantes).toContain('tramoRSH');
  });

  it('cita el decreto D.S. N°1 de 2011', () => {
    expect(evaluarDS1(base).regla.decreto).toBe('D.S. N°1 de 2011, Res. Ex. N°669/2026');
  });

  it('falta_dato si ingresoFamiliarMensualCLP es desconocido y RSH excede pero ahorro califica para Tramo 3', () => {
    const r = evaluarDS1({
      ...base,
      tramoRSH: 95,
      ahorroUF: 85,
      ingresoFamiliarMensualCLP: 'desconocido',
    });
    expect(r.estado).toBe('falta_dato');
    expect(r.camposFaltantes).toContain('ingresoFamiliarMensualCLP');
  });

  it('falta_dato si integrantesGrupoFamiliar es desconocido y RSH excede pero ahorro califica para Tramo 3', () => {
    const r = evaluarDS1({
      ...base,
      tramoRSH: 95,
      ahorroUF: 85,
      integrantesGrupoFamiliar: 'desconocido',
    });
    expect(r.estado).toBe('falta_dato');
    expect(r.camposFaltantes).toContain('integrantesGrupoFamiliar');
  });
});
