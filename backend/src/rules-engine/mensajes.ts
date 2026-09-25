import type { Idioma } from './tipos';

export interface TopeIngreso {
  topeCLP: number;
  personas: number;
}

// Una sola interfaz para los dos idiomas: si falta una clave en uno de ellos, no compila.
export interface Mensajes {
  faltanDatos: (programa: string) => string;
  yaPropietario: string;
  yaPropietarioOSitio: string;
  menorDeEdad: string;
  ds49: {
    rshMaximo: string;
    ahorroMinimo: string;
    postulacionIndividual: string;
    cumple: string;
  };
  ds1: {
    antiguedadCuenta: string;
    califica: (tramo: number, ahorroMinimoUF: number, rshMaximo: number) => string;
    sinAhorro: (hayUF: number, minimoUF: number) => string;
    rshExcede: (
      ahorroUF: number,
      tramo: number,
      rshMaximo: number,
      rsh: number,
      ingreso?: TopeIngreso,
    ) => string;
  };
  ds19: {
    rutaA: string;
    rutaB: string;
    sinHabilitacion: string;
  };
  ds52: {
    subsidioPrevio: string;
    sinNucleo: string;
    rshMaximo: string;
    ahorroMinimo: string;
    ingresoFueraDeRango: (minimoUF: number, maximoUF: number, personas: number) => string;
    cumple: string;
    notaFueraDeRM: string;
  };
}

const conSeparador = (n: number, separador: string) =>
  n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, separador);

const es: Mensajes = {
  faltanDatos: (programa) => `Me faltan datos para ver si calificas a ${programa}.`,
  yaPropietario: 'Ya tienes una vivienda propia, y este programa es para quienes aún no la tienen.',
  yaPropietarioOSitio:
    'Ya tienes una vivienda propia o un sitio con destino habitacional, y este programa es para quienes aún no los tienen.',
  menorDeEdad: 'Para postular tienes que tener 18 años o más.',
  ds49: {
    rshMaximo: 'Tu tramo del Registro Social de Hogares (RSH) debe ser 40% o menos.',
    ahorroMinimo: 'Necesitas un ahorro mínimo de 10 UF.',
    postulacionIndividual:
      'Para postular solo o sola necesitas una excepción: ser adulto mayor, viudo o viuda, tener una discapacidad certificada, ser indígena reconocido o estar en el Informe Valech.',
    cumple:
      'Cumples los requisitos de DS49: RSH ≤40%, ahorro ≥10 UF, sin vivienda propia y con grupo familiar acreditado (o con excepción de postulación individual).',
  },
  ds1: {
    antiguedadCuenta: 'Tu cuenta de ahorro debe tener al menos 12 meses de antigüedad.',
    califica: (tramo, ahorroMinimoUF, rshMaximo) =>
      `Calificas al Tramo ${tramo} de DS1 (ahorro ≥${ahorroMinimoUF} UF, RSH ≤${rshMaximo}%).`,
    sinAhorro: (hayUF, minimoUF) =>
      `No alcanzas el ahorro mínimo de DS1: tienes ${hayUF} UF y el primer tramo pide ${minimoUF} UF.`,
    rshExcede: (ahorroUF, tramo, rshMaximo, rsh, ingreso) => {
      const base = `Con ${ahorroUF} UF de ahorro te correspondería el Tramo ${tramo} (RSH ≤${rshMaximo}%), pero tu tramo RSH es ${rsh}%`;
      return ingreso
        ? `${base} y el ingreso familiar supera el tope de $${conSeparador(ingreso.topeCLP, '.')} para ${ingreso.personas} personas.`
        : `${base}.`;
    },
  },
  ds19: {
    rutaA:
      'Ruta A: ya tienes un subsidio previo (DS49, DS1 Tramo 1 o damnificado desde 2014), así que puedes acceder a una vivienda de 1.200-1.400 UF pagada en su totalidad, sin crédito hipotecario.',
    rutaB:
      'Ruta B: no tienes subsidio previo, tu RSH es ≤90% y no eres propietario. El ahorro mínimo depende del proyecto al que postules.',
    sinHabilitacion:
      'No tienes un subsidio previo que te habilite (Ruta A) y tu tramo RSH supera el 90% que exige la Ruta B.',
  },
  ds52: {
    subsidioPrevio: 'Ya recibiste un subsidio habitacional antes.',
    sinNucleo:
      'Debes postular al menos con cónyuge, conviviente civil, conviviente o hijo, salvo que tengas 60 años o más.',
    rshMaximo: 'Tu tramo del Registro Social de Hogares (RSH) debe ser 70% o menos.',
    ahorroMinimo: 'Necesitas un ahorro mínimo de 4 UF.',
    ingresoFueraDeRango: (minimoUF, maximoUF, personas) =>
      `Tu ingreso familiar mensual debe estar entre ${minimoUF} y ${maximoUF} UF para un grupo de ${personas} personas.`,
    cumple:
      'Cumples los requisitos de DS52: RSH ≤70%, ahorro ≥4 UF, ingreso dentro del rango, sin vivienda propia ni subsidio previo.',
    notaFueraDeRM:
      'Los requisitos de ingreso y los montos corresponden al llamado de la Región Metropolitana; pueden variar según tu región o comuna, verifica en minvu.gob.cl.',
  },
};

const en: Mensajes = {
  faltanDatos: (programa) => `I need more information to check whether you qualify for ${programa}.`,
  yaPropietario: 'You already own a home, and this program is for people who do not own one yet.',
  yaPropietarioOSitio:
    'You already own a home or a plot zoned for housing, and this program is for people who do not own either yet.',
  menorDeEdad: 'You must be 18 or older to apply.',
  ds49: {
    rshMaximo: 'Your Registro Social de Hogares (RSH) bracket must be 40% or lower.',
    ahorroMinimo: 'You need at least 10 UF in savings.',
    postulacionIndividual:
      'To apply on your own you need an exception: being an older adult, being widowed, having a certified disability, being a recognized Indigenous person, or being on the Valech Report.',
    cumple:
      'You meet the DS49 requirements: RSH 40% or lower, savings of at least 10 UF, no home of your own, and a registered household (or an exception to apply on your own).',
  },
  ds1: {
    antiguedadCuenta: 'Your savings account must be at least 12 months old.',
    califica: (tramo, ahorroMinimoUF, rshMaximo) =>
      `You qualify for DS1 Tier ${tramo} (savings of at least ${ahorroMinimoUF} UF, RSH ${rshMaximo}% or lower).`,
    sinAhorro: (hayUF, minimoUF) =>
      `You do not reach the DS1 minimum savings: you have ${hayUF} UF and the first tier asks for ${minimoUF} UF.`,
    rshExcede: (ahorroUF, tramo, rshMaximo, rsh, ingreso) => {
      const base = `With ${ahorroUF} UF in savings you would fall under Tier ${tramo} (RSH ${rshMaximo}% or lower), but your RSH bracket is ${rsh}%`;
      return ingreso
        ? `${base} and your household income is above the limit of $${conSeparador(ingreso.topeCLP, ',')} for ${ingreso.personas} people.`
        : `${base}.`;
    },
  },
  ds19: {
    rutaA:
      'Route A: you already have a previous subsidy (DS49, DS1 Tier 1 or a disaster-victim subsidy since 2014), so you can get a home of 1,200-1,400 UF paid in full, without a mortgage.',
    rutaB:
      'Route B: you have no previous subsidy, your RSH is 90% or lower and you do not own a home. The minimum savings depend on the project you apply to.',
    sinHabilitacion:
      'You have no previous subsidy that qualifies you (Route A), and your RSH bracket is above the 90% that Route B requires.',
  },
  ds52: {
    subsidioPrevio: 'You have already received a housing subsidy before.',
    sinNucleo:
      'You must apply with at least a spouse, civil partner, partner or child, unless you are 60 or older.',
    rshMaximo: 'Your Registro Social de Hogares (RSH) bracket must be 70% or lower.',
    ahorroMinimo: 'You need at least 4 UF in savings.',
    ingresoFueraDeRango: (minimoUF, maximoUF, personas) =>
      `Your monthly household income must be between ${minimoUF} and ${maximoUF} UF for a household of ${personas} people.`,
    cumple:
      'You meet the DS52 requirements: RSH 70% or lower, savings of at least 4 UF, income within the range, and no home of your own or previous subsidy.',
    notaFueraDeRM:
      'The income requirements and amounts are those of the Metropolitan Region call; they may vary by your region or commune, check at minvu.gob.cl.',
  },
};

export const MENSAJES: Record<Idioma, Mensajes> = { es, en };
