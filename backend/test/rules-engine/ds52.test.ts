import { describe, it, expect } from 'vitest';
import { evaluarDS52 } from '../../src/rules-engine/ds52';
import type { Perfil } from '../../src/rules-engine/perfil.schema';

const base: Perfil = {
  postulanteEdad: 30,
  region: 'Metropolitana',
  zonaEspecial: 'ninguna',
  tramoRSH: 60,
  tienePropiedad: false,
  ahorroUF: 6,
  antiguedadCuentaAhorroMeses: 12,
  ingresoFamiliarMensualUF: 15,
  ingresoFamiliarMensualCLP: 900000,
  integrantesGrupoFamiliar: [{ edad: 28, discapacidadCertificada: false }],
  excepcionPostulacionIndividualDS49: false,
  subsidioPrevio: 'ninguno',
  objetivo: 'arrendar',
};

describe('evaluarDS52', () => {
  it('elegible con RSH ≤70%, ahorro ≥4 UF, ingreso dentro de rango y núcleo familiar', () => {
    expect(evaluarDS52(base).estado).toBe('elegible');
  });

  it('no_elegible si ya cuenta con vivienda propia', () => {
    expect(evaluarDS52({ ...base, tienePropiedad: true }).estado).toBe('no_elegible');
  });

  it('no_elegible si ya tiene un subsidio habitacional previo', () => {
    expect(evaluarDS52({ ...base, subsidioPrevio: 'DS49' }).estado).toBe('no_elegible');
  });

  it('no_elegible si el postulante es menor de edad', () => {
    expect(evaluarDS52({ ...base, postulanteEdad: 17 }).estado).toBe('no_elegible');
  });

  it('no_elegible si postula solo y no es adulto mayor', () => {
    expect(evaluarDS52({ ...base, integrantesGrupoFamiliar: [] }).estado).toBe('no_elegible');
  });

  it('elegible si postula solo pero es adulto mayor (60+)', () => {
    const r = evaluarDS52({ ...base, postulanteEdad: 65, integrantesGrupoFamiliar: [] });
    expect(r.estado).toBe('elegible');
  });

  it('no_elegible si el tramo RSH supera 70%', () => {
    expect(evaluarDS52({ ...base, tramoRSH: 75 }).estado).toBe('no_elegible');
  });

  it('no_elegible si el ahorro es menor a 4 UF', () => {
    expect(evaluarDS52({ ...base, ahorroUF: 2 }).estado).toBe('no_elegible');
  });

  it('no_elegible si el ingreso familiar es menor a 7 UF', () => {
    expect(evaluarDS52({ ...base, ingresoFamiliarMensualUF: 5 }).estado).toBe('no_elegible');
  });

  it('no_elegible si el ingreso familiar supera el tope de 25 UF para un grupo de 2', () => {
    expect(evaluarDS52({ ...base, ingresoFamiliarMensualUF: 30 }).estado).toBe('no_elegible');
  });

  it('elegible con ingreso alto si el grupo familiar es grande (tope sube 8 UF desde el 4° integrante)', () => {
    const familiaGrande = {
      ...base,
      integrantesGrupoFamiliar: [
        { edad: 28, discapacidadCertificada: false },
        { edad: 10, discapacidadCertificada: false },
        { edad: 8, discapacidadCertificada: false },
      ], // tamaño de grupo = 4 (incluye postulante), tope = 25 + 8 = 33 UF
      ingresoFamiliarMensualUF: 30,
    };
    expect(evaluarDS52(familiaGrande).estado).toBe('elegible');
  });

  it('falta_dato si no se conoce el ahorro', () => {
    const r = evaluarDS52({ ...base, ahorroUF: 'desconocido' });
    expect(r.estado).toBe('falta_dato');
    expect(r.camposFaltantes).toContain('ahorroUF');
  });

  it('cita el decreto D.S. N°52 de 2013', () => {
    expect(evaluarDS52(base).regla.decreto).toBe('D.S. N°52 de 2013, Res. Ex. N°809/2026 (Región Metropolitana)');
  });
});
