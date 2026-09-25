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

const COMUNES: Documento[] = [
  {
    nombre: 'Cédula de identidad vigente',
    detalle: 'De quien postula y de cada integrante del grupo familiar mayor de 18 años.',
  },
  {
    nombre: 'Cartola Hogar del Registro Social de Hogares',
    detalle: 'Se obtiene en registrosocial.gob.cl o en tu municipalidad.',
  },
];

const POR_PROGRAMA: Record<Programa, { documentos: Documento[]; fuente: string }> = {
  DS49: {
    documentos: [
      { nombre: 'Formulario de Postulación Individual (FSEV)' },
      { nombre: 'Declaración de Núcleo Familiar (DJ49-1)' },
      { nombre: 'Declaración Jurada de Postulación (DJ49-2)' },
      { nombre: 'Mandato de Ahorro (DJ49-3)' },
      {
        nombre: 'Certificado de la cuenta de ahorro para la vivienda',
        detalle: 'Con al menos 10 UF de ahorro.',
      },
    ],
    fuente: 'Formularios oficiales DS49 del MINVU (DJ49-1, DJ49-2, DJ49-3 y formulario FSEV 2019).',
  },
  DS1: {
    documentos: [
      {
        nombre: 'Certificado de la cuenta de ahorro para la vivienda',
        detalle: 'Con al menos 12 meses de antigüedad y el ahorro mínimo de tu tramo.',
      },
      {
        nombre: 'Formularios de postulación del llamado vigente',
        detalle: 'Los entrega Serviu o están en minvu.gob.cl.',
      },
    ],
    fuente:
      'Requisitos generales de DS1 (Res. Ex. N°669/2026). Los formularios específicos del llamado no se revisaron; confírmalos en Serviu.',
  },
  DS19: {
    documentos: [
      { nombre: 'Declaración Jurada de Postulación DS19' },
      { nombre: 'Declaración de Núcleo Familiar y No Propiedad DS19' },
      {
        nombre: 'Comprobante de inscripción o reserva en el proyecto',
        detalle: 'Lo entrega la inmobiliaria o constructora del proyecto que elijas.',
      },
    ],
    fuente: 'Declaraciones oficiales DS19 del MINVU y díptico DS19 (v/diciembre 2022).',
  },
  DS52: {
    documentos: [
      { nombre: 'Formulario A-01: Declaración de ahorro' },
      {
        nombre: 'Formulario A-02: Declaración de Núcleo Familiar',
        detalle: 'Firmado por todos los mayores de 18 años, o con huella digital si alguien no puede firmar.',
      },
      { nombre: 'Formulario A-03: Declaración jurada de postulación' },
      {
        nombre: 'Documentos para acreditar ingresos',
        detalle:
          'Por ejemplo, las 6 últimas liquidaciones de sueldo, certificado de cotizaciones AFP y salud, o carpeta tributaria del SII.',
      },
      {
        nombre: 'Certificado de mantención de la cuenta de ahorro',
        detalle: 'Solo si tu banco no tiene conexión en línea con Serviu. Con no más de 30 días de antigüedad.',
      },
    ],
    fuente: 'Díptico "Subsidio de Arriendo Regular" de Serviu Metropolitano (Región Metropolitana).',
  },
};

const CERTIFICADO_SUBSIDIO: Documento = {
  nombre: 'Certificado de subsidio vigente',
  detalle: 'El certificado de tu subsidio DS49, DS1 Tramo 1 o de damnificado.',
};

export function generarPlanPapeles(resultados: ResultadoPrograma[], _idioma: Idioma = IDIOMA_POR_DEFECTO): PlanPrograma[] {
  return resultados
    .filter((r) => r.estado === 'elegible')
    .map((r) => {
      const { documentos, fuente } = POR_PROGRAMA[r.programa];
      const extra = r.programa === 'DS19' && r.detalle?.ruta === 'A' ? [CERTIFICADO_SUBSIDIO] : [];
      return { programa: r.programa, documentos: [...COMUNES, ...documentos, ...extra], fuente };
    });
}
