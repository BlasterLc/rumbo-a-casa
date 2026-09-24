import type { ConverseCommandOutput } from '@aws-sdk/client-bedrock-runtime';

export const respuestaTexto = (texto: string) =>
  ({
    stopReason: 'end_turn',
    output: { message: { role: 'assistant', content: [{ text: texto }] } },
  }) as unknown as ConverseCommandOutput;

export const respuestaHerramienta = (nombre: string, input: unknown, toolUseId = 'tu-1') =>
  ({
    stopReason: 'tool_use',
    output: {
      message: {
        role: 'assistant',
        content: [{ text: 'Déjame anotarlo.' }, { toolUse: { toolUseId, name: nombre, input } }],
      },
    },
  }) as unknown as ConverseCommandOutput;
