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
      detener: 'Stop',
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
    cabeceraEscritorio: { inicio: 'Home', etiquetaNoOficial: 'Not an official tool' },
    sidebarEscritorio: {
      etiqueta: 'Main navigation',
      borrarDatos: 'Delete my data',
      borrarConfirmarPregunta: 'Are you sure? This clears your conversation from this browser.',
      borrarConfirmarSi: 'Yes, delete',
      borrarConfirmarCancelar: 'Cancel',
      notaPrivacidad: 'We never ask for your Clave Única. You can delete your data from this browser whenever you want.',
    },
    checklistDocumentos: {
      deListos: (listos, total) => `${listos} of ${total} ready`,
      vence: (fecha) => `Due: ${fecha}`,
      notaNoGuarda: "We don't store your documents. The checkbox is just a reminder for you.",
      yaLoTengo: 'I already have it saved',
      ayuda: 'Check each paper once you have it saved at home or on your phone.',
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
      titulo: 'You apply. We get you ready.',
      cuerpo:
        'This is not a government site. It is a tool that organizes your information and builds your plan. You press the final button yourself, with your Clave Única, on the MINVU site.',
      etiquetaProgramas: 'Programs we check',
      lineas: {
        DS49: 'your own home, no mortgage loan',
        DS1: 'middle-income families, with a loan',
        DS19: 'social integration',
        DS52: 'rent subsidy',
      },
    },
  },
  pantallas: {
    bienvenida: {
      titulo: 'Find out which housing subsidy you can apply for',
      bajada:
        'Tell us about your family in about 5 minutes. We tell you which programs you can apply for, with the rule and its source, and we build your plan step by step.',
      empezar: 'Start',
      seguirDondeQuedaste: 'Continue where you left off',
      empezarDeNuevo: 'Start over',
      fraseConfianza:
        'Independent tool, not official. We will never ask for your Clave Única. You can delete your data whenever you want.',
      roles: {
        eyebrow: 'How we work with you',
        titulo: 'Everyone does their part, no surprises',
        bajada:
          'We are clear about what we do for you and what stays in your hands. That way you always know who is in control of your application.',
        hace: {
          etiqueta: 'What it does',
          nombre: 'Rumbo a Casa',
          items: [
            'Organizes your information and builds your document folder.',
            'Checks your eligibility with the current MINVU rules.',
            'Explains why you qualify, citing the rule and its date.',
            'Reminds you of the next call and what you are missing.',
          ],
        },
        tu: {
          etiqueta: 'What you do',
          nombre: 'You',
          items: [
            'Tell us about your family, at your own pace.',
            'Gather the documents we tell you about.',
            'Press the final button on the MINVU site, with your Clave Única.',
          ],
          aviso: 'We never ask for your Clave Única. You can delete your data whenever you want.',
        },
      },
      faq: {
        eyebrow: 'Frequently asked questions',
        titulo: 'What people ask us',
        preguntas: [
          {
            pregunta: 'Is Rumbo a Casa run by the government?',
            respuesta:
              'No. It is an independent, unofficial tool. We use the current MINVU rules, but you submit your application on their site.',
          },
          {
            pregunta: 'Do you ask for my Clave Única?',
            respuesta: 'Never. Only you use it, at the end, on the MINVU site.',
          },
          {
            pregunta: 'What happens to my data?',
            respuesta:
              'We use it to build your result and your plan. We do not ask for an email or sign-up, and you can delete what is saved on your device with "Start over".',
          },
          {
            pregunta: 'Is the result final?',
            respuesta:
              'No. It is guidance based on the current rules. MINVU makes the final decision when you apply.',
          },
          { pregunta: 'Does it cost anything?', respuesta: 'No. Using Rumbo a Casa is free.' },
          {
            pregunta: 'Do I need to sign up?',
            respuesta: 'No. No sign-up, no email and no Clave Única.',
          },
        ],
      },
      cierre: {
        titulo: 'Shall we see what you can apply for?',
        detalle: 'It takes about 5 minutes. No sign-up, no Clave Única, free.',
      },
      pasos: {
        titulo: 'How it works',
        paso1Titulo: 'Tell us about your family',
        paso1Detalle: 'A short conversation. You can type or talk.',
        paso2Titulo: 'See your result',
        paso2Detalle: 'Each program with its seal, its reason and its source.',
        paso3Titulo: 'Build your plan and apply',
        paso3Detalle: 'Your documents, the call date and the step to MINVU.',
      },
    },
    entrevista: {
      titulo: "Let's talk",
      pasos: { familia: 'Family', vivienda: 'Housing', ahorro: 'Savings', ingreso: 'Income', region: 'Region' },
      mensajeBienvenida:
        '**Welcome to Rumbo a Casa!** We’ll walk you through this process.\n\nI’m going to ask about your family, your housing, your savings, your income and your region, to see which housing subsidies you qualify for. At the end you’ll see your result and the steps to apply.\n\nYou can write as if you were chatting, no forms needed. Tell me whenever you’re ready and we’ll start.',
      preguntaMensaje: 'Write your answer',
      enviar: 'Send',
      pensando: 'Reviewing your answer',
      limiteCaracteres: (n) => `Maximum ${n} characters.`,
      probarModoDemo: 'Try demo mode',
      mensajeDemoActivado:
        'We turned on demo mode with a made-up family so you can see how Rumbo a Casa works.',
      modoDemoTitulo: "You're in demo mode",
      modoDemoAviso: "This is a made-up family: the results come from the real rules engine, but they aren't your family's.",
      salirModoDemo: 'Start my conversation',
      errorGenerico: 'Something went wrong. Try again in a moment.',
      etiquetaConversacion: 'Conversation',
      etiquetaAvance: 'Interview progress',
      ocultarAvance: 'Hide progress',
      mostrarAvance: 'Show progress',
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
      explicacionTitulo: "You don't need to upload anything",
      explicacion:
        "This is just a list of the papers you will need. We don't upload or store them here: it helps you know what to gather. When you have one saved, check it off the list.",
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
      folioGuardado: (folio) => `File number saved: ${folio}`,
      notaEstado: "The status isn't checked automatically: you mark the stage and we remind you what's left.",
    },
  },
};
