import { z } from 'zod';
import type { Tool } from '@aws-sdk/client-bedrock-runtime';
import { IDIOMA_POR_DEFECTO, PerfilSchema, evaluarTodosLosProgramas, type Idioma, type Perfil } from '../rules-engine/index';
import { aplicarCambios } from './perfil';
import { generarPlanPapeles } from './papeles';

const CambiosPerfilSchema = PerfilSchema.partial().extend({
  ahorroCLP: z.number().min(0).optional(),
});

// inputSchema.json espera JSON plano: se quita $schema y se normaliza con un paso por JSON.
const esquemaJson = (esquema: z.ZodType) => {
  const { $schema: _omitido, ...resto } = z.toJSONSchema(esquema) as Record<string, unknown>;
  return JSON.parse(JSON.stringify(resto));
};

const SIN_PARAMETROS = { type: 'object', properties: {} };

export const HERRAMIENTAS: Tool[] = [
  {
    toolSpec: {
      name: 'actualizar_perfil',
      description:
        'Guarda uno o más datos del perfil de la familia apenas los menciona. Envía solo los campos que conoces. Devuelve los campos aceptados y los rechazados con el motivo.',
      inputSchema: { json: esquemaJson(CambiosPerfilSchema) },
    },
  },
  {
    toolSpec: {
      name: 'evaluar_elegibilidad',
      description:
        'Evalúa los 4 programas (DS49, DS1, DS19, DS52) con el perfil guardado. Devuelve, por programa, estado (elegible, no_elegible o falta_dato), motivo, campos faltantes y la regla citada.',
      inputSchema: { json: SIN_PARAMETROS },
    },
  },
  {
    toolSpec: {
      name: 'generar_plan',
      description:
        'Devuelve la lista de papeles a reunir para cada programa en que la familia sale elegible, con la fuente de cada lista.',
      inputSchema: { json: SIN_PARAMETROS },
    },
  },
];

export interface ResultadoHerramienta {
  perfil: Perfil;
  salida: Record<string, unknown>;
  error: boolean;
}

export function ejecutarHerramienta(
  nombre: string,
  input: unknown,
  perfil: Perfil,
  idioma: Idioma = IDIOMA_POR_DEFECTO,
): ResultadoHerramienta {
  switch (nombre) {
    case 'actualizar_perfil': {
      if (typeof input !== 'object' || input === null || Array.isArray(input)) {
        return {
          perfil,
          salida: { error: 'La entrada debe ser un objeto con campos del perfil.' },
          error: true,
        };
      }
      const { perfil: nuevo, aceptados, rechazados } = aplicarCambios(perfil, input as Record<string, unknown>);
      return { perfil: nuevo, salida: { aceptados, rechazados }, error: false };
    }
    case 'evaluar_elegibilidad':
      return { perfil, salida: { resultados: evaluarTodosLosProgramas(perfil, idioma) }, error: false };
    case 'generar_plan':
      return {
        perfil,
        salida: { plan: generarPlanPapeles(evaluarTodosLosProgramas(perfil, idioma), idioma) },
        error: false,
      };
    default:
      return { perfil, salida: { error: `Herramienta desconocida: ${nombre}` }, error: true };
  }
}
