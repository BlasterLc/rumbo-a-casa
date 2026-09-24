import { evaluarTodosLosProgramas, type Perfil, type ResultadoPrograma } from '../rules-engine/index';
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

interface GuionPaso {
  usuario: string;
  respuesta: string;
  cambios: Record<string, unknown>;
}

// Conversación de ejemplo con una familia ficticia. El texto del asistente y los datos que
// se van "aprendiendo" son fijos; las decisiones de elegibilidad y el plan de papeles los
// calcula el motor de reglas real en cada paso, igual que en /api/chat.
const GUION: GuionPaso[] = [
  {
    usuario: 'Hola, somos una familia de 4 en Santiago y queremos comprar nuestra primera vivienda.',
    respuesta:
      '¡Hola! Te ayudo a ver qué subsidios podrían servirles. Ya anoté que viven en la Región Metropolitana y quieren comprar. ¿Qué edad tienes y quiénes forman tu grupo familiar?',
    cambios: { region: 'Metropolitana', zonaEspecial: 'ninguna', objetivo: 'comprar' },
  },
  {
    usuario:
      'Tengo 34 años y vivo con mi pareja, de 33, y nuestros hijos de 8 y 5. Nadie tiene discapacidad certificada.',
    respuesta:
      'Gracias. Son 4 personas en el grupo familiar. Ahora necesito saber cómo están en el Registro Social de Hogares: ¿en qué tramo están, y tienen vivienda propia o han recibido algún subsidio antes?',
    cambios: {
      postulanteEdad: 34,
      integrantesGrupoFamiliar: [
        { edad: 33, discapacidadCertificada: false },
        { edad: 8, discapacidadCertificada: false },
        { edad: 5, discapacidadCertificada: false },
      ],
      excepcionPostulacionIndividualDS49: false,
    },
  },
  {
    usuario: 'Estamos en el tramo 40% del Registro Social de Hogares. No tenemos casa propia ni hemos tenido subsidio.',
    respuesta:
      'Perfecto. Con eso ya puedo mirar algunos programas, pero para decidir todos me faltan datos de ahorro e ingresos. ¿Cuánto tienen ahorrado en la cuenta de ahorro para la vivienda, hace cuánto la abrieron y cuál es el ingreso familiar mensual?',
    cambios: { tramoRSH: 40, tienePropiedad: false, subsidioPrevio: 'ninguno' },
  },
  {
    usuario: 'Tenemos 12 UF en la cuenta de ahorro, abierta hace 18 meses, y el ingreso de la familia es de unas 22 UF al mes.',
    respuesta:
      'Con lo que me contaste, esto es lo que veo. Califican a DS49, que es el camino más directo para comprar, y también a DS19. Como alternativa mientras ahorran, califican a DS52, el subsidio de arriendo. No califican a DS1: con 12 UF no alcanzan el ahorro mínimo de 30 UF de su primer tramo. Abajo tienes el detalle de cada programa, con el decreto en que se basa, y los papeles que te conviene ir juntando.',
    cambios: { ahorroUF: 12, antiguedadCuentaAhorroMeses: 18, ingresoFamiliarMensualUF: 22 },
  },
];

const DESCRIPCION_FAMILIA =
  'Familia ficticia de 4 personas en la Región Metropolitana (RSH 40%, sin vivienda ni subsidio previo, 12 UF de ahorro), inventada para esta demostración. No corresponde a ninguna persona real.';

export function construirDemo(): Demo {
  let perfil: Perfil = { ...PERFIL_VACIO };
  const pasos = GUION.map((paso): PasoDemo => {
    perfil = aplicarCambios(perfil, paso.cambios).perfil;
    const resultados = evaluarTodosLosProgramas(perfil);
    return {
      usuario: paso.usuario,
      respuesta: paso.respuesta,
      perfil,
      resultados,
      plan: generarPlanPapeles(resultados),
    };
  });
  return { modo: 'demo', familia: { descripcion: DESCRIPCION_FAMILIA }, pasos };
}
