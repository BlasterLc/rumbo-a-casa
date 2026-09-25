import type { Perfil } from './perfil.schema';
import {
  IDIOMA_POR_DEFECTO,
  resultadoDecision,
  resultadoFaltaDato,
  type Idioma,
  type ResultadoPrograma,
} from './tipos';
import { MENSAJES } from './mensajes';

const REGLA_DS19 = {
  decreto: 'D.S. N°19 (V. y U.) de 2016, mod. D.S. N°16 (V. y U.) de 2020',
  fuente: 'docs/programas-subsidio.md, sección DS19',
  fechaConsulta: '2026-09-22',
};

const CAMPOS_REQUERIDOS = ['tienePropiedad', 'subsidioPrevio', 'tramoRSH'] as const;

const SUBSIDIOS_RUTA_A = ['DS49', 'DS1_T1', 'damnificado_2014'];

export function evaluarDS19(perfil: Perfil, idioma: Idioma = IDIOMA_POR_DEFECTO): ResultadoPrograma {
  const m = MENSAJES[idioma];
  const faltantes = CAMPOS_REQUERIDOS.filter((campo) => perfil[campo] === 'desconocido');
  if (faltantes.length > 0) {
    return resultadoFaltaDato('DS19', faltantes, REGLA_DS19, idioma);
  }

  if (perfil.tienePropiedad === true) {
    return resultadoDecision('DS19', false, m.yaPropietario, REGLA_DS19);
  }

  if (SUBSIDIOS_RUTA_A.includes(perfil.subsidioPrevio as string)) {
    return resultadoDecision('DS19', true, m.ds19.rutaA, REGLA_DS19, { ruta: 'A' });
  }

  const tramoRSH = perfil.tramoRSH as number;
  if (tramoRSH <= 90) {
    return resultadoDecision('DS19', true, m.ds19.rutaB, REGLA_DS19, { ruta: 'B' });
  }

  return resultadoDecision('DS19', false, m.ds19.sinHabilitacion, REGLA_DS19);
}
