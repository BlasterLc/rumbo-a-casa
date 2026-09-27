import type { DiccionarioTextos } from './diccionario';

export const en: DiccionarioTextos = {
  comun: {
    fuente: (valor) => `Source: ${valor}`,
    sinFechaPublicada: 'No date published yet',
    porConfirmarServiuRegional: 'To be confirmed with your regional Serviu',
  },
  atoms: {
    campoTexto: { dictarPorVoz: 'Dictate by voice' },
  },
  molecules: {
    selloElegibilidad: {
      califica: 'You qualify',
      falta: 'Missing a detail',
      posible: 'Possible',
      noAplica: "Doesn't apply",
    },
    avisoLimite: {
      linea1:
        'We help you get ready to apply: we organize your details, check your eligibility, and put together your document plan.',
      linea2: 'You apply yourself, with your Clave Única, in your own browser.',
      linea3: (dominio) => `We never ask for your Clave Única, and we never go to ${dominio} for you.`,
      irA: (dominio) => `Go to ${dominio}`,
    },
    burbujaChat: {
      escuchar: 'Listen',
      dictadoMarca: 'You said this out loud · tap to fix it',
      porQuePregunto: 'Why am I asking this?',
    },
    pasoAPaso: {
      pasoDe: (activo, total) => `Step ${activo} of ${total}`,
    },
  },
  organisms: {
    barraInferior: { hablar: 'Talk', miPlan: 'My plan', documentos: 'Documents', avisos: 'Alerts' },
    cabeceraApp: { volver: 'Back', accion: 'Action' },
    navegacionSuperior: { etiqueta: 'Main navigation' },
    cabeceraEscritorio: { inicio: 'Home' },
    checklistDocumentos: {
      deListos: (listos, total) => `${listos} of ${total} ready`,
      vence: (fecha) => `Due: ${fecha}`,
      notaNoGuarda: "We don't store your documents. The checkbox is just a reminder for you.",
    },
    tarjetaPorQue: {
      tuDato: (dato) => `Your answer: ${dato}`,
    },
    lineaDeLlamados: { porConfirmar: 'To be confirmed with Serviu.' },
    nombrePrograma: {
      DS49: 'A home with no mortgage',
      DS1: 'Middle-income households',
      DS19: 'Social integration',
      DS52: 'Rental subsidy',
    },
    panelProgramas: {
      titulo: 'We check four programs for you',
      descripcion: {
        DS49: 'Buy or build a home with your savings and the subsidy, without a mortgage loan.',
        DS1: 'Buy a home if your family is in the middle-income sector.',
        DS19: 'Buy in projects where families with different incomes live together.',
        DS52: 'Pay part of your rent with a monthly subsidy.',
      },
    },
  },
  pantallas: {
    bienvenida: {
      titulo: 'Find out which housing subsidy you can apply for',
      bajada: 'Tell us about your family in about 5 minutes.',
      empezar: 'Start',
      prefieroHablar: "I'd rather talk",
      seguirDondeQuedaste: 'Continue where you left off',
      empezarDeNuevo: 'Start over',
      fraseConfianza:
        'Independent tool, not official. We will never ask for your Clave Única. You can delete your data whenever you want.',
    },
    entrevista: {
      titulo: "Let's talk",
      pasos: { familia: 'Family', vivienda: 'Housing', ahorro: 'Savings', ingreso: 'Income', region: 'Region' },
      preguntaMensaje: 'Write your answer',
      enviar: 'Send',
      pensando: 'Reviewing your answer',
      limiteCaracteres: (n) => `Maximum ${n} characters.`,
      probarModoDemo: 'Try demo mode',
      mensajeDemoActivado:
        'We turned on demo mode with a made-up family so you can see how Rumbo a Casa works.',
      errorGenerico: 'Something went wrong. Try again in a moment.',
    },
    resultado: {
      titulo: 'Your result',
      calificaPara: (n) => `You qualify for ${n} program${n > 1 ? 's' : ''}`,
      revisamosCuatro: 'We reviewed your four programs',
      personas: (n) => `${n} people`,
      sinDatos: "We don't have enough details yet. Go back to the interview to keep telling us.",
      verDocumentos: 'See the documents',
      verComoAlcanzarlo: 'See how to get there',
    },
    plan: {
      titulo: 'Your plan',
      tituloPrograma: (programa) => `Your plan · ${programa}`,
      noReconocemos: "We don't recognize that program. Go back to your result.",
      paso1: '1. Review why you qualify',
      paso2: '2. Gather your documents',
      paso3: '3. Save the call date',
      paso4: '4. Apply on the MINVU site',
      todaviaNoEvaluamos: "We haven't evaluated this program yet.",
      calificaPrimero: 'You need to qualify first to see your document list.',
      yaPostule: 'I already applied',
    },
    documentos: {
      titulo: 'Your documents',
      sinProgramas: "You don't qualify for any program yet. Go back to the interview to keep telling us.",
    },
    seguimiento: {
      titulo: 'Alerts',
      reglasAl: (fecha) => `Rules as of ${fecha}`,
      proximoLlamado: 'Next call',
      fechaPrevista: "Expected date. We'll confirm once Serviu publishes it.",
      enQueEtapa: 'What stage are you at?',
      etapas: {
        papeles: { titulo: 'Gathering documents', detalle: "You're still putting your papers together." },
        postule: { titulo: 'Applied', detalle: 'You already submitted your application on the MINVU site.' },
        evaluacion: { titulo: 'Under review', detalle: 'Serviu is reviewing your application.' },
        resultado: { titulo: 'Result published', detalle: 'Your application result is already out.' },
      },
      preguntaFolio: "What's your file number?",
      ayudaFolio: 'The MINVU site gives it to you when you finish applying.',
      guardarFolio: 'Save file number',
      notaEstado: "The status isn't checked automatically: you mark the stage and we remind you what's left.",
    },
  },
};
