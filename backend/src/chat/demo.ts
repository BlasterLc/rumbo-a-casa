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
      '¡Hola! Te ayudo a ver qué subsidios podrían servirte. Ya anoté que vives en la Región Metropolitana y que quieres comprar. ¿Qué edad tienes y quiénes forman tu grupo familiar?',
    cambios: { region: 'Metropolitana', zonaEspecial: 'ninguna', objetivo: 'comprar' },
  },
  {
    usuario:
      'Tengo 34 años y vivo con mi pareja, de 33, y nuestros hijos de 8 y 5. Nadie tiene discapacidad certificada.',
    respuesta:
      'Gracias. Son 4 personas en tu grupo familiar. Ahora necesito saber cómo estás en el Registro Social de Hogares, el RSH. ¿En qué tramo estás, y tienes vivienda propia o has recibido algún subsidio antes?',
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
      'Perfecto. Con eso ya puedo mirar algunos programas, pero me faltan datos de ahorro e ingresos para decidir todos. ¿Cuánto tienes ahorrado en la cuenta de ahorro para la vivienda, hace cuánto la abriste y cuál es el ingreso mensual de tu familia?',
    cambios: { tramoRSH: 40, tienePropiedad: false, subsidioPrevio: 'ninguno' },
  },
  {
    usuario: 'Tenemos 12 UF en la cuenta de ahorro, abierta hace 18 meses, y el ingreso de la familia es de unas 22 UF al mes.',
    respuesta:
      'Con lo que me contaste, esto es lo que veo. Calificas a DS49, que es el camino más directo para comprar, y también a DS19. Como alternativa mientras ahorras, calificas a DS52, el subsidio de arriendo. No calificas a DS1: con 12 UF no alcanzas los 30 UF de ahorro que pide el primer tramo. Abajo tienes el detalle de cada programa, con el decreto en que se basa, y los papeles que te conviene ir juntando. Esto lo confirma el Serviu cuando postules.',
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
