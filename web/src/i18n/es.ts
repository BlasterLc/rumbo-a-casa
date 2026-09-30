import type { DiccionarioTextos } from './diccionario';

export const es: DiccionarioTextos = {
  comun: {
    fuente: (valor) => `Fuente: ${valor}`,
    sinFechaPublicada: 'Sin fecha publicada',
    porConfirmarServiuRegional: 'Por confirmar con tu Serviu regional',
  },
  atoms: {
    campoTexto: { dictarPorVoz: 'Dictar por voz' },
  },
  molecules: {
    selloElegibilidad: {
      califica: 'Califica',
      falta: 'Falta un dato',
      posible: 'Posible',
      noAplica: 'No aplica',
    },
    avisoLimite: {
      linea1:
        'Te preparamos para postular: ordenamos tus datos, evaluamos tu elegibilidad y armamos tu plan de documentos.',
      linea2: 'Postulas tú, con tu Clave Única, en tu propio navegador.',
      linea3: (dominio) => `Nunca te pedimos tu Clave Única, ni entramos a ${dominio} por ti.`,
      irA: (dominio) => `Ir a ${dominio}`,
    },
    burbujaChat: {
      escuchar: 'Escuchar',
      detener: 'Detener',
      dictadoMarca: 'Lo dijiste hablando · toca para corregir',
      porQuePregunto: '¿Por qué pregunto esto?',
    },
    pasoAPaso: {
      pasoDe: (activo, total) => `Paso ${activo} de ${total}`,
    },
  },
  organisms: {
    barraInferior: { hablar: 'Hablar', miPlan: 'Mi plan', documentos: 'Documentos', avisos: 'Avisos' },
    cabeceraApp: { volver: 'Volver', accion: 'Acción' },
    cabeceraEscritorio: { inicio: 'Inicio', etiquetaNoOficial: 'Herramienta no oficial' },
    sidebarEscritorio: {
      etiqueta: 'Navegación principal',
      borrarDatos: 'Borrar mis datos',
      borrarConfirmarPregunta: '¿Seguro? Se borrará tu conversación de este navegador.',
      borrarConfirmarSi: 'Sí, borrar',
      borrarConfirmarCancelar: 'Cancelar',
      notaPrivacidad: 'Nunca te pedimos tu Clave Única. Puedes borrar tus datos de este navegador cuando quieras.',
    },
    checklistDocumentos: {
      deListos: (listos, total) => `${listos} de ${total} listos`,
      vence: (fecha) => `Vence: ${fecha}`,
      notaNoGuarda: 'La app no guarda tus documentos. La casilla es solo un recordatorio tuyo.',
      yaLoTengo: 'Ya lo tengo guardado',
      ayuda: 'Marca cada papel cuando ya lo tengas guardado en tu casa o en tu teléfono.',
    },
    tarjetaPorQue: {
      tuDato: (dato) => `Tu dato: ${dato}`,
    },
    lineaDeLlamados: { porConfirmar: 'Por confirmar con el Serviu.' },
    nombrePrograma: {
      DS49: 'Casa propia sin crédito',
      DS1: 'Sectores medios',
      DS19: 'Integración social',
      DS52: 'Arriendo',
    },
    panelProgramas: {
      titulo: 'Tú postulas. Nosotros te preparamos.',
      cuerpo:
        'Esto no es un sitio del Estado. Es una herramienta que ordena tus datos y arma tu plan. El botón final lo aprietas tú, con tu Clave Única, en el sitio del MINVU.',
      etiquetaProgramas: 'Programas que revisamos',
      lineas: {
        DS49: 'la casa propia sin crédito hipotecario',
        DS1: 'sectores medios, con crédito',
        DS19: 'integración social',
        DS52: 'subsidio de arriendo',
      },
    },
  },
  pantallas: {
    bienvenida: {
      titulo: 'Averigua a qué subsidio de vivienda puedes postular',
      bajada:
        'Cuéntanos de tu familia en unos 5 minutos. Te decimos a qué puedes postular, con la regla y su fuente, y te armamos el plan paso a paso.',
      empezar: 'Empezar',
      seguirDondeQuedaste: 'Seguir donde quedaste',
      empezarDeNuevo: 'Empezar de nuevo',
      fraseConfianza:
        'Herramienta independiente, no oficial. Nunca te pediremos tu Clave Única. Puedes borrar tus datos cuando quieras.',
      roles: {
        eyebrow: 'Cómo trabajamos contigo',
        titulo: 'Cada quien hace su parte, sin sorpresas',
        bajada:
          'Somos claros con lo que hacemos por ti y lo que queda en tus manos. Así sabes, en todo momento, quién tiene el control de tu trámite.',
        hace: {
          etiqueta: 'Lo que hace',
          nombre: 'Rumbo a Casa',
          items: [
            'Ordena tus datos y arma tu carpeta de documentos.',
            'Evalúa tu elegibilidad con las reglas vigentes del MINVU.',
            'Te explica por qué calificas, citando la regla y su fecha.',
            'Te recuerda el próximo llamado y lo que te falta.',
          ],
        },
        tu: {
          etiqueta: 'Lo que haces',
          nombre: 'Tú',
          items: [
            'Nos cuentas de tu familia, a tu ritmo.',
            'Reúnes los documentos que te indicamos.',
            'Aprietas el botón final en el MINVU, con tu Clave Única.',
          ],
          aviso: 'Nunca pedimos tu Clave Única. Puedes borrar tus datos cuando quieras.',
        },
      },
      faq: {
        eyebrow: 'Preguntas frecuentes',
        titulo: 'Lo que la gente nos pregunta',
        preguntas: [
          {
            pregunta: '¿Rumbo a Casa es del Estado?',
            respuesta:
              'No. Es una herramienta independiente y no oficial. Usamos las reglas vigentes del MINVU, pero la postulación la haces tú en su sitio.',
          },
          {
            pregunta: '¿Me piden mi Clave Única?',
            respuesta: 'Nunca. Solo la usas tú, al final, en el sitio del MINVU.',
          },
          {
            pregunta: '¿Qué pasa con mis datos?',
            respuesta:
              'Los usamos para armar tu resultado y tu plan. No pedimos correo ni registro, y puedes borrar lo guardado en tu dispositivo con «Empezar de nuevo».',
          },
          {
            pregunta: '¿El resultado es definitivo?',
            respuesta:
              'No. Es una orientación con las reglas vigentes. La decisión final la toma el MINVU cuando postulas.',
          },
          { pregunta: '¿Tiene algún costo?', respuesta: 'No. Usar Rumbo a Casa es gratis.' },
          {
            pregunta: '¿Necesito registrarme?',
            respuesta: 'No. Sin registro, sin correo y sin Clave Única.',
          },
        ],
      },
      cierre: {
        titulo: '¿Vemos a qué puedes postular?',
        detalle: 'Toma unos 5 minutos. Sin registro, sin Clave Única, gratis.',
      },
      pasos: {
        titulo: 'Cómo funciona',
        paso1Titulo: 'Cuéntanos de tu familia',
        paso1Detalle: 'Una conversación corta. Puedes escribir o hablar.',
        paso2Titulo: 'Mira tu resultado',
        paso2Detalle: 'Cada programa con su sello, su razón y su fuente.',
        paso3Titulo: 'Arma tu plan y postula',
        paso3Detalle: 'Tus documentos, la fecha del llamado y el paso al MINVU.',
      },
    },
    entrevista: {
      titulo: 'Hablemos',
      pasos: { familia: 'Familia', vivienda: 'Vivienda', ahorro: 'Ahorro', ingreso: 'Ingreso', region: 'Región' },
      mensajeBienvenida:
        '**¡Bienvenido a Rumbo a Casa!** Te acompañamos en este proceso.\n\nTe voy a preguntar por tu familia, tu vivienda, tus ahorros, tu ingreso y tu región para saber a qué subsidios de vivienda calificas. Al final vas a ver tu resultado y los pasos para postular.\n\nPuedes escribir como si conversaras, sin formularios. Cuéntame cuando quieras y empezamos.',
      preguntaMensaje: 'Escribe tu respuesta',
      enviar: 'Enviar',
      pensando: 'Revisando tu respuesta',
      limiteCaracteres: (n) => `Máximo ${n} caracteres.`,
      probarModoDemo: 'Probar modo demo',
      mensajeDemoActivado:
        'Activamos el modo demo con una familia ficticia para que puedas ver cómo funciona Rumbo a Casa.',
      modoDemoTitulo: 'Estás en modo demo',
      modoDemoAviso: 'Es una familia ficticia: los resultados salen del motor real, pero no son los de tu familia.',
      salirModoDemo: 'Empezar mi conversación',
      errorGenerico: 'Algo no funcionó. Intenta de nuevo en un momento.',
      etiquetaConversacion: 'Conversación',
      etiquetaAvance: 'Avance de la entrevista',
      ocultarAvance: 'Ocultar avance',
      mostrarAvance: 'Mostrar avance',
    },
    resultado: {
      titulo: 'Tu resultado',
      calificaPara: (n) => `Calificas para ${n} programa${n > 1 ? 's' : ''}`,
      revisamosCuatro: 'Revisamos tus cuatro programas',
      personas: (n) => `${n} personas`,
      sinDatos: 'Todavía no tenemos datos suficientes. Vuelve a la entrevista para seguir contándonos.',
      verDocumentos: 'Ver los documentos',
      verComoAlcanzarlo: 'Ver cómo alcanzarlo',
    },
    plan: {
      titulo: 'Tu plan',
      tituloPrograma: (programa) => `Tu plan · ${programa}`,
      noReconocemos: 'No reconocemos ese programa. Vuelve a tu resultado.',
      paso1: '1. Revisa por qué calificas',
      paso2: '2. Reúne tus documentos',
      paso3: '3. Guarda la fecha del llamado',
      paso4: '4. Postula en el sitio del MINVU',
      todaviaNoEvaluamos: 'Todavía no evaluamos este programa.',
      calificaPrimero: 'Calificas primero para ver tu lista de documentos.',
      yaPostule: 'Ya postulé',
    },
    documentos: {
      titulo: 'Tus documentos',
      sinProgramas: 'Todavía no calificas para ningún programa. Vuelve a la entrevista para seguir contándonos.',
      explicacionTitulo: 'No tienes que subir nada',
      explicacion:
        'Esta es solo una lista de los papeles que vas a necesitar. Aquí no los subimos ni los guardamos: sirve para que sepas qué juntar. Cuando tengas uno guardado, márcalo en la lista.',
    },
    seguimiento: {
      titulo: 'Avisos',
      reglasAl: (fecha) => `Reglas al ${fecha}`,
      proximoLlamado: 'Próximo llamado',
      fechaPrevista: 'Fecha prevista. Te confirmamos cuando el Serviu la publique.',
      enQueEtapa: '¿En qué etapa estás?',
      etapas: {
        papeles: { titulo: 'Reuniendo documentos', detalle: 'Todavía estás juntando tus papeles.' },
        postule: { titulo: 'Postulé', detalle: 'Ya entregaste tu postulación en el sitio del MINVU.' },
        evaluacion: { titulo: 'En evaluación', detalle: 'El Serviu está revisando tu postulación.' },
        resultado: { titulo: 'Resultado publicado', detalle: 'Ya salió el resultado de tu postulación.' },
      },
      preguntaFolio: '¿Cuál es tu número de folio?',
      ayudaFolio: 'Lo entrega el sitio del MINVU al terminar tu postulación.',
      guardarFolio: 'Guardar folio',
      folioGuardado: (folio) => `Folio guardado: ${folio}`,
      notaEstado: 'El estado no se consulta solo: tú marcas la etapa y nosotros te recordamos lo que falta.',
    },
  },
};
