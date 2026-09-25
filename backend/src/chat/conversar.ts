import type {
  ContentBlock,
  ConverseCommandInput,
  ConverseCommandOutput,
  Message,
} from '@aws-sdk/client-bedrock-runtime';
import { IDIOMA_POR_DEFECTO, type Idioma, type Perfil } from '../rules-engine/index';
import { HERRAMIENTAS, ejecutarHerramienta } from './herramientas';
import { construirSystemPrompt } from './prompt';

export type InvocarConverse = (
  input: ConverseCommandInput,
  opciones?: { abortSignal?: AbortSignal },
) => Promise<ConverseCommandOutput>;

export const MAX_VUELTAS_HERRAMIENTAS = 6;

export const RESPUESTA_RESPALDO =
  'Perdón, me enredé procesando tu mensaje. ¿Me lo puedes repetir con otras palabras?';

// Se mantiene exportado por compatibilidad: es el prompt en español.
export const SYSTEM_PROMPT = construirSystemPrompt('es');

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
      system: [{ text: construirSystemPrompt(idioma) }],
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
