import type { Perfil } from './perfil.schema';
import {
  IDIOMA_POR_DEFECTO,
  resultadoDecision,
  resultadoFaltaDato,
  type Idioma,
  type ResultadoPrograma,
} from './tipos';
import { MENSAJES } from './mensajes';
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

export function evaluarDS1(perfil: Perfil, idioma: Idioma = IDIOMA_POR_DEFECTO): ResultadoPrograma {
  const m = MENSAJES[idioma];
  const faltantes = CAMPOS_REQUERIDOS.filter((campo) => perfil[campo] === 'desconocido');
  if (faltantes.length > 0) {
    return resultadoFaltaDato('DS1', faltantes, REGLA_DS1, idioma);
  }

  const tramoRSH = perfil.tramoRSH as number;
  const ahorroUF = perfil.ahorroUF as number;
  const antiguedadMeses = perfil.antiguedadCuentaAhorroMeses as number;
  const postulanteEdad = perfil.postulanteEdad as number;
  const esAdultoMayor = postulanteEdad >= 60;

  if (perfil.tienePropiedad === true) {
    return resultadoDecision('DS1', false, m.yaPropietarioOSitio, REGLA_DS1);
  }
  if (postulanteEdad < 18) {
    return resultadoDecision('DS1', false, m.menorDeEdad, REGLA_DS1);
  }
  if (antiguedadMeses < 12) {
    return resultadoDecision('DS1', false, m.ds1.antiguedadCuenta, REGLA_DS1);
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

    // For Tramo 3: if RSH exceeds the cap, check if income fallback could apply
    if (tramo.tramo === 3 && tramoRSH > rshMaxEfectivo) {
      // Income fallback is the only remaining path; verify we have the data
      const faltantesTramo3 = [];
      if (perfil.ingresoFamiliarMensualCLP === 'desconocido') faltantesTramo3.push('ingresoFamiliarMensualCLP');
      if (perfil.integrantesGrupoFamiliar === 'desconocido') faltantesTramo3.push('integrantesGrupoFamiliar');
      if (faltantesTramo3.length > 0) {
        return resultadoFaltaDato('DS1', faltantesTramo3, REGLA_DS1, idioma);
      }
    }

    const califica = tramoRSH <= rshMaxEfectivo || (tramo.tramo === 3 && cumpleTramo3PorIngreso);
    if (califica) {
      const zona = obtenerZonaDS1(perfil);
      return resultadoDecision(
        'DS1',
        true,
        m.ds1.califica(tramo.tramo, tramo.ahorroMinUF, rshMaxEfectivo),
        REGLA_DS1,
        { tramo: tramo.tramo, zona },
      );
    }
  }

  // Ningún tramo calificó: se explica cuál es el obstáculo real, sin mezclar causas.
  const tramosPorAhorro = TRAMOS.filter((t) => ahorroUF >= t.ahorroMinUF);
  if (tramosPorAhorro.length === 0) {
    const { ahorroMinUF } = TRAMOS[0];
    return resultadoDecision(
      'DS1',
      false,
      m.ds1.sinAhorro(ahorroUF, ahorroMinUF),
      REGLA_DS1,
      { causa: 'ahorro', ahorroMinimoUF: ahorroMinUF, faltanteUF: Math.round((ahorroMinUF - ahorroUF) * 100) / 100 },
    );
  }

  const mejor = tramosPorAhorro[tramosPorAhorro.length - 1];
  const rshMaximo = esAdultoMayor ? 90 : mejor.rshMax;
  const ingreso =
    mejor.tramo === 3 && tamanoGrupo !== undefined
      ? { topeCLP: topeIngresoPorTamano(tamanoGrupo), personas: tamanoGrupo }
      : undefined;
  return resultadoDecision(
    'DS1',
    false,
    m.ds1.rshExcede(ahorroUF, mejor.tramo, rshMaximo, tramoRSH, ingreso),
    REGLA_DS1,
    { causa: 'rsh', tramo: mejor.tramo, rshMaximo },
  );
}
