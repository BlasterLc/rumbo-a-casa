import type { Perfil } from './perfil.schema';
import { IDIOMA_POR_DEFECTO, resultadoDecision, resultadoFaltaDato, type Idioma, type ResultadoPrograma } from './tipos';

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

const NOTA_FUERA_DE_RM =
  'Los requisitos de ingreso y los montos corresponden al llamado de la Región Metropolitana; pueden variar según tu región o comuna, verifica en minvu.gob.cl.';

function decidir(perfil: Perfil, elegible: boolean, motivo: string): ResultadoPrograma {
  const detalle = perfil.region === 'Metropolitana' ? undefined : { nota: NOTA_FUERA_DE_RM };
  return resultadoDecision('DS52', elegible, motivo, REGLA_DS52, detalle);
}

export function evaluarDS52(perfil: Perfil, _idioma: Idioma = IDIOMA_POR_DEFECTO): ResultadoPrograma {
  const faltantes = CAMPOS_REQUERIDOS.filter((campo) => perfil[campo] === 'desconocido');
  if (faltantes.length > 0) {
    return resultadoFaltaDato('DS52', faltantes, REGLA_DS52);
  }

  if (perfil.tienePropiedad === true) {
    return decidir(perfil, false, 'Ya cuenta con vivienda propia.');
  }
  if (perfil.subsidioPrevio !== 'ninguno') {
    return decidir(perfil, false, 'Ya cuenta con un subsidio habitacional anterior.');
  }

  const postulanteEdad = perfil.postulanteEdad as number;
  const esAdultoMayor = postulanteEdad >= 60;
  const integrantes = perfil.integrantesGrupoFamiliar as { edad: number; discapacidadCertificada: boolean }[];

  if (postulanteEdad < 18) {
    return decidir(perfil, false, 'El postulante debe ser mayor de 18 años.');
  }
  if (!esAdultoMayor && integrantes.length === 0) {
    return decidir(
      perfil,
      false,
      'Debe postular al menos con cónyuge, conviviente civil, conviviente o hijo, salvo mayores de 60 años.',
    );
  }

  const tramoRSH = perfil.tramoRSH as number;
  if (tramoRSH > 70) {
    return decidir(perfil, false, 'El tramo RSH debe ser 70% o menos.');
  }

  const ahorroUF = perfil.ahorroUF as number;
  if (ahorroUF < 4) {
    return decidir(perfil, false, 'Se requiere un ahorro mínimo de 4 UF.');
  }

  const tamanoGrupo = integrantes.length + 1;
  const ingresoMaxUF = INGRESO_MAX_BASE_UF + Math.max(0, tamanoGrupo - 3) * INGRESO_MAX_INCREMENTO_UF;
  const ingresoUF = perfil.ingresoFamiliarMensualUF as number;
  if (ingresoUF < INGRESO_MIN_UF || ingresoUF > ingresoMaxUF) {
    return decidir(
      perfil,
      false,
      `El ingreso familiar mensual debe estar entre ${INGRESO_MIN_UF} y ${ingresoMaxUF} UF para un grupo de ${tamanoGrupo} personas.`,
    );
  }

  return decidir(
    perfil,
    true,
    'Cumple los requisitos de DS52: RSH ≤70%, ahorro ≥4 UF, ingreso dentro del rango, no propietario ni con subsidio previo.',
  );
}
