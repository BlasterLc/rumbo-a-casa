import type { Perfil } from './perfil.schema';
import { resultadoDecision, resultadoFaltaDato, type ResultadoPrograma } from './tipos';
import { obtenerZonaDS1 } from './zonas';

const REGLA_DS1 = {
  decreto: 'D.S. N°1 de 2011, Res. Ex. N°669/2026',
  fuente: 'docs/programas-subsidio.md, sección DS1',
  fechaConsulta: '2026-09-22',
};

const CAMPOS_REQUERIDOS = [
  'tramoRSH', 'tienePropiedad', 'ahorroUF', 'antiguedadCuentaAhorroMeses', 'postulanteEdad',
] as const;

interface TramoDS1 {
  tramo: 1 | 2 | 3;
  ahorroMinUF: number;
  rshMax: number;
}

const TRAMOS: TramoDS1[] = [
  { tramo: 1, ahorroMinUF: 30, rshMax: 60 },
  { tramo: 2, ahorroMinUF: 40, rshMax: 80 },
  { tramo: 3, ahorroMinUF: 80, rshMax: 90 },
];

const TOPES_INGRESO_TRAMO3_CLP: Record<number, number> = {
  1: 2_589_712,
  2: 3_386_546,
  3: 3_705_280,
};
const TOPE_INGRESO_TRAMO3_4_MAS_CLP = 4_024_014;

function topeIngresoPorTamano(tamanoGrupo: number): number {
  return TOPES_INGRESO_TRAMO3_CLP[tamanoGrupo] ?? TOPE_INGRESO_TRAMO3_4_MAS_CLP;
}

export function evaluarDS1(perfil: Perfil): ResultadoPrograma {
  const faltantes = CAMPOS_REQUERIDOS.filter((campo) => perfil[campo] === 'desconocido');
  if (faltantes.length > 0) {
    return resultadoFaltaDato('DS1', faltantes, REGLA_DS1);
  }

  const tramoRSH = perfil.tramoRSH as number;
  const ahorroUF = perfil.ahorroUF as number;
  const antiguedadMeses = perfil.antiguedadCuentaAhorroMeses as number;
  const postulanteEdad = perfil.postulanteEdad as number;
  const esAdultoMayor = postulanteEdad >= 60;

  if (perfil.tienePropiedad === true) {
    return resultadoDecision('DS1', false, 'Ya es propietario de una vivienda o de un sitio con destino habitacional.', REGLA_DS1);
  }
  if (postulanteEdad < 18) {
    return resultadoDecision('DS1', false, 'El postulante debe ser mayor de 18 años.', REGLA_DS1);
  }
  if (antiguedadMeses < 12) {
    return resultadoDecision('DS1', false, 'La cuenta de ahorro debe tener al menos 12 meses de antigüedad.', REGLA_DS1);
  }

  const tamanoGrupo =
    perfil.integrantesGrupoFamiliar === 'desconocido'
      ? undefined
      : perfil.integrantesGrupoFamiliar.length + 1;

  const cumpleTramo3PorIngreso =
    perfil.ingresoFamiliarMensualCLP !== 'desconocido' &&
    tamanoGrupo !== undefined &&
    perfil.ingresoFamiliarMensualCLP <= topeIngresoPorTamano(tamanoGrupo);

  for (const tramo of TRAMOS) {
    if (ahorroUF < tramo.ahorroMinUF) continue;
    const rshMaxEfectivo = esAdultoMayor ? 90 : tramo.rshMax;
    const califica = tramoRSH <= rshMaxEfectivo || (tramo.tramo === 3 && cumpleTramo3PorIngreso);
    if (califica) {
      const zona = obtenerZonaDS1(perfil);
      return resultadoDecision(
        'DS1',
        true,
        `Califica para el Tramo ${tramo.tramo} de DS1 (ahorro ≥${tramo.ahorroMinUF} UF, RSH ≤${rshMaxEfectivo}%).`,
        REGLA_DS1,
        { tramo: tramo.tramo, zona },
      );
    }
  }

  return resultadoDecision(
    'DS1',
    false,
    'No cumple el ahorro mínimo ni el tramo RSH (o el tope de ingreso familiar) de ningún tramo de DS1.',
    REGLA_DS1,
  );
}
