import type { Perfil } from './perfil.schema';
import { IDIOMA_POR_DEFECTO, type Idioma, type ResultadoPrograma } from './tipos';
import { evaluarDS49 } from './ds49';
import { evaluarDS1 } from './ds1';
import { evaluarDS19 } from './ds19';
import { evaluarDS52 } from './ds52';

export function evaluarTodosLosProgramas(
  perfil: Perfil,
  idioma: Idioma = IDIOMA_POR_DEFECTO,
): ResultadoPrograma[] {
  return [
    evaluarDS49(perfil, idioma),
    evaluarDS1(perfil, idioma),
    evaluarDS19(perfil, idioma),
    evaluarDS52(perfil, idioma),
  ];
}

export * from './tipos';
export * from './perfil.schema';
export { obtenerZonaDS1, type ZonaDS1 } from './zonas';
export { evaluarDS49 } from './ds49';
export { evaluarDS1 } from './ds1';
export { evaluarDS19 } from './ds19';
export { evaluarDS52 } from './ds52';
