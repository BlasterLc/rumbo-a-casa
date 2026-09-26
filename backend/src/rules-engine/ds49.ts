import type { Perfil } from './perfil.schema';
import {
  IDIOMA_POR_DEFECTO,
  resultadoDecision,
  resultadoFaltaDato,
  type Idioma,
  type ResultadoPrograma,
} from './tipos';
import { MENSAJES } from './mensajes';

const REGLA_DS49 = {
  decreto: 'D.S. N°49 (V. y U.) de 2011',
  fuente: 'docs/programas-subsidio.md, sección DS49',
  fechaConsulta: '2026-09-22',
};

const CAMPOS_REQUERIDOS = [
  'tramoRSH', 'tienePropiedad', 'ahorroUF', 'postulanteEdad', 'integrantesGrupoFamiliar',
] as const;

export function evaluarDS49(perfil: Perfil, idioma: Idioma = IDIOMA_POR_DEFECTO): ResultadoPrograma {
  const m = MENSAJES[idioma];
  const faltantes = CAMPOS_REQUERIDOS.filter((campo) => perfil[campo] === 'desconocido');
  if (faltantes.length > 0) {
    return resultadoFaltaDato('DS49', faltantes, REGLA_DS49, idioma);
  }

  const tramoRSH = perfil.tramoRSH as number;
  const ahorroUF = perfil.ahorroUF as number;
  const postulanteEdad = perfil.postulanteEdad as number;
  const integrantes = perfil.integrantesGrupoFamiliar as { edad: number; discapacidadCertificada: boolean }[];

  if (perfil.tienePropiedad === true) {
    return resultadoDecision('DS49', false, m.yaPropietario, REGLA_DS49);
  }
  if (postulanteEdad < 18) {
    return resultadoDecision('DS49', false, m.menorDeEdad, REGLA_DS49);
  }
  if (tramoRSH > 40) {
    return resultadoDecision('DS49', false, m.ds49.rshMaximo, REGLA_DS49);
  }
  if (ahorroUF < 10) {
    return resultadoDecision('DS49', false, m.ds49.ahorroMinimo, REGLA_DS49);
  }
  if (integrantes.length === 0 && perfil.excepcionPostulacionIndividualDS49 === 'desconocido') {
    return resultadoFaltaDato('DS49', ['excepcionPostulacionIndividualDS49'], REGLA_DS49, idioma);
  }
  if (integrantes.length === 0 && perfil.excepcionPostulacionIndividualDS49 !== true) {
    return resultadoDecision('DS49', false, m.ds49.postulacionIndividual, REGLA_DS49);
  }

  return resultadoDecision('DS49', true, m.ds49.cumple, REGLA_DS49);
}
