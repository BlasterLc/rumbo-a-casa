import { describe, it, expect } from 'vitest';
import { evaluarDS49 } from '../../src/rules-engine/ds49';
import type { Perfil } from '../../src/rules-engine/perfil.schema';

const base: Perfil = {
  postulanteEdad: 30,
  region: 'Metropolitana',
  zonaEspecial: 'ninguna',
  tramoRSH: 35,
  tienePropiedad: false,
  ahorroUF: 12,
  antiguedadCuentaAhorroMeses: 12,
  ingresoFamiliarMensualUF: 20,
  ingresoFamiliarMensualCLP: 900000,
  integrantesGrupoFamiliar: [{ edad: 28, discapacidadCertificada: false }],
  excepcionPostulacionIndividualDS49: false,
  subsidioPrevio: 'ninguno',
  objetivo: 'comprar',
};

describe('evaluarDS49', () => {
  it('elegible cuando cumple RSH ≤40%, ahorro ≥10 UF, no propietario y tiene grupo familiar', () => {
    expect(evaluarDS49(base).estado).toBe('elegible');
  });

  it('no_elegible si el tramo RSH supera 40%', () => {
    const r = evaluarDS49({ ...base, tramoRSH: 45 });
    expect(r.estado).toBe('no_elegible');
    expect(r.motivo).toMatch(/RSH/);
  });

  it('no_elegible si ya es propietario', () => {
    expect(evaluarDS49({ ...base, tienePropiedad: true }).estado).toBe('no_elegible');
  });

  it('no_elegible si el ahorro es menor a 10 UF', () => {
    expect(evaluarDS49({ ...base, ahorroUF: 5 }).estado).toBe('no_elegible');
  });

  it('no_elegible si el postulante es menor de edad', () => {
    expect(evaluarDS49({ ...base, postulanteEdad: 17 }).estado).toBe('no_elegible');
  });

  it('no_elegible si postula solo sin excepción', () => {
    const r = evaluarDS49({ ...base, integrantesGrupoFamiliar: [], excepcionPostulacionIndividualDS49: false });
    expect(r.estado).toBe('no_elegible');
  });

  it('elegible si postula solo pero con excepción (adulto mayor, viudez, discapacidad, indígena o Informe Valech)', () => {
    const r = evaluarDS49({ ...base, integrantesGrupoFamiliar: [], excepcionPostulacionIndividualDS49: true });
    expect(r.estado).toBe('elegible');
  });

  it('falta_dato si no se conoce el tramo RSH', () => {
    const r = evaluarDS49({ ...base, tramoRSH: 'desconocido' });
    expect(r.estado).toBe('falta_dato');
    expect(r.camposFaltantes).toContain('tramoRSH');
  });

  it('cita el decreto D.S. N°49 de 2011', () => {
    expect(evaluarDS49(base).regla.decreto).toBe('D.S. N°49 (V. y U.) de 2011');
  });
});
