export type {
  Perfil,
  ResultadoPrograma,
  Programa,
  EstadoElegibilidad,
  Regla,
  Idioma,
} from '@rumbo/backend/rules-engine';
export type { PlanPrograma, Documento } from '@rumbo/backend/chat/papeles';

export {
  evaluarTodosLosProgramas,
  IDIOMAS,
  IDIOMA_POR_DEFECTO,
} from '@rumbo/backend/rules-engine';
export { generarPlanPapeles } from '@rumbo/backend/chat/papeles';
export { construirDemo } from '@rumbo/backend/chat/demo';

import type { Perfil } from '@rumbo/backend/rules-engine';

/** Perfil con todos los campos en 'desconocido', para una sesión nueva. Debe coincidir campo a campo con `PERFIL_VACIO` de `backend/src/chat/perfil.ts`. */
export const PERFIL_DESCONOCIDO: Perfil = {
  postulanteEdad: 'desconocido',
  region: 'desconocido',
  zonaEspecial: 'desconocido',
  tramoRSH: 'desconocido',
  tienePropiedad: 'desconocido',
  ahorroUF: 'desconocido',
  antiguedadCuentaAhorroMeses: 'desconocido',
  ingresoFamiliarMensualUF: 'desconocido',
  ingresoFamiliarMensualCLP: 'desconocido',
  integrantesGrupoFamiliar: 'desconocido',
  excepcionPostulacionIndividualDS49: 'desconocido',
  subsidioPrevio: 'desconocido',
  objetivo: 'desconocido',
};
