import { describe, it, expect, vi } from 'vitest';
import type { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { LIMITES, LimiteDynamo } from '../../src/chat/limite-global';

interface EntradaUpdate {
  TableName: string;
  Key: { sessionId: string };
  UpdateExpression: string;
  ConditionExpression: string;
  ExpressionAttributeValues: { ':uno': number; ':max': number; ':expira': number };
}

// DynamoDB en memoria que respeta la condición `attribute_not_exists(llamadas) OR llamadas < :max`.
function dynamoFalso() {
  const filas = new Map<string, { llamadas: number; expiraEn: number }>();
  const send = vi.fn(async (comando: { input: EntradaUpdate }) => {
    const { Key, ExpressionAttributeValues: v } = comando.input;
    const fila = filas.get(Key.sessionId);
    if (fila && fila.llamadas >= v[':max']) {
      throw Object.assign(new Error('condición'), { name: 'ConditionalCheckFailedException' });
    }
    filas.set(Key.sessionId, { llamadas: (fila?.llamadas ?? 0) + v[':uno'], expiraEn: v[':expira'] });
    return {};
  });
  return { cliente: { send } as unknown as DynamoDBDocumentClient, filas, send };
}

const T0 = Date.UTC(2026, 8, 30, 12, 0, 10);

describe('LimiteDynamo', () => {
  it('deja pasar hasta el máximo por minuto y rechaza la siguiente llamada', async () => {
    const { cliente } = dynamoFalso();
    const limite = new LimiteDynamo(cliente, 'Sesiones', () => T0);
    for (let i = 0; i < LIMITES.chat.porMinuto; i++) expect(await limite.permitir('chat')).toBe(true);
    expect(await limite.permitir('chat')).toBe(false);
  });

  it('al pasar al minuto siguiente vuelve a permitir', async () => {
    const { cliente } = dynamoFalso();
    let ahora = T0;
    const limite = new LimiteDynamo(cliente, 'Sesiones', () => ahora);
    for (let i = 0; i < LIMITES.chat.porMinuto; i++) await limite.permitir('chat');
    expect(await limite.permitir('chat')).toBe(false);
    ahora += 60_000;
    expect(await limite.permitir('chat')).toBe(true);
  });

  it('el tope diario corta aunque cada minuto esté bajo su límite', async () => {
    const { cliente } = dynamoFalso();
    let ahora = T0;
    const limite = new LimiteDynamo(cliente, 'Sesiones', () => ahora);
    let permitidas = 0;
    for (let minuto = 0; minuto < 200; minuto++) {
      for (let i = 0; i < 10; i++) if (await limite.permitir('chat')) permitidas++;
      ahora += 60_000;
    }
    expect(permitidas).toBe(LIMITES.chat.porDia);
  });

  it('chat y voz llevan contadores separados', async () => {
    const { cliente } = dynamoFalso();
    const limite = new LimiteDynamo(cliente, 'Sesiones', () => T0);
    for (let i = 0; i < LIMITES.voz.porMinuto; i++) await limite.permitir('voz');
    expect(await limite.permitir('voz')).toBe(false);
    expect(await limite.permitir('chat')).toBe(true);
  });

  it('usa claves que jamás son un UUID de sesión y con expiración (TTL)', async () => {
    const { cliente, filas } = dynamoFalso();
    await new LimiteDynamo(cliente, 'Sesiones', () => T0).permitir('chat');
    const claves = [...filas.keys()];
    expect(claves).toHaveLength(2);
    for (const clave of claves) {
      expect(clave.startsWith('limite#chat#')).toBe(true);
      expect(clave).not.toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-/);
    }
    for (const fila of filas.values()) expect(fila.expiraEn).toBeGreaterThan(Math.floor(T0 / 1000));
  });

  it('si DynamoDB falla por otra causa, deja pasar (el limitador no tumba el servicio)', async () => {
    const send = vi.fn().mockRejectedValue(Object.assign(new Error('boom'), { name: 'InternalServerError' }));
    const limite = new LimiteDynamo({ send } as unknown as DynamoDBDocumentClient, 'Sesiones', () => T0);
    const registro = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(await limite.permitir('chat')).toBe(true);
    expect(registro).toHaveBeenCalled();
    registro.mockRestore();
  });
});
