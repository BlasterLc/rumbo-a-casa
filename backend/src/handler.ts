import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
} from 'aws-lambda';
import { z } from 'zod';
import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { IDIOMAS, IDIOMA_POR_DEFECTO, evaluarTodosLosProgramas } from './rules-engine/index';
import { conversar, type InvocarConverse, type SalidaConversar } from './chat/conversar';
import { generarPlanPapeles } from './chat/papeles';
import { construirDemo } from './chat/demo';
import { RepositorioDynamo, type RepositorioSesiones } from './chat/sesion-repositorio';

export const MAX_MENSAJES_POR_SESION = 40;
export const MODELO_POR_DEFECTO = 'us.anthropic.claude-haiku-4-5-20251001-v1:0';

// Tiempo total que puede consumir Bedrock en un mensaje (todas las vueltas del bucle
// de herramientas juntas). La Lambda muere a los 28 s (ver infra/lib/rumbo-stack.ts):
// pasado este presupuesto se corta con un 503 limpio en vez de un 502 crudo.
export const PRESUPUESTO_BEDROCK_MS = 24_000;

export interface DependenciasChat {
  repositorio: RepositorioSesiones;
  invocar: InvocarConverse;
  modelId: string;
  presupuestoMs?: number;
}

type Resultado = APIGatewayProxyStructuredResultV2;

const json = (statusCode: number, body: unknown): Resultado => ({
  statusCode,
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(body),
});

const SolicitudChat = z.object({
  sessionId: z.uuid(),
  mensaje: z.string().trim().min(1).max(2000),
  idioma: z.enum(IDIOMAS).default(IDIOMA_POR_DEFECTO),
});

function leerCuerpo(event: APIGatewayProxyEventV2): unknown {
  if (!event.body) return undefined;
  const texto = event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString('utf8') : event.body;
  try {
    return JSON.parse(texto);
  } catch {
    return undefined;
  }
}

async function atenderChat(event: APIGatewayProxyEventV2, deps: DependenciasChat): Promise<Resultado> {
  const solicitud = SolicitudChat.safeParse(leerCuerpo(event));
  if (!solicitud.success) return json(400, { error: 'solicitud_invalida' });
  const { sessionId, mensaje, idioma } = solicitud.data;

  const sesion = await deps.repositorio.obtener(sessionId);
  if (sesion.mensajes >= MAX_MENSAJES_POR_SESION) {
    return json(429, {
      error: 'limite_mensajes',
      mensaje: 'Esta conversación llegó a su límite de mensajes. Puedes empezar una nueva.',
    });
  }

  // Una sola señal para todo el mensaje: aborta cualquier llamada a Bedrock en curso
  // cuando se agota el presupuesto, incluidos los reintentos del SDK.
  const abortSignal = AbortSignal.timeout(deps.presupuestoMs ?? PRESUPUESTO_BEDROCK_MS);
  const invocar: InvocarConverse = (input) => deps.invocar(input, { abortSignal });

  let salida: SalidaConversar;
  try {
    salida = await conversar(invocar, deps.modelId, {
      perfil: sesion.perfil,
      historial: sesion.historial,
      mensaje,
      idioma,
    });
  } catch (error) {
    console.error('Bedrock falló', error);
    return json(503, {
      error: 'asistente_no_disponible',
      mensaje: 'El asistente no está disponible en este momento. Puedes probar el modo demo.',
    });
  }

  await deps.repositorio.guardar({
    sessionId,
    perfil: salida.perfil,
    historial: salida.historial,
    mensajes: sesion.mensajes + 1,
  });

  const resultados = evaluarTodosLosProgramas(salida.perfil, idioma);
  return json(200, {
    respuesta: salida.respuesta,
    perfil: salida.perfil,
    resultados,
    plan: generarPlanPapeles(resultados, idioma),
  });
}

export function crearHandler(obtenerDependencias: () => DependenciasChat) {
  return async (event: APIGatewayProxyEventV2): Promise<Resultado> => {
    if (event.rawPath === '/api/hello') {
      return json(200, {
        message: 'Hola desde Lambda',
        region: process.env.AWS_REGION ?? 'local',
      });
    }
    if (event.rawPath === '/api/demo') {
      if (event.requestContext?.http?.method !== 'GET') {
        return json(405, { error: 'metodo_no_permitido' });
      }
      return json(200, construirDemo());
    }
    if (event.rawPath === '/api/chat') {
      if (event.requestContext?.http?.method !== 'POST') {
        return json(405, { error: 'metodo_no_permitido' });
      }
      try {
        return await atenderChat(event, obtenerDependencias());
      } catch (error) {
        console.error('Error en /api/chat', error);
        return json(500, { error: 'error_interno' });
      }
    }
    return json(404, { error: 'not_found' });
  };
}

let dependenciasReales: DependenciasChat | undefined;

function crearDependenciasReales(): DependenciasChat {
  if (!dependenciasReales) {
    const tabla = process.env.TABLA_SESIONES;
    if (!tabla) throw new Error('Falta la variable de entorno TABLA_SESIONES');
    // `Converse` no hace streaming: el modelo no envía ningún byte hasta terminar de
    // generar, así que una respuesta larga (como la explicación final de los 4
    // programas) tarda varios segundos "en silencio". El timeout por inactividad del
    // socket debe ser holgado (3 s cortaba esas respuestas); el tope real por mensaje
    // lo pone PRESUPUESTO_BEDROCK_MS en atenderChat. Este valor solo protege contra
    // un socket colgado, y queda bajo los 28 s de la Lambda.
    const bedrock = new BedrockRuntimeClient({
      requestHandler: { requestTimeout: 20_000 },
      maxAttempts: 2,
    });
    const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
      marshallOptions: { removeUndefinedValues: true },
    });
    dependenciasReales = {
      repositorio: new RepositorioDynamo(dynamo, tabla),
      invocar: (input, opciones) => bedrock.send(new ConverseCommand(input), opciones),
      modelId: process.env.MODEL_ID ?? MODELO_POR_DEFECTO,
    };
  }
  return dependenciasReales;
}

export const handler = crearHandler(crearDependenciasReales);
