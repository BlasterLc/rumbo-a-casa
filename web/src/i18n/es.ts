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
    navegacionSuperior: { etiqueta: 'Navegación principal' },
    cabeceraEscritorio: { inicio: 'Inicio' },
    checklistDocumentos: {
      deListos: (listos, total) => `${listos} de ${total} listos`,
      vence: (fecha) => `Vence: ${fecha}`,
      notaNoGuarda: 'La app no guarda tus documentos. La casilla es solo un recordatorio tuyo.',
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
  },
  pantallas: {
    bienvenida: {
      titulo: 'Averigua a qué subsidio de vivienda puedes postular',
      bajada: 'Cuéntanos de tu familia en unos 5 minutos.',
      empezar: 'Empezar',
      prefieroHablar: 'Prefiero hablar',
      seguirDondeQuedaste: 'Seguir donde quedaste',
      empezarDeNuevo: 'Empezar de nuevo',
      fraseConfianza:
        'Herramienta independiente, no oficial. Nunca te pediremos tu Clave Única. Puedes borrar tus datos cuando quieras.',
    },
    entrevista: {
      titulo: 'Hablemos',
      pasos: { familia: 'Familia', vivienda: 'Vivienda', ahorro: 'Ahorro', ingreso: 'Ingreso', region: 'Región' },
      preguntaMensaje: 'Escribe tu respuesta',
      enviar: 'Enviar',
      pensando: 'Revisando tu respuesta',
      limiteCaracteres: (n) => `Máximo ${n} caracteres.`,
      probarModoDemo: 'Probar modo demo',
      mensajeDemoActivado:
        'Activamos el modo demo con una familia ficticia para que puedas ver cómo funciona Rumbo a Casa.',
      errorGenerico: 'Algo no funcionó. Intenta de nuevo en un momento.',
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
      notaEstado: 'El estado no se consulta solo: tú marcas la etapa y nosotros te recordamos lo que falta.',
    },
  },
};
