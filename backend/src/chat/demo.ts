import {
  IDIOMA_POR_DEFECTO,
  evaluarTodosLosProgramas,
  type Idioma,
  type Perfil,
  type ResultadoPrograma,
} from '../rules-engine/index';
import { PERFIL_VACIO, aplicarCambios } from './perfil';
import { generarPlanPapeles, type PlanPrograma } from './papeles';

export interface PasoDemo {
  usuario: string;
  respuesta: string;
  perfil: Perfil;
  resultados: ResultadoPrograma[];
  plan: PlanPrograma[];
}

export interface Demo {
  modo: 'demo';
  familia: { descripcion: string };
  pasos: PasoDemo[];
}

// Conversación de ejemplo con una familia ficticia. El texto del asistente y los datos que
// se van "aprendiendo" son fijos; las decisiones de elegibilidad y el plan de papeles los
// calcula el motor de reglas real en cada paso, igual que en /api/chat. Los datos (`CAMBIOS`)
// son iguales en todos los idiomas: solo cambian los textos.
const CAMBIOS: Record<string, unknown>[] = [
  { region: 'Metropolitana', zonaEspecial: 'ninguna', objetivo: 'comprar' },
  {
    postulanteEdad: 34,
    integrantesGrupoFamiliar: [
      { edad: 33, discapacidadCertificada: false },
      { edad: 8, discapacidadCertificada: false },
      { edad: 5, discapacidadCertificada: false },
    ],
    excepcionPostulacionIndividualDS49: false,
  },
  { tramoRSH: 40, tienePropiedad: false, subsidioPrevio: 'ninguno' },
  { ahorroUF: 12, antiguedadCuentaAhorroMeses: 18, ingresoFamiliarMensualUF: 22 },
];

const TEXTOS: Record<Idioma, { descripcion: string; pasos: { usuario: string; respuesta: string }[] }> = {
  es: {
    descripcion:
      'Familia ficticia de 4 personas en la Región Metropolitana (RSH 40%, sin vivienda ni subsidio previo, 12 UF de ahorro), inventada para esta demostración. No corresponde a ninguna persona real.',
    pasos: [
      {
        usuario: 'Hola, somos una familia de 4 en Santiago y queremos comprar nuestra primera vivienda.',
        respuesta:
          '¡Hola! Te ayudo a ver qué subsidios podrían servirte. Ya anoté que vives en la Región Metropolitana y que quieres comprar. ¿Qué edad tienes y quiénes forman tu grupo familiar?',
      },
      {
        usuario:
          'Tengo 34 años y vivo con mi pareja, de 33, y nuestros hijos de 8 y 5. Nadie tiene discapacidad certificada.',
        respuesta:
          'Gracias. Son 4 personas en tu grupo familiar. Ahora necesito saber cómo estás en el Registro Social de Hogares, el RSH. ¿En qué tramo estás, y tienes vivienda propia o has recibido algún subsidio antes?',
      },
      {
        usuario:
          'Estamos en el tramo 40% del Registro Social de Hogares. No tenemos casa propia ni hemos tenido subsidio.',
        respuesta:
          'Perfecto. Con eso ya puedo mirar algunos programas, pero me faltan datos de ahorro e ingresos para decidir todos. ¿Cuánto tienes ahorrado en la cuenta de ahorro para la vivienda, hace cuánto la abriste y cuál es el ingreso mensual de tu familia?',
      },
      {
        usuario:
          'Tenemos 12 UF en la cuenta de ahorro, abierta hace 18 meses, y el ingreso de la familia es de unas 22 UF al mes.',
        respuesta:
          'Con lo que me contaste, esto es lo que veo:\n\n**Calificas a DS49**, el camino más directo para comprar: estás en el tramo 40% del RSH, no tienes vivienda y tienes 12 UF de ahorro (el mínimo es 10).\n**Calificas a DS19** por la ruta sin subsidio previo. El ahorro mínimo depende del proyecto al que postules.\n**Calificas a DS52**, el subsidio de arriendo, como alternativa mientras ahorras.\n**No calificas a DS1**: con 12 UF no alcanzas los 30 UF de ahorro que pide el primer tramo, te faltan 18 UF.\n\nAbajo tienes el detalle de cada programa, con el decreto en que se basa, y los papeles que te conviene ir juntando. Esto lo confirma el Serviu cuando postules.',
      },
    ],
  },
  en: {
    descripcion:
      'Made-up family of 4 in the Metropolitan Region (RSH 40%, no home or previous subsidy, 12 UF saved), invented for this demonstration. It is not any real person.',
    pasos: [
      {
        usuario: "Hi, we're a family of 4 in Santiago and we want to buy our first home.",
        respuesta:
          "Hi! I'll help you see which subsidies could work for you. I noted that you live in the Metropolitan Region and want to buy. How old are you and who is in your household?",
      },
      {
        usuario:
          "I'm 34 and I live with my partner, who is 33, and our kids, 8 and 5. Nobody has a certified disability.",
        respuesta:
          'Thanks. That\'s 4 people in your household. Now I need to know where you stand in the Registro Social de Hogares, the RSH. Which bracket are you in, and do you own a home or have you received a subsidy before?',
      },
      {
        usuario:
          "We're in the 40% bracket of the Registro Social de Hogares. We don't own a home and we've never had a subsidy.",
        respuesta:
          "Perfect. That lets me look at some programs, but I still need your savings and income to decide on all of them. How much do you have in your housing savings account, how long ago did you open it, and what is your family's monthly income?",
      },
      {
        usuario:
          "We have 12 UF in the savings account, opened 18 months ago, and the family's income is about 22 UF a month.",
        respuesta:
          "Here is what I see:\n\n**You qualify for DS49**, the most direct route to buy: you're in the 40% RSH bracket, you don't own a home and you have 12 UF saved (the minimum is 10).\n**You qualify for DS19** through the route without a previous subsidy. The minimum savings depend on the project you apply to.\n**You qualify for DS52**, the rental subsidy, as an alternative while you save.\n**You don't qualify for DS1**: with 12 UF you don't reach the 30 UF of savings the first bracket requires, you are 18 UF short.\n\nBelow you have the detail of each program, with the decree it is based on, and the papers worth gathering. Serviu confirms this when you apply.",
      },
    ],
  },
};

const RANGO_ESTADO = { elegible: 0, falta_dato: 1, no_elegible: 2 } as const;

/** Los programas a los que aplica van primero y los que no aplican al final; dentro de cada grupo se respeta el orden del motor. */
const ordenarPorEstado = (resultados: ResultadoPrograma[]): ResultadoPrograma[] =>
  [...resultados].sort((a, b) => RANGO_ESTADO[a.estado] - RANGO_ESTADO[b.estado]);

export function construirDemo(idioma: Idioma = IDIOMA_POR_DEFECTO): Demo {
  const { descripcion, pasos: textos } = TEXTOS[idioma];
  let perfil: Perfil = { ...PERFIL_VACIO };
  const pasos = textos.map((texto, i): PasoDemo => {
    perfil = aplicarCambios(perfil, CAMBIOS[i]).perfil;
    const resultados = ordenarPorEstado(evaluarTodosLosProgramas(perfil, idioma));
    return { ...texto, perfil, resultados, plan: generarPlanPapeles(resultados, idioma) };
  });
  return { modo: 'demo', familia: { descripcion }, pasos };
}
