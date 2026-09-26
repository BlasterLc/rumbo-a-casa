import type { Perfil, ResultadoPrograma } from '../../types/dominio';

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

/**
 * El paso activo sale de lo que el motor todavía necesita (`camposFaltantes` de cada resultado),
 * no de exigir los 13 campos del perfil: hay campos opcionales según el caso (la excepción de
 * postulación individual solo importa sin otros integrantes) o alternativos entre sí (ingreso en
 * CLP o en UF), y con ellos sin conocer el motor igual puede dar los cuatro veredictos.
 * Devuelve el primer grupo con un campo que aún se necesita; si el motor ya no pide nada,
 * el último. Sin resultados todavía (sesión nueva) es el primero.
 */
export function pasoActivo(perfil: Perfil, resultados: ResultadoPrograma[]): number {
  if (resultados.length === 0) return 0;
  const pendientes = new Set(
    resultados.flatMap((r) => (r.camposFaltantes ?? []).filter((c) => perfil[c as keyof Perfil] === 'desconocido')),
  );
  const indice = GRUPOS_ENTREVISTA.findIndex((g) => g.campos.some((c) => pendientes.has(c)));
  return indice === -1 ? GRUPOS_ENTREVISTA.length - 1 : indice;
}
