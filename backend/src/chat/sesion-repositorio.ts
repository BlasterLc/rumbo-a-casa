import { GetCommand, PutCommand, type DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import type { Message } from '@aws-sdk/client-bedrock-runtime';
import { PerfilSchema, type Perfil } from '../rules-engine/index';
import { PERFIL_VACIO } from './perfil';

export const TTL_SEGUNDOS = 30 * 24 * 60 * 60;

export interface Sesion {
  sessionId: string;
  perfil: Perfil;
  historial: Message[];
  mensajes: number;
}

export interface RepositorioSesiones {
  obtener(sessionId: string): Promise<Sesion>;
  guardar(sesion: Sesion): Promise<void>;
}

export const sesionNueva = (sessionId: string): Sesion => ({
  sessionId,
  perfil: { ...PERFIL_VACIO },
  historial: [],
  mensajes: 0,
});

export class RepositorioEnMemoria implements RepositorioSesiones {
  private readonly sesiones = new Map<string, Sesion>();

  async obtener(sessionId: string): Promise<Sesion> {
    return structuredClone(this.sesiones.get(sessionId) ?? sesionNueva(sessionId));
  }

  async guardar(sesion: Sesion): Promise<void> {
    this.sesiones.set(sesion.sessionId, structuredClone(sesion));
  }
}

export class RepositorioDynamo implements RepositorioSesiones {
  constructor(
    private readonly cliente: Pick<DynamoDBDocumentClient, 'send'>,
    private readonly tabla: string,
    private readonly ahoraMs: () => number = Date.now,
  ) {}

  async obtener(sessionId: string): Promise<Sesion> {
    const { Item } = await this.cliente.send(
      new GetCommand({ TableName: this.tabla, Key: { sessionId } }),
    );
    if (!Item) return sesionNueva(sessionId);

    const mensajes = typeof Item.mensajes === 'number' ? Item.mensajes : 0;
    const perfil = PerfilSchema.safeParse(Item.perfil);
    if (!perfil.success) return { ...sesionNueva(sessionId), mensajes };

    return {
      sessionId,
      perfil: perfil.data,
      historial: Array.isArray(Item.historial) ? (Item.historial as Message[]) : [],
      mensajes,
    };
  }

  async guardar(sesion: Sesion): Promise<void> {
    const expiraEn = Math.floor(this.ahoraMs() / 1000) + TTL_SEGUNDOS;
    await this.cliente.send(new PutCommand({ TableName: this.tabla, Item: { ...sesion, expiraEn } }));
  }
}
