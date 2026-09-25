import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { randomUUID } from 'node:crypto';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';

// Verifica que las dependencias reales (las que usa la Lambda desplegada, no las
// fakes inyectadas en handler.test.ts) configuran el cliente de Bedrock con un
// timeout por solicitud y con pocos reintentos. Sin esto, una llamada lenta o
// colgada no tiene límite (el SDK usa 0 = sin timeout por defecto) y puede hacer
// que la Lambda entera supere sus 28s de límite, devolviendo un 502 crudo en vez
// del 503 que espera la SPA. Ver el hallazgo de la revisión final sobre
// crearDependenciasReales en backend/src/handler.ts.

const capturarConstructor = vi.fn();

vi.mock('@aws-sdk/client-bedrock-runtime', async () => {
  const real = await vi.importActual<typeof import('@aws-sdk/client-bedrock-runtime')>(
    '@aws-sdk/client-bedrock-runtime',
  );
  return {
    ...real,
    BedrockRuntimeClient: vi.fn().mockImplementation((config: unknown) => {
      capturarConstructor(config);
      return { send: vi.fn().mockRejectedValue(new Error('no usado en este test')) };
    }),
  };
});

// El repositorio real hace una llamada de red a DynamoDB; no importa que falle
// en este entorno de pruebas, porque el dato que nos interesa (la configuración
// del cliente de Bedrock) ya se capturó de forma síncrona antes de esa llamada.
vi.mock('@aws-sdk/client-dynamodb', async () => {
  const real = await vi.importActual<typeof import('@aws-sdk/client-dynamodb')>('@aws-sdk/client-dynamodb');
  return { ...real, DynamoDBClient: vi.fn().mockImplementation(() => ({})) };
});

vi.mock('@aws-sdk/lib-dynamodb', async () => {
  const real = await vi.importActual<typeof import('@aws-sdk/lib-dynamodb')>('@aws-sdk/lib-dynamodb');
  return {
    ...real,
    DynamoDBDocumentClient: {
      from: vi.fn().mockReturnValue({ send: vi.fn().mockRejectedValue(new Error('no usado en este test')) }),
    },
  };
});

const eventoChat = (): APIGatewayProxyEventV2 =>
  ({
    rawPath: '/api/chat',
    body: JSON.stringify({ sessionId: randomUUID(), mensaje: 'Hola' }),
    isBase64Encoded: false,
    requestContext: { http: { method: 'POST' } },
  }) as unknown as APIGatewayProxyEventV2;

describe('crearDependenciasReales (configuración de Bedrock en producción)', () => {
  const tablaOriginal = process.env.TABLA_SESIONES;

  beforeEach(() => {
    vi.resetModules();
    capturarConstructor.mockClear();
    process.env.TABLA_SESIONES = 'tabla-de-prueba';
  });

  afterEach(() => {
    if (tablaOriginal === undefined) delete process.env.TABLA_SESIONES;
    else process.env.TABLA_SESIONES = tablaOriginal;
  });

  it('configura BedrockRuntimeClient con timeout por solicitud y maxAttempts acotado', async () => {
    const { handler } = await import('../src/handler');
    // Dispara la ruta /api/chat para forzar la construcción de las dependencias
    // reales; no nos importa el resultado (fallará al intentar hablar con
    // DynamoDB/Bedrock falsos), solo la configuración con la que se construyó
    // el cliente.
    await handler(eventoChat());

    expect(capturarConstructor).toHaveBeenCalledTimes(1);
    const config = capturarConstructor.mock.calls[0][0] as {
      requestHandler?: { requestTimeout?: number };
      maxAttempts?: number;
    };

    // Converse no es streaming: el modelo no envía ningún byte hasta terminar de
    // generar, así que una respuesta larga (la explicación final de los 4 programas)
    // tarda varios segundos en silencio. Con 3000 ms esa respuesta fallaba siempre,
    // por eso hay un piso. El techo deja margen dentro de los 28 s de la Lambda; el
    // tope real por mensaje lo pone el presupuesto de tiempo del handler.
    expect(config.requestHandler?.requestTimeout).toBeGreaterThanOrEqual(10000);
    expect(config.requestHandler?.requestTimeout).toBeLessThanOrEqual(24000);
    expect(config.maxAttempts).toBeDefined();
    expect(config.maxAttempts as number).toBeLessThanOrEqual(2);
  });
});
