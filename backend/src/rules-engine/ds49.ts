import type { Perfil } from './perfil.schema';
import { IDIOMA_POR_DEFECTO, resultadoDecision, resultadoFaltaDato, type Idioma, type ResultadoPrograma } from './tipos';

const REGLA_DS49 = {
  decreto: 'D.S. N°49 (V. y U.) de 2011',
  fuente: 'docs/programas-subsidio.md, sección DS49',
  fechaConsulta: '2026-09-22',
};

const CAMPOS_REQUERIDOS = [
  'tramoRSH', 'tienePropiedad', 'ahorroUF', 'postulanteEdad', 'integrantesGrupoFamiliar',
] as const;

export function evaluarDS49(perfil: Perfil, _idioma: Idioma = IDIOMA_POR_DEFECTO): ResultadoPrograma {
  const faltantes = CAMPOS_REQUERIDOS.filter((campo) => perfil[campo] === 'desconocido');
  if (faltantes.length > 0) {
    return resultadoFaltaDato('DS49', faltantes, REGLA_DS49);
  }

  const tramoRSH = perfil.tramoRSH as number;
  const ahorroUF = perfil.ahorroUF as number;
  const postulanteEdad = perfil.postulanteEdad as number;
  const integrantes = perfil.integrantesGrupoFamiliar as { edad: number; discapacidadCertificada: boolean }[];

  if (perfil.tienePropiedad === true) {
    return resultadoDecision('DS49', false, 'Ya es propietario de una vivienda.', REGLA_DS49);
  }
  if (postulanteEdad < 18) {
    return resultadoDecision('DS49', false, 'El postulante debe ser mayor de 18 años.', REGLA_DS49);
  }
  if (tramoRSH > 40) {
    return resultadoDecision('DS49', false, 'El tramo RSH debe ser 40% o menos.', REGLA_DS49);
  }
  if (ahorroUF < 10) {
    return resultadoDecision('DS49', false, 'Se requiere un ahorro mínimo de 10 UF.', REGLA_DS49);
  }
  if (integrantes.length === 0 && perfil.excepcionPostulacionIndividualDS49 === 'desconocido') {
    return resultadoFaltaDato('DS49', ['excepcionPostulacionIndividualDS49'], REGLA_DS49);
  }
  if (integrantes.length === 0 && perfil.excepcionPostulacionIndividualDS49 !== true) {
    return resultadoDecision(
      'DS49',
      false,
      'Las postulaciones individuales requieren una excepción: adulto mayor, viudez, discapacidad certificada, indígena reconocido, o incluido en el Informe Valech.',
      REGLA_DS49,
    );
  }

  return resultadoDecision(
    'DS49',
    true,
    'Cumple los requisitos de DS49: RSH ≤40%, ahorro ≥10 UF, no propietario, grupo familiar acreditado (o excepción de postulación individual).',
    REGLA_DS49,
  );
}
