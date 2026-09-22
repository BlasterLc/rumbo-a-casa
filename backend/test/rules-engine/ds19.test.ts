import { describe, it, expect } from 'vitest';
import { evaluarDS19 } from '../../src/rules-engine/ds19';
import type { Perfil } from '../../src/rules-engine/perfil.schema';

const base: Perfil = {
  postulanteEdad: 30,
  region: 'Metropolitana',
  zonaEspecial: 'ninguna',
  tramoRSH: 85,
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

describe('evaluarDS19', () => {
  it('Ruta A: elegible con subsidio previo DS49', () => {
    const r = evaluarDS19({ ...base, subsidioPrevio: 'DS49' });
    expect(r.estado).toBe('elegible');
    expect(r.detalle?.ruta).toBe('A');
  });

  it('Ruta A: elegible con subsidio previo DS1 Tramo 1', () => {
    const r = evaluarDS19({ ...base, subsidioPrevio: 'DS1_T1' });
    expect(r.estado).toBe('elegible');
    expect(r.detalle?.ruta).toBe('A');
  });

  it('Ruta A: elegible con subsidio de damnificado 2014+', () => {
    const r = evaluarDS19({ ...base, subsidioPrevio: 'damnificado_2014' });
    expect(r.estado).toBe('elegible');
    expect(r.detalle?.ruta).toBe('A');
  });

  it('Ruta B: elegible sin subsidio previo con RSH ≤90%', () => {
    const r = evaluarDS19({ ...base, subsidioPrevio: 'ninguno', tramoRSH: 85 });
    expect(r.estado).toBe('elegible');
    expect(r.detalle?.ruta).toBe('B');
  });

  it('no_elegible si ya es propietario', () => {
    expect(evaluarDS19({ ...base, tienePropiedad: true }).estado).toBe('no_elegible');
  });

  it('no_elegible sin subsidio previo y RSH sobre 90%', () => {
    const r = evaluarDS19({ ...base, subsidioPrevio: 'ninguno', tramoRSH: 95 });
    expect(r.estado).toBe('no_elegible');
  });

  it('falta_dato si no se conoce si tiene subsidio previo', () => {
    const r = evaluarDS19({ ...base, subsidioPrevio: 'desconocido' });
    expect(r.estado).toBe('falta_dato');
    expect(r.camposFaltantes).toContain('subsidioPrevio');
  });

  it('cita el decreto D.S. N°19 de 2016', () => {
    expect(evaluarDS19({ ...base, subsidioPrevio: 'DS49' }).regla.decreto).toBe(
      'D.S. N°19 (V. y U.) de 2016, mod. D.S. N°16 (V. y U.) de 2020',
    );
  });

  it('Ruta B: elegible con RSH exactamente en el borde de 90%', () => {
    const r = evaluarDS19({ ...base, subsidioPrevio: 'ninguno', tramoRSH: 90 });
    expect(r.estado).toBe('elegible');
    expect(r.detalle?.ruta).toBe('B');
  });
});
