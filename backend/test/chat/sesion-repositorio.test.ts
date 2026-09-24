import { describe, it, expect, vi } from 'vitest';
import { GetCommand, PutCommand, type DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import {
  RepositorioDynamo,
  RepositorioEnMemoria,
  TTL_SEGUNDOS,
  sesionNueva,
  type Sesion,
} from '../../src/chat/sesion-repositorio';
import { PERFIL_VACIO } from '../../src/chat/perfil';

const clienteFalso = (respuesta: unknown = {}) => {
  const send = vi.fn().mockResolvedValue(respuesta);
  return { send, cliente: { send } as unknown as Pick<DynamoDBDocumentClient, 'send'> };
};

const sesionConDatos: Sesion = {
  sessionId: 's-1',
  perfil: { ...PERFIL_VACIO, tramoRSH: 40 },
  historial: [{ role: 'user', content: [{ text: 'hola' }] }],
  mensajes: 3,
};

describe('sesionNueva', () => {
  it('parte con el perfil vacío, sin historial y en 0 mensajes', () => {
    expect(sesionNueva('abc')).toEqual({ sessionId: 'abc', perfil: PERFIL_VACIO, historial: [], mensajes: 0 });
  });
});

describe('RepositorioEnMemoria', () => {
  it('devuelve una sesión nueva si no existe', async () => {
    const repo = new RepositorioEnMemoria();
    expect(await repo.obtener('nuevo')).toEqual(sesionNueva('nuevo'));
  });

  it('guarda y recupera una copia (no la misma referencia)', async () => {
    const repo = new RepositorioEnMemoria();
    await repo.guardar(sesionConDatos);
    const leida = await repo.obtener('s-1');
    expect(leida).toEqual(sesionConDatos);
    expect(leida).not.toBe(sesionConDatos);
  });
});

describe('RepositorioDynamo', () => {
  it('obtener pide el item por sessionId a la tabla configurada', async () => {
    const { send, cliente } = clienteFalso({ Item: sesionConDatos });
    const repo = new RepositorioDynamo(cliente, 'TablaSesiones');
    const leida = await repo.obtener('s-1');
    const comando = send.mock.calls[0][0];
    expect(comando).toBeInstanceOf(GetCommand);
    expect(comando.input).toEqual({ TableName: 'TablaSesiones', Key: { sessionId: 's-1' } });
    expect(leida).toEqual(sesionConDatos);
  });

  it('obtener devuelve una sesión nueva si no hay item', async () => {
    const { cliente } = clienteFalso({});
    const repo = new RepositorioDynamo(cliente, 'T');
    expect(await repo.obtener('nada')).toEqual(sesionNueva('nada'));
  });

  it('si el perfil guardado ya no es válido, reinicia perfil e historial pero conserva mensajes', async () => {
    const { cliente } = clienteFalso({
      Item: { ...sesionConDatos, perfil: { tramoRSH: 'cuarenta' } },
    });
    const repo = new RepositorioDynamo(cliente, 'T');
    const leida = await repo.obtener('s-1');
    expect(leida.perfil).toEqual(PERFIL_VACIO);
    expect(leida.historial).toEqual([]);
    expect(leida.mensajes).toBe(3);
  });

  it('guardar escribe el item con expiraEn a 30 días', async () => {
    const { send, cliente } = clienteFalso();
    const repo = new RepositorioDynamo(cliente, 'T', () => 1_000_000_000);
    await repo.guardar(sesionConDatos);
    const comando = send.mock.calls[0][0];
    expect(comando).toBeInstanceOf(PutCommand);
    expect(comando.input).toEqual({
      TableName: 'T',
      Item: { ...sesionConDatos, expiraEn: 1_000_000 + TTL_SEGUNDOS },
    });
  });
});
