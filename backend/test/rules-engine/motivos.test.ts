import { describe, it, expect } from 'vitest';
import { evaluarDS49 } from '../../src/rules-engine/ds49';
import { evaluarDS19 } from '../../src/rules-engine/ds19';
import { evaluarDS1 } from '../../src/rules-engine/ds1';
import { evaluarDS52 } from '../../src/rules-engine/ds52';
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
      'Ruta B: no tienes subsidio previo, tu RSH es ≤90% y no tienes vivienda propia. El ahorro mínimo depende del proyecto al que postules.',
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

describe('motivos de DS1', () => {
  const casos: [string, Perfil, string, string][] = [
    [
      'ya es propietario',
      { ...base, tienePropiedad: true },
      'Ya tienes una vivienda propia o un sitio con destino habitacional, y este programa es para quienes aún no los tienen.',
      'You already own a home or a plot zoned for housing, and this program is for people who do not own either yet.',
    ],
    [
      'menor de edad',
      { ...base, postulanteEdad: 17 },
      'Para postular tienes que tener 18 años o más.',
      'You must be 18 or older to apply.',
    ],
    [
      'cuenta de ahorro reciente',
      { ...base, antiguedadCuentaAhorroMeses: 6 },
      'Tu cuenta de ahorro debe tener al menos 12 meses de antigüedad.',
      'Your savings account must be at least 12 months old.',
    ],
    [
      'califica al Tramo 1',
      { ...base, tramoRSH: 50, ahorroUF: 35 },
      'Calificas al Tramo 1 de DS1 (ahorro ≥30 UF, RSH ≤60%).',
      'You qualify for DS1 Tier 1 (savings of at least 30 UF, RSH 60% or lower).',
    ],
    [
      'no alcanza el ahorro',
      { ...base, tramoRSH: 40, ahorroUF: 12 },
      'No alcanzas el ahorro mínimo de DS1: tienes 12 UF y el primer tramo pide 30 UF.',
      'You do not reach the DS1 minimum savings: you have 12 UF and the first tier asks for 30 UF.',
    ],
    [
      'el RSH excede el tramo que alcanza el ahorro',
      { ...base, tramoRSH: 85, ahorroUF: 45 },
      'Con 45 UF de ahorro te correspondería el Tramo 2 (RSH ≤80%), pero tu tramo RSH es 85%.',
      'With 45 UF in savings you would fall under Tier 2 (RSH 80% or lower), but your RSH bracket is 85%.',
    ],
    [
      'Tramo 3: RSH e ingreso exceden',
      { ...base, tramoRSH: 95, ahorroUF: 85, ingresoFamiliarMensualCLP: 5_000_000 },
      'Con 85 UF de ahorro te correspondería el Tramo 3 (RSH ≤90%), pero tu tramo RSH es 95% y tu ingreso familiar supera el tope de $3.386.546 para 2 personas.',
      'With 85 UF in savings you would fall under Tier 3 (RSH 90% or lower), but your RSH bracket is 95% and your household income is above the limit of CLP 3,386,546 for 2 people.',
    ],
    [
      'adulto mayor: el tope de RSH del mensaje es 90%',
      { ...base, postulanteEdad: 65, tramoRSH: 95, ahorroUF: 45 },
      'Con 45 UF de ahorro te correspondería el Tramo 2 (RSH ≤90%), pero tu tramo RSH es 95%.',
      'With 45 UF in savings you would fall under Tier 2 (RSH 90% or lower), but your RSH bracket is 95%.',
    ],
    [
      'faltan datos',
      { ...base, ahorroUF: 'desconocido' },
      'Me faltan datos para ver si calificas a DS1.',
      'I need more information to check whether you qualify for DS1.',
    ],
    [
      'faltan datos del Tramo 3',
      { ...base, tramoRSH: 95, ahorroUF: 85, ingresoFamiliarMensualCLP: 'desconocido' },
      'Me faltan datos para ver si calificas a DS1.',
      'I need more information to check whether you qualify for DS1.',
    ],
  ];

  it.each(casos)('%s', (_nombre, perfil, esperadoEs, esperadoEn) => {
    expect(evaluarDS1(perfil).motivo).toBe(esperadoEs);
    expect(evaluarDS1(perfil, 'es').motivo).toBe(esperadoEs);
    expect(evaluarDS1(perfil, 'en').motivo).toBe(esperadoEn);
  });

  it('el idioma no cambia el estado ni el detalle estructurado', () => {
    const perfil = { ...base, tramoRSH: 40, ahorroUF: 12 } as Perfil;
    expect(evaluarDS1(perfil, 'en').detalle).toEqual({ causa: 'ahorro', ahorroMinimoUF: 30, faltanteUF: 18 });
    expect(evaluarDS1(perfil, 'en').estado).toBe('no_elegible');
  });
});

describe('motivos de DS52', () => {
  const casos: [string, Perfil, string, string][] = [
    [
      'ya es propietario',
      { ...base, tienePropiedad: true },
      'Ya tienes una vivienda propia, y este programa es para quienes aún no la tienen.',
      'You already own a home, and this program is for people who do not own one yet.',
    ],
    [
      'subsidio previo',
      { ...base, subsidioPrevio: 'DS49' },
      'Ya recibiste un subsidio habitacional antes.',
      'You have already received a housing subsidy.',
    ],
    [
      'menor de edad',
      { ...base, postulanteEdad: 17 },
      'Para postular tienes que tener 18 años o más.',
      'You must be 18 or older to apply.',
    ],
    [
      'sin cónyuge, conviviente ni hijo',
      { ...base, integrantesGrupoFamiliar: [] },
      'Debes postular al menos con cónyuge, conviviente civil, conviviente o hijo, salvo que tengas 60 años o más.',
      'You must apply with at least a spouse, civil partner, partner or child, unless you are 60 or older.',
    ],
    [
      'RSH sobre 70%',
      { ...base, tramoRSH: 80 },
      'Tu tramo del Registro Social de Hogares (RSH) debe ser 70% o menos.',
      'Your Registro Social de Hogares (RSH) bracket must be 70% or lower.',
    ],
    [
      'ahorro bajo 4 UF',
      { ...base, ahorroUF: 2 },
      'Necesitas un ahorro mínimo de 4 UF.',
      'You need at least 4 UF in savings.',
    ],
    [
      'ingreso fuera de rango',
      { ...base, ingresoFamiliarMensualUF: 80 },
      'Tu ingreso familiar mensual debe estar entre 7 y 25 UF para un grupo de 2 personas.',
      'Your monthly household income must be between 7 and 25 UF for a household of 2 people.',
    ],
    [
      'cumple',
      base,
      'Cumples los requisitos de DS52: RSH ≤70%, ahorro ≥4 UF, ingreso dentro del rango, sin vivienda propia ni subsidio previo.',
      'You meet the DS52 requirements: RSH 70% or lower, savings of at least 4 UF, income within the range, and no home of your own or previous subsidy.',
    ],
    [
      'faltan datos',
      { ...base, ingresoFamiliarMensualUF: 'desconocido' },
      'Me faltan datos para ver si calificas a DS52.',
      'I need more information to check whether you qualify for DS52.',
    ],
  ];

  it.each(casos)('%s', (_nombre, perfil, esperadoEs, esperadoEn) => {
    expect(evaluarDS52(perfil).motivo).toBe(esperadoEs);
    expect(evaluarDS52(perfil, 'es').motivo).toBe(esperadoEs);
    expect(evaluarDS52(perfil, 'en').motivo).toBe(esperadoEn);
  });

  it('fuera de la Región Metropolitana la nota sale en el idioma pedido', () => {
    const perfil = { ...base, region: 'Valparaíso' } as Perfil;
    expect(evaluarDS52(perfil, 'es').detalle?.nota).toBe(
      'Los requisitos de ingreso y los montos corresponden al llamado de la Región Metropolitana; pueden variar según tu región o comuna, verifica en minvu.gob.cl.',
    );
    expect(evaluarDS52(perfil, 'en').detalle?.nota).toBe(
      'The income requirements and amounts are those of the Metropolitan Region call; they may vary by your region or commune, check at minvu.gob.cl.',
    );
  });

  it('en la Región Metropolitana no hay nota en ningún idioma', () => {
    expect(evaluarDS52(base, 'en').detalle).toBeUndefined();
    expect(evaluarDS52(base, 'es').detalle).toBeUndefined();
  });
});
