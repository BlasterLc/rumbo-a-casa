import type {
  ContentBlock,
  ConverseCommandInput,
  ConverseCommandOutput,
  Message,
} from '@aws-sdk/client-bedrock-runtime';
import { IDIOMA_POR_DEFECTO, type Idioma, type Perfil } from '../rules-engine/index';
import { HERRAMIENTAS, ejecutarHerramienta } from './herramientas';
import { MENSAJES_CHAT } from './mensajes';
import { construirSystemPrompt } from './prompt';

export type InvocarConverse = (
  input: ConverseCommandInput,
  opciones?: { abortSignal?: AbortSignal },
) => Promise<ConverseCommandOutput>;

export const MAX_VUELTAS_HERRAMIENTAS = 6;
const REINTENTOS_RESPUESTA_VACIA = 1;

// Se mantiene exportada por compatibilidad: es la respuesta de respaldo en español.
export const RESPUESTA_RESPALDO = MENSAJES_CHAT.es.respaldo;

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
  const respaldo = MENSAJES_CHAT[idioma].respaldo;
  const inicio: Message[] = [...entrada.historial, { role: 'user', content: [{ text: entrada.mensaje }] }];
  const enCurso: Message[] = [...inicio];
  let reintentosVacios = 0;
  const textosPrevios: string[] = [];

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
      // A veces el modelo escribe su respuesta, llama a una herramienta y luego cierra el turno sin
      // texto (`end_turn` con contenido vacío): lo que ya escribió antes de la herramienta es su
      // respuesta, así que se usa. Reintentar con los mismos mensajes no sirve, sale vacío igual.
      const texto = textoDe(contenido) || textosPrevios.join('\n\n');
      if (!texto && reintentosVacios < REINTENTOS_RESPUESTA_VACIA) {
        reintentosVacios++;
        continue;
      }
      const respuesta = texto || respaldo;
      return {
        perfil,
        historial: [...enCurso, { role: 'assistant', content: [{ text: respuesta }] }],
        respuesta,
      };
    }

    const textoPrevio = textoDe(contenido);
    if (textoPrevio) textosPrevios.push(textoPrevio);
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
    historial: [...inicio, { role: 'assistant', content: [{ text: respaldo }] }],
    respuesta: respaldo,
  };
}
