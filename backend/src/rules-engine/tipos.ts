export type ConDesconocido<T> = T | 'desconocido';

export const IDIOMAS = ['es', 'en'] as const;
export type Idioma = (typeof IDIOMAS)[number];
export const IDIOMA_POR_DEFECTO: Idioma = 'es';

export type EstadoElegibilidad = 'elegible' | 'no_elegible' | 'falta_dato';

export interface Regla {
  decreto: string;
  fuente: string;
  fechaConsulta: string;
}

export type Programa = 'DS49' | 'DS1' | 'DS19' | 'DS52';

export interface ResultadoPrograma {
  programa: Programa;
  estado: EstadoElegibilidad;
  motivo: string;
  camposFaltantes?: string[];
  regla: Regla;
  detalle?: Record<string, unknown>;
}

export function resultadoFaltaDato(
  programa: Programa,
  camposFaltantes: string[],
  regla: Regla,
): ResultadoPrograma {
  return {
    programa,
    estado: 'falta_dato',
    motivo: `Faltan datos para evaluar ${programa}.`,
    camposFaltantes,
    regla,
  };
}

export function resultadoDecision(
  programa: Programa,
  elegible: boolean,
  motivo: string,
  regla: Regla,
  detalle?: Record<string, unknown>,
): ResultadoPrograma {
  return { programa, estado: elegible ? 'elegible' : 'no_elegible', motivo, regla, detalle };
}
