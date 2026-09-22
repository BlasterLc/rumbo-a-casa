import type { Perfil } from './perfil.schema';

export type ZonaDS1 = 'extremo_norte' | 'regular' | 'extremo_sur_insular';

const REGIONES_EXTREMO_NORTE = ['Arica y Parinacota', 'Tarapacá', 'Antofagasta', 'Atacama'];
const REGIONES_EXTREMO_SUR = ['Aysén', 'Magallanes'];

export function obtenerZonaDS1(
  perfil: Pick<Perfil, 'region' | 'zonaEspecial'>,
): ZonaDS1 | 'desconocido' {
  if (perfil.region === 'desconocido' || perfil.zonaEspecial === 'desconocido') {
    return 'desconocido';
  }
  if (perfil.zonaEspecial === 'chiloe') return 'extremo_norte';
  if (perfil.zonaEspecial === 'palena' || perfil.zonaEspecial === 'isla_de_pascua' || perfil.zonaEspecial === 'juan_fernandez') {
    return 'extremo_sur_insular';
  }
  if (REGIONES_EXTREMO_NORTE.includes(perfil.region)) return 'extremo_norte';
  if (REGIONES_EXTREMO_SUR.includes(perfil.region)) return 'extremo_sur_insular';
  return 'regular';
}
