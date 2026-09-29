import { describe, it, expect, vi } from 'vitest';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { crearHandler, type DependenciasChat } from '../src/handler';
import { crearSintetizadorPolly, MAX_CARACTERES_VOZ, VOCES } from '../src/chat/voz';

const noUsar = (() => {
  throw new Error('la voz no debe pedir dependencias del chat');
}) as unknown as () => DependenciasChat;

const peticion = (cuerpo: unknown, metodo = 'POST') =>
  ({
    rawPath: '/api/voz',
    requestContext: { http: { method: metodo } },
    body: typeof cuerpo === 'string' ? cuerpo : JSON.stringify(cuerpo),
  }) as unknown as APIGatewayProxyEventV2;

describe('POST /api/voz', () => {
  it('devuelve el audio en base64 y llama al sintetizador con texto e idioma', async () => {
    const sintetizar = vi.fn(async () => new Uint8Array([1, 2, 3]));
    const res = await crearHandler(noUsar, () => sintetizar)(peticion({ texto: 'Hola', idioma: 'es' }));
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body as string)).toEqual({ audio: Buffer.from([1, 2, 3]).toString('base64'), formato: 'mp3' });
    expect(sintetizar).toHaveBeenCalledWith('Hola', 'es');
  });

  it('el idioma por defecto es es', async () => {
    const sintetizar = vi.fn(async () => new Uint8Array([1]));
    await crearHandler(noUsar, () => sintetizar)(peticion({ texto: 'Hola' }));
    expect(sintetizar).toHaveBeenCalledWith('Hola', 'es');
  });

  it.each([
    ['sin texto', { idioma: 'es' }],
    ['texto vacío', { texto: '   ' }],
    ['texto demasiado largo', { texto: 'a'.repeat(MAX_CARACTERES_VOZ + 1) }],
    ['idioma inválido', { texto: 'Hola', idioma: 'fr' }],
    ['cuerpo que no es JSON', 'no-json'],
  ])('400 con %s, sin llamar a Polly', async (_nombre, cuerpo) => {
    const sintetizar = vi.fn();
    const res = await crearHandler(noUsar, () => sintetizar)(peticion(cuerpo));
    expect(res.statusCode).toBe(400);
    expect(sintetizar).not.toHaveBeenCalled();
  });

  it('405 si no es POST', async () => {
    const res = await crearHandler(noUsar, () => vi.fn())(peticion({ texto: 'Hola' }, 'GET'));
    expect(res.statusCode).toBe(405);
  });

  it('503 limpio si Polly falla', async () => {
    const sintetizar = vi.fn(async () => {
      throw new Error('boom');
    });
    const res = await crearHandler(noUsar, () => sintetizar)(peticion({ texto: 'Hola' }));
    expect(res.statusCode).toBe(503);
    expect(JSON.parse(res.body as string)).toEqual({ error: 'voz_no_disponible' });
  });
});

describe('crearSintetizadorPolly', () => {
  it.each([
    ['es', 'Lupe', 'es-US'],
    ['en', 'Ruth', 'en-US'],
  ] as const)('usa la voz generativa de %s', async (idioma, voz, lang) => {
    const send = vi.fn(async () => ({ AudioStream: { transformToByteArray: async () => new Uint8Array([9]) } }));
    const audio = await crearSintetizadorPolly({ send } as never)('Hola', idioma);
    expect(audio).toEqual(new Uint8Array([9]));
    const comando = (send.mock.calls[0] as unknown[])[0] as { input: Record<string, string> };
    expect(comando.input).toMatchObject({ Engine: 'generative', VoiceId: voz, LanguageCode: lang, OutputFormat: 'mp3', Text: 'Hola' });
    expect(VOCES[idioma].voiceId).toBe(voz);
  });

  it('falla si Polly no devuelve audio', async () => {
    await expect(crearSintetizadorPolly({ send: async () => ({}) } as never)('Hola', 'es')).rejects.toThrow();
  });
});
