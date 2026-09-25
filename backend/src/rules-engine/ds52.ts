import type { Perfil } from './perfil.schema';
import {
  IDIOMA_POR_DEFECTO,
  resultadoDecision,
  resultadoFaltaDato,
  type Idioma,
  type ResultadoPrograma,
} from './tipos';
import { MENSAJES } from './mensajes';

const REGLA_DS52 = {
  decreto: 'D.S. N°52 de 2013, Res. Ex. N°809/2026 (Región Metropolitana)',
  fuente: 'docs/programas-subsidio.md, sección DS52',
  fechaConsulta: '2026-09-22',
};

const CAMPOS_REQUERIDOS = [
  'tienePropiedad', 'subsidioPrevio', 'tramoRSH', 'ahorroUF',
  'ingresoFamiliarMensualUF', 'postulanteEdad', 'integrantesGrupoFamiliar',
] as const;

const INGRESO_MIN_UF = 7;
const INGRESO_MAX_BASE_UF = 25;
const INGRESO_MAX_INCREMENTO_UF = 8;

function decidir(perfil: Perfil, idioma: Idioma, elegible: boolean, motivo: string): ResultadoPrograma {
  const detalle =
    perfil.region === 'Metropolitana' ? undefined : { nota: MENSAJES[idioma].ds52.notaFueraDeRM };
  return resultadoDecision('DS52', elegible, motivo, REGLA_DS52, detalle);
}

export function evaluarDS52(perfil: Perfil, idioma: Idioma = IDIOMA_POR_DEFECTO): ResultadoPrograma {
  const m = MENSAJES[idioma];
  const faltantes = CAMPOS_REQUERIDOS.filter((campo) => perfil[campo] === 'desconocido');
  if (faltantes.length > 0) {
    return resultadoFaltaDato('DS52', faltantes, REGLA_DS52, idioma);
  }

  if (perfil.tienePropiedad === true) {
    return decidir(perfil, idioma, false, m.yaPropietario);
  }
  if (perfil.subsidioPrevio !== 'ninguno') {
    return decidir(perfil, idioma, false, m.ds52.subsidioPrevio);
  }

  const postulanteEdad = perfil.postulanteEdad as number;
  const esAdultoMayor = postulanteEdad >= 60;
  const integrantes = perfil.integrantesGrupoFamiliar as { edad: number; discapacidadCertificada: boolean }[];

  if (postulanteEdad < 18) {
    return decidir(perfil, idioma, false, m.menorDeEdad);
  }
  if (!esAdultoMayor && integrantes.length === 0) {
    return decidir(perfil, idioma, false, m.ds52.sinNucleo);
  }

  const tramoRSH = perfil.tramoRSH as number;
  if (tramoRSH > 70) {
    return decidir(perfil, idioma, false, m.ds52.rshMaximo);
  }

  const ahorroUF = perfil.ahorroUF as number;
  if (ahorroUF < 4) {
    return decidir(perfil, idioma, false, m.ds52.ahorroMinimo);
  }

  const tamanoGrupo = integrantes.length + 1;
  const ingresoMaxUF = INGRESO_MAX_BASE_UF + Math.max(0, tamanoGrupo - 3) * INGRESO_MAX_INCREMENTO_UF;
  const ingresoUF = perfil.ingresoFamiliarMensualUF as number;
  if (ingresoUF < INGRESO_MIN_UF || ingresoUF > ingresoMaxUF) {
    return decidir(
      perfil,
      idioma,
      false,
      m.ds52.ingresoFueraDeRango(INGRESO_MIN_UF, ingresoMaxUF, tamanoGrupo),
    );
  }

  return decidir(perfil, idioma, true, m.ds52.cumple);
}
