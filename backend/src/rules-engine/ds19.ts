import type { Perfil } from './perfil.schema';
import { IDIOMA_POR_DEFECTO, resultadoDecision, resultadoFaltaDato, type Idioma, type ResultadoPrograma } from './tipos';

const REGLA_DS19 = {
  decreto: 'D.S. N°19 (V. y U.) de 2016, mod. D.S. N°16 (V. y U.) de 2020',
  fuente: 'docs/programas-subsidio.md, sección DS19',
  fechaConsulta: '2026-09-22',
};

const CAMPOS_REQUERIDOS = ['tienePropiedad', 'subsidioPrevio', 'tramoRSH'] as const;

const SUBSIDIOS_RUTA_A = ['DS49', 'DS1_T1', 'damnificado_2014'];

export function evaluarDS19(perfil: Perfil, _idioma: Idioma = IDIOMA_POR_DEFECTO): ResultadoPrograma {
  const faltantes = CAMPOS_REQUERIDOS.filter((campo) => perfil[campo] === 'desconocido');
  if (faltantes.length > 0) {
    return resultadoFaltaDato('DS19', faltantes, REGLA_DS19);
  }

  if (perfil.tienePropiedad === true) {
    return resultadoDecision('DS19', false, 'Ya es propietario de una vivienda.', REGLA_DS19);
  }

  if (SUBSIDIOS_RUTA_A.includes(perfil.subsidioPrevio as string)) {
    return resultadoDecision(
      'DS19',
      true,
      'Ruta A: ya cuenta con un subsidio previo (DS49, DS1 Tramo 1 o damnificado desde 2014), puede acceder a una vivienda de 1.200-1.400 UF pagada en su totalidad, sin crédito hipotecario.',
      REGLA_DS19,
      { ruta: 'A' },
    );
  }

  const tramoRSH = perfil.tramoRSH as number;
  if (tramoRSH <= 90) {
    return resultadoDecision(
      'DS19',
      true,
      'Ruta B: sin subsidio previo, RSH ≤90% y no propietario. El ahorro mínimo depende del proyecto específico al que postule.',
      REGLA_DS19,
      { ruta: 'B' },
    );
  }

  return resultadoDecision(
    'DS19',
    false,
    'No tiene un subsidio previo habilitante (Ruta A) y su tramo RSH supera el 90% exigido para la Ruta B.',
    REGLA_DS19,
  );
}
