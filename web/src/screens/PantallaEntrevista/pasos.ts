import type { Perfil } from '../../types/dominio';

export type ClavePasoEntrevista = 'familia' | 'vivienda' | 'ahorro' | 'ingreso' | 'region';

/**
 * Agrupa los 13 campos del perfil en 5 pasos del mundo de la persona, no del motor de reglas.
 * Debe cubrir cada campo de `Perfil` exactamente una vez — ver el test de este archivo. Guarda
 * una `clave`, no el nombre ya traducido: este archivo es lógica pura, sin acceso a `useT()`
 * (Task 2) — `PantallaEntrevista` la traduce vía `t.pantallas.entrevista.pasos[clave]`.
 */
export const GRUPOS_ENTREVISTA: ReadonlyArray<{ clave: ClavePasoEntrevista; campos: (keyof Perfil)[] }> = [
  {
    clave: 'familia',
    campos: ['postulanteEdad', 'integrantesGrupoFamiliar', 'excepcionPostulacionIndividualDS49'],
  },
  { clave: 'vivienda', campos: ['tienePropiedad', 'objetivo', 'subsidioPrevio'] },
  { clave: 'ahorro', campos: ['ahorroUF', 'antiguedadCuentaAhorroMeses'] },
  { clave: 'ingreso', campos: ['ingresoFamiliarMensualCLP', 'ingresoFamiliarMensualUF', 'tramoRSH'] },
  { clave: 'region', campos: ['region', 'zonaEspecial'] },
];

/** El primer grupo con un campo todavía 'desconocido'; si todos están completos, el último. */
export function pasoActivo(perfil: Perfil): number {
  const indice = GRUPOS_ENTREVISTA.findIndex((g) => g.campos.some((c) => perfil[c] === 'desconocido'));
  return indice === -1 ? GRUPOS_ENTREVISTA.length - 1 : indice;
}
