import { UpdateCommand, type DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

export type Recurso = 'chat' | 'voz';

export interface LimiteGlobal {
  /** Cuenta una llamada; false si el recurso ya agotó su cupo de este minuto o de este día. */
  permitir(recurso: Recurso): Promise<boolean>;
}

/**
 * Cupos para todo el sitio (no por persona): la API no tiene login, así que el gasto de Bedrock y de
 * Polly se acota por volumen total. Un usuario normal no se acerca: una conversación son unas decenas
 * de mensajes. Polly generativo cuesta por carácter, por eso el cupo de voz es más bajo.
 */
export const LIMITES: Record<Recurso, { porMinuto: number; porDia: number }> = {
  chat: { porMinuto: 20, porDia: 1500 },
  voz: { porMinuto: 10, porDia: 300 },
};

export const SIN_LIMITE: LimiteGlobal = { permitir: async () => true };

const VENTANAS = [
  { etiqueta: 'm', segundos: 60, cupo: (r: Recurso) => LIMITES[r].porMinuto },
  { etiqueta: 'd', segundos: 86_400, cupo: (r: Recurso) => LIMITES[r].porDia },
] as const;

/**
 * Contadores atómicos en la misma tabla de sesiones. Las claves empiezan con `limite#`, así que nunca
 * coinciden con un `sessionId` (siempre un UUID) y nadie puede leerlas desde la API. Cada fila expira
 * sola con el TTL de la tabla (`expiraEn`).
 */
export class LimiteDynamo implements LimiteGlobal {
  constructor(
    private readonly cliente: DynamoDBDocumentClient,
    private readonly tabla: string,
    private readonly ahoraMs: () => number = Date.now,
  ) {}

  async permitir(recurso: Recurso): Promise<boolean> {
    const ahora = Math.floor(this.ahoraMs() / 1000);
    for (const ventana of VENTANAS) {
      const indice = Math.floor(ahora / ventana.segundos);
      const clave = `limite#${recurso}#${ventana.etiqueta}#${indice}`;
      // La fila sobrevive una hora a su ventana y luego la borra el TTL.
      const expiraEn = (indice + 1) * ventana.segundos + 3_600;
      if (!(await this.consumir(clave, ventana.cupo(recurso), expiraEn))) return false;
    }
    return true;
  }

  private async consumir(clave: string, maximo: number, expiraEn: number): Promise<boolean> {
    try {
      await this.cliente.send(
        new UpdateCommand({
          TableName: this.tabla,
          Key: { sessionId: clave },
          UpdateExpression: 'SET expiraEn = :expira ADD llamadas :uno',
          ConditionExpression: 'attribute_not_exists(llamadas) OR llamadas < :max',
          ExpressionAttributeValues: { ':uno': 1, ':max': maximo, ':expira': expiraEn },
        }),
      );
      return true;
    } catch (error) {
      if ((error as { name?: string }).name === 'ConditionalCheckFailedException') return false;
      // Si el contador falla por otra causa, el servicio sigue: es mejor que tumbarlo por el limitador.
      console.error('El limitador global falló', error);
      return true;
    }
  }
}
