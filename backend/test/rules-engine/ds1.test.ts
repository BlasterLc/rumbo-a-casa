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

  it('elegible Tramo 1 con RSH exactamente en el borde 60% (Tramo 1/2)', () => {
    const r = evaluarDS1({ ...base, tramoRSH: 60 });
    expect(r.estado).toBe('elegible');
    expect(r.detalle?.tramo).toBe(1);
  });

  it('elegible Tramo 2 con RSH exactamente en el borde 80% (Tramo 2/3)', () => {
    const r = evaluarDS1({ ...base, tramoRSH: 80, ahorroUF: 45 });
    expect(r.estado).toBe('elegible');
    expect(r.detalle?.tramo).toBe(2);
  });

  it('adulto mayor con RSH exactamente en 90% igual accede a Tramo 1', () => {
    const r = evaluarDS1({ ...base, postulanteEdad: 60, tramoRSH: 90 });
    expect(r.estado).toBe('elegible');
    expect(r.detalle?.tramo).toBe(1);
  });

  it('elegible Tramo 1 con ahorro exactamente en el mínimo de 30 UF', () => {
    const r = evaluarDS1({ ...base, ahorroUF: 30, tramoRSH: 50 });
    expect(r.estado).toBe('elegible');
    expect(r.detalle?.tramo).toBe(1);
  });

  it('elegible Tramo 2 con ahorro exactamente en el mínimo de 40 UF', () => {
    const r = evaluarDS1({ ...base, ahorroUF: 40, tramoRSH: 70 });
    expect(r.estado).toBe('elegible');
    expect(r.detalle?.tramo).toBe(2);
  });

  it('elegible Tramo 3 con ahorro exactamente en el mínimo de 80 UF', () => {
    const r = evaluarDS1({ ...base, ahorroUF: 80, tramoRSH: 85 });
    expect(r.estado).toBe('elegible');
    expect(r.detalle?.tramo).toBe(3);
  });

  it('elegible con la cuenta de ahorro con exactamente 12 meses de antigüedad', () => {
    const r = evaluarDS1({ ...base, antiguedadCuentaAhorroMeses: 12 });
    expect(r.estado).toBe('elegible');
  });

  it('elegible Tramo 3 por tope de ingreso familiar exactamente en el límite de $3.386.546 para grupo de 2', () => {
    const r = evaluarDS1({
      ...base,
      tramoRSH: 95,
      ahorroUF: 85,
      integrantesGrupoFamiliar: [{ edad: 28, discapacidadCertificada: false }],
      ingresoFamiliarMensualCLP: 3_386_546,
    });
    expect(r.estado).toBe('elegible');
    expect(r.detalle?.tramo).toBe(3);
  });
  describe('motivo de no_elegible por ahorro o RSH', () => {
    it('dice que falta ahorro, con cuánto hay y cuánto pide el primer tramo, sin culpar al RSH', () => {
      const r = evaluarDS1({ ...base, tramoRSH: 40, ahorroUF: 12 });
      expect(r.estado).toBe('no_elegible');
      expect(r.motivo).toBe('No alcanzas el ahorro mínimo de DS1: tienes 12 UF y el primer tramo pide 30 UF.');
      expect(r.motivo).not.toMatch(/RSH/);
      expect(r.detalle).toEqual({ causa: 'ahorro', ahorroMinimoUF: 30, faltanteUF: 18 });
    });

    it('dice que el RSH supera el máximo del tramo que alcanza el ahorro', () => {
      const r = evaluarDS1({ ...base, tramoRSH: 85, ahorroUF: 45 });
      expect(r.estado).toBe('no_elegible');
      expect(r.motivo).toBe('Con 45 UF de ahorro te correspondería el Tramo 2 (RSH ≤80%), pero tu tramo RSH es 85%.');
      expect(r.detalle).toEqual({ causa: 'rsh', tramo: 2, rshMaximo: 80 });
    });

    it('en el Tramo 3 explica también el tope de ingreso familiar', () => {
      const r = evaluarDS1({ ...base, tramoRSH: 95, ahorroUF: 85, ingresoFamiliarMensualCLP: 5_000_000 });
      expect(r.estado).toBe('no_elegible');
      expect(r.motivo).toBe(
        'Con 85 UF de ahorro te correspondería el Tramo 3 (RSH ≤90%), pero tu tramo RSH es 95% y tu ingreso familiar supera el tope de $3.386.546 para 2 personas.',
      );
    });

    it('usa el máximo de RSH de 90% para adultos mayores en el mensaje', () => {
      const r = evaluarDS1({ ...base, postulanteEdad: 65, tramoRSH: 95, ahorroUF: 45 });
      expect(r.estado).toBe('no_elegible');
      expect(r.motivo).toBe('Con 45 UF de ahorro te correspondería el Tramo 2 (RSH ≤90%), pero tu tramo RSH es 95%.');
    });
  });
});
