import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
} from 'aws-lambda';
import { z } from 'zod';
import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { evaluarTodosLosProgramas } from './rules-engine/index';
import { conversar, type InvocarConverse, type SalidaConversar } from './chat/conversar';
import { generarPlanPapeles } from './chat/papeles';
import { RepositorioDynamo, type RepositorioSesiones } from './chat/sesion-repositorio';

export const MAX_MENSAJES_POR_SESION = 40;
export const MODELO_POR_DEFECTO = 'us.anthropic.claude-haiku-4-5-20251001-v1:0';

export interface DependenciasChat {
  repositorio: RepositorioSesiones;
  invocar: InvocarConverse;
  modelId: string;
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
  const { sessionId, mensaje } = solicitud.data;

  const sesion = await deps.repositorio.obtener(sessionId);
  if (sesion.mensajes >= MAX_MENSAJES_POR_SESION) {
    return json(429, {
      error: 'limite_mensajes',
      mensaje: 'Esta conversación llegó a su límite de mensajes. Puedes empezar una nueva.',
    });
  }

  let salida: SalidaConversar;
  try {
    salida = await conversar(deps.invocar, deps.modelId, {
      perfil: sesion.perfil,
      historial: sesion.historial,
      mensaje,
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

  const resultados = evaluarTodosLosProgramas(salida.perfil);
  return json(200, {
    respuesta: salida.respuesta,
    perfil: salida.perfil,
    resultados,
    plan: generarPlanPapeles(resultados),
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
    const bedrock = new BedrockRuntimeClient({});
    const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
      marshallOptions: { removeUndefinedValues: true },
    });
    dependenciasReales = {
      repositorio: new RepositorioDynamo(dynamo, tabla),
      invocar: (input) => bedrock.send(new ConverseCommand(input)),
      modelId: process.env.MODEL_ID ?? MODELO_POR_DEFECTO,
    };
  }
  return dependenciasReales;
}

export const handler = crearHandler(crearDependenciasReales);
