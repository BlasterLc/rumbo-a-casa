export interface DiccionarioTextos {
  comun: {
    /** "Fuente: {valor}" — usado por TarjetaPrograma y TarjetaPorQue. */
    fuente: (valor: string) => string;
    sinFechaPublicada: string;
    porConfirmarServiuRegional: string;
  };
  atoms: {
    campoTexto: {
      dictarPorVoz: string;
    };
  };
  molecules: {
    selloElegibilidad: {
      califica: string;
      falta: string;
      posible: string;
      noAplica: string;
    };
    avisoLimite: {
      linea1: string;
      linea2: string;
      linea3: (dominio: string) => string;
      irA: (dominio: string) => string;
    };
    burbujaChat: {
      escuchar: string;
      detener: string;
      dictadoMarca: string;
      porQuePregunto: string;
    };
    pasoAPaso: {
      pasoDe: (activo: number, total: number) => string;
    };
  };
  organisms: {
    barraInferior: {
      hablar: string;
      miPlan: string;
      documentos: string;
      avisos: string;
    };
    cabeceraApp: {
      volver: string;
      accion: string;
    };
    cabeceraEscritorio: {
      /** Sufijo del nombre accesible del botón de la marca: "Rumbo a Casa · {inicio}". */
      inicio: string;
      /** Etiqueta junto a la marca: aclara que la herramienta no es del Estado. */
      etiquetaNoOficial: string;
    };
    /** Sidebar de navegación de escritorio: los mismos cuatro destinos de BarraInferior, en vertical. */
    sidebarEscritorio: {
      etiqueta: string;
      borrarDatos: string;
      /** Pregunta de confirmación que reemplaza a "Borrar mis datos" tras el primer clic. */
      borrarConfirmarPregunta: string;
      borrarConfirmarSi: string;
      borrarConfirmarCancelar: string;
      notaPrivacidad: string;
    };
    checklistDocumentos: {
      deListos: (listos: number, total: number) => string;
      vence: (fecha: string) => string;
      notaNoGuarda: string;
      yaLoTengo: string;
      ayuda: string;
    };
    tarjetaPorQue: {
      tuDato: (dato: string) => string;
    };
    lineaDeLlamados: {
      porConfirmar: string;
    };
    /** Nombre común de cada programa, compartido por PantallaResultado, PantallaPlan y PantallaDocumentos. */
    nombrePrograma: Record<'DS49' | 'DS1' | 'DS19' | 'DS52', string>;
    /** Panel de programas de la Bienvenida en escritorio. */
    panelProgramas: {
      titulo: string;
      cuerpo: string;
      etiquetaProgramas: string;
      /** Una línea por programa, sin cifras ni requisitos. */
      lineas: Record<'DS49' | 'DS1' | 'DS19' | 'DS52', string>;
    };
  };
  pantallas: {
    bienvenida: {
      titulo: string;
      bajada: string;
      empezar: string;
      seguirDondeQuedaste: string;
      empezarDeNuevo: string;
      fraseConfianza: string;
      /** Sección "Cómo trabajamos contigo": qué hace la herramienta y qué queda en manos de la persona. */
      roles: {
        eyebrow: string;
        titulo: string;
        bajada: string;
        hace: { etiqueta: string; nombre: string; items: string[] };
        tu: { etiqueta: string; nombre: string; items: string[]; aviso: string };
      };
      faq: {
        eyebrow: string;
        titulo: string;
        preguntas: { pregunta: string; respuesta: string }[];
      };
      /** Franja de cierre al pie de la Bienvenida. */
      cierre: { titulo: string; detalle: string };
      /** Banda de "cómo funciona" en la Bienvenida: tres pasos fijos. */
      pasos: {
        /** Encabezado visualmente oculto de la banda, para que el lector de pantalla no la
         * anide bajo el `h2` de `PanelProgramas`. */
        titulo: string;
        paso1Titulo: string;
        paso1Detalle: string;
        paso2Titulo: string;
        paso2Detalle: string;
        paso3Titulo: string;
        paso3Detalle: string;
      };
    };
    entrevista: {
      titulo: string;
      pasos: { familia: string; vivienda: string; ahorro: string; ingreso: string; region: string };
      /** Primer turno del agente, visible solo mientras la conversación está vacía: da la
       * bienvenida y explica de qué trata la conversación y qué se obtiene al final. */
      mensajeBienvenida: string;
      preguntaMensaje: string;
      enviar: string;
      pensando: string;
      limiteCaracteres: (n: number) => string;
      probarModoDemo: string;
      mensajeDemoActivado: string;
      modoDemoTitulo: string;
      modoDemoAviso: string;
      salirModoDemo: string;
      errorGenerico: string;
      /** Nombre accesible del registro de la conversación (escritorio). */
      etiquetaConversacion: string;
      /** Nombre accesible del panel lateral con el avance (escritorio). */
      etiquetaAvance: string;
    };
    resultado: {
      titulo: string;
      calificaPara: (n: number) => string;
      revisamosCuatro: string;
      personas: (n: number) => string;
      sinDatos: string;
      verDocumentos: string;
      verComoAlcanzarlo: string;
    };
    plan: {
      titulo: string;
      tituloPrograma: (programa: string) => string;
      noReconocemos: string;
      paso1: string;
      paso2: string;
      paso3: string;
      paso4: string;
      todaviaNoEvaluamos: string;
      calificaPrimero: string;
      yaPostule: string;
    };
    documentos: {
      titulo: string;
      sinProgramas: string;
      explicacionTitulo: string;
      explicacion: string;
    };
    seguimiento: {
      titulo: string;
      reglasAl: (fecha: string) => string;
      proximoLlamado: string;
      fechaPrevista: string;
      enQueEtapa: string;
      etapas: {
        papeles: { titulo: string; detalle: string };
        postule: { titulo: string; detalle: string };
        evaluacion: { titulo: string; detalle: string };
        resultado: { titulo: string; detalle: string };
      };
      preguntaFolio: string;
      ayudaFolio: string;
      guardarFolio: string;
      folioGuardado: (folio: string) => string;
      notaEstado: string;
    };
  };
}
