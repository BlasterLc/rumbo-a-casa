import type { Perfil } from './perfil.schema';
import type { ResultadoPrograma } from './tipos';
import { evaluarDS49 } from './ds49';
import { evaluarDS1 } from './ds1';
import { evaluarDS19 } from './ds19';
import { evaluarDS52 } from './ds52';

export function evaluarTodosLosProgramas(perfil: Perfil): ResultadoPrograma[] {
  return [evaluarDS49(perfil), evaluarDS1(perfil), evaluarDS19(perfil), evaluarDS52(perfil)];
}

export * from './tipos';
export * from './perfil.schema';
export { obtenerZonaDS1, type ZonaDS1 } from './zonas';
export { evaluarDS49 } from './ds49';
export { evaluarDS1 } from './ds1';
export { evaluarDS19 } from './ds19';
export { evaluarDS52 } from './ds52';
