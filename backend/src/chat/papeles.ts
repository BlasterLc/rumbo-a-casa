import { IDIOMA_POR_DEFECTO, type Idioma, type Programa, type ResultadoPrograma } from '../rules-engine/index';

export interface Documento {
  nombre: string;
  detalle?: string;
}

export interface PlanPrograma {
  programa: Programa;
  documentos: Documento[];
  fuente: string;
}

// El `nombre` de un documento NO se traduce: es el nombre oficial con el que se pide en el
// Serviu. El `detalle` en inglés es obligatorio, así quien lee en inglés siempre ve una
// explicación junto al nombre en español. El `detalle` en español es opcional.
interface Texto {
  es?: string;
  en: string;
}

interface DocumentoCatalogo {
  nombre: string;
  detalle: Texto;
}

interface ProgramaCatalogo {
  documentos: DocumentoCatalogo[];
  fuente: { es: string; en: string };
}

const COMUNES: DocumentoCatalogo[] = [
  {
    nombre: 'Cédula de identidad vigente',
    detalle: {
      es: 'De quien postula y de cada integrante del grupo familiar mayor de 18 años.',
      en: 'Valid national ID card of the applicant and of each household member over 18.',
    },
  },
  {
    nombre: 'Cartola Hogar del Registro Social de Hogares',
    detalle: {
      es: 'Se obtiene en registrosocial.gob.cl o en tu municipalidad.',
      en: 'Household statement from the Registro Social de Hogares (RSH). Get it at registrosocial.gob.cl or at your municipality.',
    },
  },
];

const POR_PROGRAMA: Record<Programa, ProgramaCatalogo> = {
  DS49: {
    documentos: [
      {
        nombre: 'Formulario de Postulación Individual (FSEV)',
        detalle: { en: 'Individual application form for the Fondo Solidario de Elección de Vivienda (FSEV).' },
      },
      {
        nombre: 'Declaración de Núcleo Familiar (DJ49-1)',
        detalle: { en: 'Declaration of who is in your household.' },
      },
      {
        nombre: 'Declaración Jurada de Postulación (DJ49-2)',
        detalle: { en: 'Sworn statement that you meet the application requirements.' },
      },
      {
        nombre: 'Mandato de Ahorro (DJ49-3)',
        detalle: { en: 'Authorization to use your savings for the subsidy application (savings mandate).' },
      },
      {
        nombre: 'Certificado de la cuenta de ahorro para la vivienda',
        detalle: {
          es: 'Con al menos 10 UF de ahorro.',
          en: 'Certificate of your housing savings account, showing at least 10 UF saved.',
        },
      },
    ],
    fuente: {
      es: 'Formularios oficiales DS49 del MINVU (DJ49-1, DJ49-2, DJ49-3 y formulario FSEV 2019).',
      en: 'Official MINVU DS49 forms (DJ49-1, DJ49-2, DJ49-3 and the 2019 FSEV form).',
    },
  },
  DS1: {
    documentos: [
      {
        nombre: 'Certificado de la cuenta de ahorro para la vivienda',
        detalle: {
          es: 'Con al menos 12 meses de antigüedad y el ahorro mínimo de tu tramo.',
          en: 'Certificate of your housing savings account, open for at least 12 months and with the minimum savings of your tier.',
        },
      },
      {
        nombre: 'Formularios de postulación del llamado vigente',
        detalle: {
          es: 'Los entrega Serviu o están en minvu.gob.cl.',
          en: 'Application forms of the current call. Serviu provides them, or find them at minvu.gob.cl.',
        },
      },
    ],
    fuente: {
      es: 'Requisitos generales de DS1 (Res. Ex. N°669/2026). Los formularios específicos del llamado no se revisaron; confírmalos en Serviu.',
      en: 'General DS1 requirements (Res. Ex. No. 669/2026). The call-specific forms were not reviewed; confirm them with Serviu.',
    },
  },
  DS19: {
    documentos: [
      {
        nombre: 'Declaración Jurada de Postulación DS19',
        detalle: { en: 'Sworn application statement for DS19.' },
      },
      {
        nombre: 'Declaración de Núcleo Familiar y No Propiedad DS19',
        detalle: { en: 'Declaration of your household and that no one in it owns a home.' },
      },
      {
        nombre: 'Comprobante de inscripción o reserva en el proyecto',
        detalle: {
          es: 'Lo entrega la inmobiliaria o constructora del proyecto que elijas.',
          en: 'Proof of registration or reservation in the project. The developer or builder of the project you choose provides it.',
        },
      },
    ],
    fuente: {
      es: 'Declaraciones oficiales DS19 del MINVU y díptico DS19 (v/diciembre 2022).',
      en: 'Official MINVU DS19 declarations and the DS19 leaflet (December 2022).',
    },
  },
  DS52: {
    documentos: [
      {
        nombre: 'Formulario A-01: Declaración de ahorro',
        detalle: { en: 'Savings declaration.' },
      },
      {
        nombre: 'Formulario A-02: Declaración de Núcleo Familiar',
        detalle: {
          es: 'Firmado por todos los mayores de 18 años, o con huella digital si alguien no puede firmar.',
          en: 'Household declaration. Signed by everyone over 18, or with a fingerprint if someone cannot sign.',
        },
      },
      {
        nombre: 'Formulario A-03: Declaración jurada de postulación',
        detalle: { en: 'Sworn application statement.' },
      },
      {
        nombre: 'Documentos para acreditar ingresos',
        detalle: {
          es: 'Por ejemplo, las 6 últimas liquidaciones de sueldo, certificado de cotizaciones AFP y salud, o carpeta tributaria del SII.',
          en: 'For example, your last 6 payslips, your AFP and health contribution certificate, or your SII tax folder.',
        },
      },
      {
        nombre: 'Certificado de mantención de la cuenta de ahorro',
        detalle: {
          es: 'Solo si tu banco no tiene conexión en línea con Serviu. Con no más de 30 días de antigüedad.',
          en: 'Certificate that your savings account is maintained. Only if your bank has no online connection with Serviu. No more than 30 days old.',
        },
      },
    ],
    fuente: {
      es: 'Díptico "Subsidio de Arriendo Regular" de Serviu Metropolitano (Región Metropolitana).',
      en: 'Leaflet "Subsidio de Arriendo Regular" from Serviu Metropolitano (Metropolitan Region).',
    },
  },
};

const CERTIFICADO_SUBSIDIO: DocumentoCatalogo = {
  nombre: 'Certificado de subsidio vigente',
  detalle: {
    es: 'El certificado de tu subsidio DS49, DS1 Tramo 1 o de damnificado.',
    en: 'Certificate of your DS49 or DS1 Tier 1 subsidy, or of your disaster-victim subsidy.',
  },
};

function resolver(documento: DocumentoCatalogo, idioma: Idioma): Documento {
  const detalle = documento.detalle[idioma];
  return detalle === undefined ? { nombre: documento.nombre } : { nombre: documento.nombre, detalle };
}

export function generarPlanPapeles(
  resultados: ResultadoPrograma[],
  idioma: Idioma = IDIOMA_POR_DEFECTO,
): PlanPrograma[] {
  return resultados
    .filter((r) => r.estado === 'elegible')
    .map((r) => {
      const { documentos, fuente } = POR_PROGRAMA[r.programa];
      const extra = r.programa === 'DS19' && r.detalle?.ruta === 'A' ? [CERTIFICADO_SUBSIDIO] : [];
      return {
        programa: r.programa,
        documentos: [...COMUNES, ...documentos, ...extra].map((d) => resolver(d, idioma)),
        fuente: fuente[idioma],
      };
    });
}
