import { describe, it, expect } from 'vitest';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { handler } from '../src/handler';

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
