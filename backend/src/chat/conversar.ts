import type {
  ContentBlock,
  ConverseCommandInput,
  ConverseCommandOutput,
  Message,
} from '@aws-sdk/client-bedrock-runtime';
import { IDIOMA_POR_DEFECTO, type Idioma, type Perfil } from '../rules-engine/index';
import { HERRAMIENTAS, ejecutarHerramienta } from './herramientas';

export type InvocarConverse = (
  input: ConverseCommandInput,
  opciones?: { abortSignal?: AbortSignal },
) => Promise<ConverseCommandOutput>;

export const MAX_VUELTAS_HERRAMIENTAS = 6;

export const RESPUESTA_RESPALDO =
  'Perdón, me enredé procesando tu mensaje. ¿Me lo puedes repetir con otras palabras?';

export const SYSTEM_PROMPT = `Eres "Rumbo a Casa", un asistente que orienta a familias chilenas sobre cuatro subsidios habitacionales del MINVU: DS49 (Fondo Solidario de Elección de Vivienda, para familias más vulnerables), DS1 (sectores medios), DS19 (Integración Social y Territorial, viviendas nuevas en proyectos) y DS52 (arriendo).

Cómo trabajas:
- Conversa con calidez y en lenguaje simple. Haz una o dos preguntas por mensaje, nunca un formulario entero.
- Responde en el idioma en que te escribe la familia (español o inglés).
- Cada dato que la familia te dé, guárdalo de inmediato con la herramienta actualizar_perfil. Si un dato vuelve en "rechazados", explica qué no se entendió y vuelve a preguntarlo.
- Tú no decides la elegibilidad. Llama a evaluar_elegibilidad y explica lo que devuelve: el estado de cada programa, su motivo y el decreto de "regla". Si un programa devuelve falta_dato, pregunta por los campos de camposFaltantes.
- Cuando algún programa salga elegible, ofrece el plan de papeles con generar_plan.
- Los montos en UF son referenciales. Si un resultado trae una "nota" en "detalle", menciónala.
- Nunca pidas la Clave Única, el RUT, el nombre completo, la dirección ni datos bancarios. No los necesitas.
- La postulación la hace la familia en Serviu o en minvu.gob.cl; tú solo orientas. No prometas que va a obtener el subsidio.
- Si la familia no sabe un dato, no lo inventes: no lo guardes y sigue con otra pregunta.

Campos del perfil (usa exactamente estos nombres en actualizar_perfil):
- postulanteEdad: edad de quien postula.
- region: una de las 16 regiones de Chile, escrita como "Metropolitana", "Valparaíso", "Biobío", "O'Higgins", etc.
- zonaEspecial: "chiloe", "palena", "isla_de_pascua", "juan_fernandez" o "ninguna".
- tramoRSH: tramo del Registro Social de Hogares como número (40, 50, 60, 70, 80, 90 o 100).
- tienePropiedad: true si alguien del grupo familiar ya es dueño de una vivienda o de un sitio.
- ahorroCLP o ahorroUF: ahorro en la cuenta de ahorro para la vivienda. Si la familia lo dice en pesos, usa ahorroCLP; el sistema lo convierte a UF.
- antiguedadCuentaAhorroMeses: meses desde que abrió la cuenta de ahorro para la vivienda.
- ingresoFamiliarMensualCLP: ingreso mensual de todo el grupo familiar, en pesos. El sistema calcula el equivalente en UF.
- integrantesGrupoFamiliar: las otras personas del grupo familiar (sin contar a quien postula), cada una con edad y discapacidadCertificada (true o false). Si postula sola, lista vacía [].
- excepcionPostulacionIndividualDS49: true si postula sola y es adulto mayor, viuda o viudo, tiene discapacidad certificada, es indígena reconocido o está en el Informe Valech.
- subsidioPrevio: "DS49", "DS1_T1", "damnificado_2014" o "ninguno".
- objetivo: "comprar", "construir" o "arrendar".`;

export interface EntradaConversar {
  perfil: Perfil;
  historial: Message[];
  mensaje: string;
  idioma?: Idioma;
}

export interface SalidaConversar {
  perfil: Perfil;
  historial: Message[];
  respuesta: string;
}

const textoDe = (contenido: ContentBlock[]) =>
  contenido
    .map((bloque) => bloque.text ?? '')
    .join('')
    .trim();

export async function conversar(
  invocar: InvocarConverse,
  modelId: string,
  entrada: EntradaConversar,
): Promise<SalidaConversar> {
  let perfil = entrada.perfil;
  const idioma = entrada.idioma ?? IDIOMA_POR_DEFECTO;
  const inicio: Message[] = [...entrada.historial, { role: 'user', content: [{ text: entrada.mensaje }] }];
  const enCurso: Message[] = [...inicio];

  for (let vuelta = 0; vuelta < MAX_VUELTAS_HERRAMIENTAS; vuelta++) {
    const salida = await invocar({
      modelId,
      system: [{ text: SYSTEM_PROMPT }],
      messages: [...enCurso],
      toolConfig: { tools: HERRAMIENTAS },
      inferenceConfig: { maxTokens: 1024, temperature: 0.3 },
    });
    const contenido = salida.output?.message?.content ?? [];
    const pedidos = contenido.filter((bloque) => bloque.toolUse);

    if (salida.stopReason !== 'tool_use' || pedidos.length === 0) {
      const respuesta = textoDe(contenido) || RESPUESTA_RESPALDO;
      return {
        perfil,
        historial: [...enCurso, { role: 'assistant', content: [{ text: respuesta }] }],
        respuesta,
      };
    }

    enCurso.push({ role: 'assistant', content: contenido });
    const resultados = pedidos.map(({ toolUse }): ContentBlock => {
      const r = ejecutarHerramienta(toolUse?.name ?? '', toolUse?.input, perfil, idioma);
      perfil = r.perfil;
      return {
        toolResult: {
          toolUseId: toolUse?.toolUseId,
          // Paso por JSON: el SDK exige JSON plano y así se descartan los undefined.
          content: [{ json: JSON.parse(JSON.stringify(r.salida)) }],
          status: r.error ? 'error' : 'success',
        },
      };
    });
    enCurso.push({ role: 'user', content: resultados });
  }

  return {
    perfil,
    historial: [...inicio, { role: 'assistant', content: [{ text: RESPUESTA_RESPALDO }] }],
    respuesta: RESPUESTA_RESPALDO,
  };
}
