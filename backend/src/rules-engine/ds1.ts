import type { Perfil } from './perfil.schema';
import { IDIOMA_POR_DEFECTO, resultadoDecision, resultadoFaltaDato, type Idioma, type ResultadoPrograma } from './tipos';
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

const conPuntosDeMiles = (n: number) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');

export function evaluarDS1(perfil: Perfil, _idioma: Idioma = IDIOMA_POR_DEFECTO): ResultadoPrograma {
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

    // For Tramo 3: if RSH exceeds the cap, check if income fallback could apply
    if (tramo.tramo === 3 && tramoRSH > rshMaxEfectivo) {
      // Income fallback is the only remaining path; verify we have the data
      const faltantesTramo3 = [];
      if (perfil.ingresoFamiliarMensualCLP === 'desconocido') faltantesTramo3.push('ingresoFamiliarMensualCLP');
      if (perfil.integrantesGrupoFamiliar === 'desconocido') faltantesTramo3.push('integrantesGrupoFamiliar');
      if (faltantesTramo3.length > 0) {
        return resultadoFaltaDato('DS1', faltantesTramo3, REGLA_DS1);
      }
    }

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

  // Ningún tramo calificó: se explica cuál es el obstáculo real, sin mezclar causas.
  const tramosPorAhorro = TRAMOS.filter((t) => ahorroUF >= t.ahorroMinUF);
  if (tramosPorAhorro.length === 0) {
    const { ahorroMinUF } = TRAMOS[0];
    return resultadoDecision(
      'DS1',
      false,
      `No alcanza el ahorro mínimo de DS1: hay ${ahorroUF} UF y el primer tramo pide ${ahorroMinUF} UF.`,
      REGLA_DS1,
      { causa: 'ahorro', ahorroMinimoUF: ahorroMinUF, faltanteUF: Math.round((ahorroMinUF - ahorroUF) * 100) / 100 },
    );
  }

  const mejor = tramosPorAhorro[tramosPorAhorro.length - 1];
  const rshMaximo = esAdultoMayor ? 90 : mejor.rshMax;
  let motivo = `Con ${ahorroUF} UF de ahorro correspondería el Tramo ${mejor.tramo} (RSH ≤${rshMaximo}%), pero el tramo RSH es ${tramoRSH}%`;
  if (mejor.tramo === 3 && tamanoGrupo !== undefined) {
    motivo += ` y el ingreso familiar supera el tope de $${conPuntosDeMiles(topeIngresoPorTamano(tamanoGrupo))} para ${tamanoGrupo} personas`;
  }
  return resultadoDecision('DS1', false, `${motivo}.`, REGLA_DS1, {
    causa: 'rsh',
    tramo: mejor.tramo,
    rshMaximo,
  });
}
