import { describe, it, expect, vi } from 'vitest';
import { randomUUID } from 'node:crypto';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { handler, crearHandler, MAX_MENSAJES_POR_SESION, type DependenciasChat } from '../src/handler';
import { RepositorioEnMemoria } from '../src/chat/sesion-repositorio';
import { respuestaHerramienta, respuestaTexto } from './chat/fakes';

const evento = (rawPath: string) => ({ rawPath }) as APIGatewayProxyEventV2;

describe('handler', () => {
  it('responde 200 con un mensaje en GET /api/hello', async () => {
    const res = await handler(evento('/api/hello'));
    expect(res.statusCode).toBe(200);
    const cuerpo = JSON.parse(res.body as string);
    expect(cuerpo.message).toBe('Hola desde Lambda');
    expect(cuerpo.region).toBe('local');
  });

  it('responde 404 en una ruta desconocida', async () => {
    const res = await handler(evento('/api/otra-cosa'));
    expect(res.statusCode).toBe(404);
    expect(JSON.parse(res.body as string)).toEqual({ error: 'not_found' });
  });
});

const peticionDemo = (metodo = 'GET') =>
  ({ rawPath: '/api/demo', requestContext: { http: { method: metodo } } }) as unknown as APIGatewayProxyEventV2;

describe('GET /api/demo', () => {
  it('responde 200 con la conversación de ejemplo sin tocar Bedrock ni DynamoDB', async () => {
    const obtenerDependencias = vi.fn(() => {
      throw new Error('el demo no debe pedir dependencias');
    });
    const res = await crearHandler(obtenerDependencias)(peticionDemo());

    expect(res.statusCode).toBe(200);
    const cuerpo = JSON.parse(res.body as string);
    expect(cuerpo.modo).toBe('demo');
    expect(cuerpo.pasos.length).toBeGreaterThan(0);
    expect(cuerpo.pasos[0]).toHaveProperty('usuario');
    expect(cuerpo.pasos[0]).toHaveProperty('respuesta');
    expect(cuerpo.pasos[0].resultados).toHaveLength(4);
    expect(obtenerDependencias).not.toHaveBeenCalled();
  });

  it('funciona con el handler real aunque falte TABLA_SESIONES', async () => {
    const res = await handler(peticionDemo());
    expect(res.statusCode).toBe(200);
  });

  it('responde 405 si no es GET', async () => {
    const res = await handler(peticionDemo('POST'));
    expect(res.statusCode).toBe(405);
    expect(JSON.parse(res.body as string)).toEqual({ error: 'metodo_no_permitido' });
  });
});

const peticionChat = (
  body: string | undefined,
  opciones: { metodo?: string; base64?: boolean } = {},
) =>
  ({
    rawPath: '/api/chat',
    body,
    isBase64Encoded: opciones.base64 ?? false,
    requestContext: { http: { method: opciones.metodo ?? 'POST' } },
  }) as unknown as APIGatewayProxyEventV2;

const armar = (invocar = vi.fn().mockResolvedValue(respuestaTexto('Hola, ¿en qué región vives?'))) => {
  const repositorio = new RepositorioEnMemoria();
  const deps: DependenciasChat = { repositorio, invocar, modelId: 'modelo-de-prueba' };
  return { repositorio, invocar, handlerChat: crearHandler(() => deps) };
};

describe('POST /api/chat', () => {
  it('responde 200 con respuesta, perfil, resultados de los 4 programas y plan', async () => {
    const { handlerChat, repositorio } = armar();
    const sessionId = randomUUID();
    const res = await handlerChat(peticionChat(JSON.stringify({ sessionId, mensaje: 'Hola' })));

    expect(res.statusCode).toBe(200);
    const cuerpo = JSON.parse(res.body as string);
    expect(cuerpo.respuesta).toBe('Hola, ¿en qué región vives?');
    expect(cuerpo.perfil.tramoRSH).toBe('desconocido');
    expect(cuerpo.resultados).toHaveLength(4);
    expect(cuerpo.plan).toEqual([]);

    const sesion = await repositorio.obtener(sessionId);
    expect(sesion.mensajes).toBe(1);
    expect(sesion.historial).toHaveLength(2);
  });

  it('acepta el cuerpo en base64 (así puede llegar desde la Function URL)', async () => {
    const { handlerChat } = armar();
    const body = Buffer.from(JSON.stringify({ sessionId: randomUUID(), mensaje: 'Hola' })).toString('base64');
    const res = await handlerChat(peticionChat(body, { base64: true }));
    expect(res.statusCode).toBe(200);
  });

  it('guarda entre mensajes el perfil que cambió una herramienta', async () => {
    const invocar = vi
      .fn()
      .mockResolvedValueOnce(respuestaHerramienta('actualizar_perfil', { tramoRSH: 40 }))
      .mockResolvedValueOnce(respuestaTexto('Anotado.'))
      .mockResolvedValueOnce(respuestaTexto('¿Y tu ahorro?'));
    const { handlerChat, repositorio } = armar(invocar);
    const sessionId = randomUUID();

    const primera = await handlerChat(peticionChat(JSON.stringify({ sessionId, mensaje: 'Tramo 40' })));
    expect(JSON.parse(primera.body as string).perfil.tramoRSH).toBe(40);

    await handlerChat(peticionChat(JSON.stringify({ sessionId, mensaje: 'ok' })));
    const sesion = await repositorio.obtener(sessionId);
    expect(sesion.perfil.tramoRSH).toBe(40);
    expect(sesion.mensajes).toBe(2);
  });

  it.each([
    ['JSON roto', '{no es json'],
    ['sin cuerpo', undefined],
    ['sin sessionId', JSON.stringify({ mensaje: 'Hola' })],
    ['sessionId que no es UUID', JSON.stringify({ sessionId: 'abc', mensaje: 'Hola' })],
    ['mensaje vacío', JSON.stringify({ sessionId: randomUUID(), mensaje: '   ' })],
    ['mensaje de más de 2000 caracteres', JSON.stringify({ sessionId: randomUUID(), mensaje: 'a'.repeat(2001) })],
  ])('responde 400 con %s', async (_caso, body) => {
    const { handlerChat, invocar } = armar();
    const res = await handlerChat(peticionChat(body));
    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body as string)).toEqual({ error: 'solicitud_invalida' });
    expect(invocar).not.toHaveBeenCalled();
  });

  it('responde 405 si no es POST', async () => {
    const { handlerChat } = armar();
    const res = await handlerChat(peticionChat(undefined, { metodo: 'GET' }));
    expect(res.statusCode).toBe(405);
  });

  it('responde 429 al llegar al tope de mensajes, sin llamar a Bedrock', async () => {
    const { handlerChat, repositorio, invocar } = armar();
    const sessionId = randomUUID();
    const llena = await repositorio.obtener(sessionId);
    await repositorio.guardar({ ...llena, mensajes: MAX_MENSAJES_POR_SESION });

    const res = await handlerChat(peticionChat(JSON.stringify({ sessionId, mensaje: 'Hola' })));
    expect(res.statusCode).toBe(429);
    expect(JSON.parse(res.body as string).error).toBe('limite_mensajes');
    expect(invocar).not.toHaveBeenCalled();
  });

  it('responde 503 si Bedrock falla y no guarda la sesión', async () => {
    const invocar = vi.fn().mockRejectedValue(new Error('AccessDeniedException: account being verified'));
    const { handlerChat, repositorio } = armar(invocar);
    const sessionId = randomUUID();

    const res = await handlerChat(peticionChat(JSON.stringify({ sessionId, mensaje: 'Hola' })));
    expect(res.statusCode).toBe(503);
    expect(JSON.parse(res.body as string).error).toBe('asistente_no_disponible');
    const sesion = await repositorio.obtener(sessionId);
    expect(sesion.mensajes).toBe(0);
    expect(sesion.historial).toEqual([]);
  });

  it('comparte una señal de aborto entre todas las llamadas a Bedrock de un mensaje', async () => {
    const invocar = vi
      .fn()
      .mockResolvedValueOnce(respuestaHerramienta('actualizar_perfil', { tramoRSH: 40 }))
      .mockResolvedValueOnce(respuestaTexto('Anotado.'));
    const { handlerChat } = armar(invocar);
    await handlerChat(peticionChat(JSON.stringify({ sessionId: randomUUID(), mensaje: 'Tramo 40' })));

    expect(invocar).toHaveBeenCalledTimes(2);
    const senales = invocar.mock.calls.map(([, opciones]) => opciones?.abortSignal);
    expect(senales[0]).toBeInstanceOf(AbortSignal);
    expect(senales[1]).toBe(senales[0]);
  });

  it('responde 503 y no guarda la sesión si Bedrock excede el presupuesto de tiempo', async () => {
    const invocar = vi.fn(
      (_input: unknown, opciones?: { abortSignal?: AbortSignal }) =>
        new Promise<never>((_resolver, rechazar) => {
          opciones?.abortSignal?.addEventListener('abort', () => rechazar(opciones.abortSignal?.reason));
        }),
    );
    const repositorio = new RepositorioEnMemoria();
    const deps = { repositorio, invocar, modelId: 'modelo-de-prueba', presupuestoMs: 30 } as DependenciasChat;
    const sessionId = randomUUID();

    const res = await crearHandler(() => deps)(peticionChat(JSON.stringify({ sessionId, mensaje: 'Hola' })));

    expect(res.statusCode).toBe(503);
    expect(JSON.parse(res.body as string).error).toBe('asistente_no_disponible');
    expect((await repositorio.obtener(sessionId)).mensajes).toBe(0);
  });

  it('responde 500 si falla el repositorio de sesiones', async () => {
    const deps: DependenciasChat = {
      repositorio: {
        obtener: vi.fn().mockRejectedValue(new Error('DynamoDB caído')),
        guardar: vi.fn(),
      },
      invocar: vi.fn(),
      modelId: 'modelo-de-prueba',
    };
    const res = await crearHandler(() => deps)(
      peticionChat(JSON.stringify({ sessionId: randomUUID(), mensaje: 'Hola' })),
    );
    expect(res.statusCode).toBe(500);
    expect(JSON.parse(res.body as string)).toEqual({ error: 'error_interno' });
  });
});

describe('campo idioma de POST /api/chat', () => {
  it.each([['fr'], ['EN'], [''], [null], [1], [['en']]])(
    'responde 400 sin llamar a Bedrock si idioma es %j',
    async (idioma) => {
      const { handlerChat, invocar } = armar();
      const res = await handlerChat(
        peticionChat(JSON.stringify({ sessionId: randomUUID(), mensaje: 'Hola', idioma })),
      );
      expect(res.statusCode).toBe(400);
      expect(JSON.parse(res.body as string)).toEqual({ error: 'solicitud_invalida' });
      expect(invocar).not.toHaveBeenCalled();
    },
  );

  it.each([['es'], ['en'], [undefined]])('acepta idioma %s (ausente = español)', async (idioma) => {
    const { handlerChat } = armar();
    const res = await handlerChat(
      peticionChat(JSON.stringify({ sessionId: randomUUID(), mensaje: 'Hola', idioma })),
    );
    expect(res.statusCode).toBe(200);
  });
});
