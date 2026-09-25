import { describe, it, expect } from 'vitest';
import { evaluarDS49 } from '../../src/rules-engine/ds49';
import { evaluarDS19 } from '../../src/rules-engine/ds19';
import type { Perfil } from '../../src/rules-engine/perfil.schema';

const base: Perfil = {
  postulanteEdad: 30,
  region: 'Metropolitana',
  zonaEspecial: 'ninguna',
  tramoRSH: 35,
  tienePropiedad: false,
  ahorroUF: 30,
  antiguedadCuentaAhorroMeses: 12,
  ingresoFamiliarMensualUF: 15,
  ingresoFamiliarMensualCLP: 900000,
  integrantesGrupoFamiliar: [{ edad: 28, discapacidadCertificada: false }],
  excepcionPostulacionIndividualDS49: false,
  subsidioPrevio: 'ninguno',
  objetivo: 'comprar',
};

describe('motivos de DS49', () => {
  const casos: [string, Perfil, string, string][] = [
    [
      'ya es propietario',
      { ...base, tienePropiedad: true },
      'Ya tienes una vivienda propia, y este programa es para quienes aún no la tienen.',
      'You already own a home, and this program is for people who do not own one yet.',
    ],
    [
      'menor de edad',
      { ...base, postulanteEdad: 17 },
      'Para postular tienes que tener 18 años o más.',
      'You must be 18 or older to apply.',
    ],
    [
      'RSH sobre 40%',
      { ...base, tramoRSH: 50 },
      'Tu tramo del Registro Social de Hogares (RSH) debe ser 40% o menos.',
      'Your Registro Social de Hogares (RSH) bracket must be 40% or lower.',
    ],
    [
      'ahorro bajo 10 UF',
      { ...base, ahorroUF: 5 },
      'Necesitas un ahorro mínimo de 10 UF.',
      'You need at least 10 UF in savings.',
    ],
    [
      'postula sola sin excepción',
      { ...base, integrantesGrupoFamiliar: [] },
      'Para postular solo o sola necesitas una excepción: ser adulto mayor, viudo o viuda, tener una discapacidad certificada, ser indígena reconocido o estar en el Informe Valech.',
      'To apply on your own you need an exception: being an older adult, being widowed, having a certified disability, being a recognized Indigenous person, or being on the Valech Report.',
    ],
    [
      'cumple',
      base,
      'Cumples los requisitos de DS49: RSH ≤40%, ahorro ≥10 UF, sin vivienda propia y con grupo familiar acreditado (o con excepción de postulación individual).',
      'You meet the DS49 requirements: RSH 40% or lower, savings of at least 10 UF, no home of your own, and a registered household (or an exception to apply on your own).',
    ],
    [
      'faltan datos',
      { ...base, tramoRSH: 'desconocido' },
      'Me faltan datos para ver si calificas a DS49.',
      'I need more information to check whether you qualify for DS49.',
    ],
  ];

  it.each(casos)('%s', (_nombre, perfil, esperadoEs, esperadoEn) => {
    expect(evaluarDS49(perfil).motivo).toBe(esperadoEs);
    expect(evaluarDS49(perfil, 'es').motivo).toBe(esperadoEs);
    expect(evaluarDS49(perfil, 'en').motivo).toBe(esperadoEn);
  });

  it('el idioma no cambia el estado ni la regla citada', () => {
    const es = evaluarDS49(base, 'es');
    const en = evaluarDS49(base, 'en');
    expect(en.estado).toBe(es.estado);
    expect(en.regla).toEqual(es.regla);
  });
});

describe('motivos de DS19', () => {
  const casos: [string, Perfil, string, string][] = [
    [
      'ya es propietario',
      { ...base, tienePropiedad: true },
      'Ya tienes una vivienda propia, y este programa es para quienes aún no la tienen.',
      'You already own a home, and this program is for people who do not own one yet.',
    ],
    [
      'ruta A',
      { ...base, subsidioPrevio: 'DS49' },
      'Ruta A: ya tienes un subsidio previo (DS49, DS1 Tramo 1 o damnificado desde 2014), así que puedes acceder a una vivienda de 1.200-1.400 UF pagada en su totalidad, sin crédito hipotecario.',
      'Route A: you already have a previous subsidy (DS49, DS1 Tier 1 or a disaster-victim subsidy since 2014), so you can get a home of 1,200-1,400 UF paid in full, without a mortgage.',
    ],
    [
      'ruta B',
      base,
      'Ruta B: no tienes subsidio previo, tu RSH es ≤90% y no eres propietario. El ahorro mínimo depende del proyecto al que postules.',
      'Route B: you have no previous subsidy, your RSH is 90% or lower and you do not own a home. The minimum savings depend on the project you apply to.',
    ],
    [
      'sin habilitación',
      { ...base, tramoRSH: 95 },
      'No tienes un subsidio previo que te habilite (Ruta A) y tu tramo RSH supera el 90% que exige la Ruta B.',
      'You have no previous subsidy that qualifies you (Route A), and your RSH bracket is above the 90% that Route B requires.',
    ],
    [
      'faltan datos',
      { ...base, subsidioPrevio: 'desconocido' },
      'Me faltan datos para ver si calificas a DS19.',
      'I need more information to check whether you qualify for DS19.',
    ],
  ];

  it.each(casos)('%s', (_nombre, perfil, esperadoEs, esperadoEn) => {
    expect(evaluarDS19(perfil).motivo).toBe(esperadoEs);
    expect(evaluarDS19(perfil, 'es').motivo).toBe(esperadoEs);
    expect(evaluarDS19(perfil, 'en').motivo).toBe(esperadoEn);
  });

  it('el idioma no cambia el estado ni el detalle de la ruta', () => {
    const perfil = { ...base, subsidioPrevio: 'DS49' } as Perfil;
    expect(evaluarDS19(perfil, 'en').detalle).toEqual({ ruta: 'A' });
    expect(evaluarDS19(perfil, 'en').estado).toBe(evaluarDS19(perfil, 'es').estado);
  });
});
