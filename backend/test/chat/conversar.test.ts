import { describe, it, expect, vi } from 'vitest';
import type { Message } from '@aws-sdk/client-bedrock-runtime';
import {
  MAX_VUELTAS_HERRAMIENTAS,
  RESPUESTA_RESPALDO,
  SYSTEM_PROMPT,
  conversar,
} from '../../src/chat/conversar';
import { HERRAMIENTAS } from '../../src/chat/herramientas';
import { MENSAJES_CHAT } from '../../src/chat/mensajes';
import { PERFIL_VACIO } from '../../src/chat/perfil';
import { construirSystemPrompt } from '../../src/chat/prompt';
import { respuestaHerramienta, respuestaTexto } from './fakes';

const MODELO = 'modelo-de-prueba';
const entrada = (mensaje: string, historial: Message[] = []) => ({
  perfil: PERFIL_VACIO,
  historial,
  mensaje,
});

describe('SYSTEM_PROMPT', () => {
  it('prohíbe pedir la Clave Única y obliga a usar el motor para decidir', () => {
    expect(SYSTEM_PROMPT).toContain('Clave Única');
    expect(SYSTEM_PROMPT).toContain('evaluar_elegibilidad');
  });
});

describe('conversar', () => {
  it('con una respuesta de texto devuelve el texto y el historial de un turno', async () => {
    const invocar = vi.fn().mockResolvedValueOnce(respuestaTexto('¡Hola! ¿En qué región vives?'));
    const salida = await conversar(invocar, MODELO, entrada('Hola'));

    expect(salida.respuesta).toBe('¡Hola! ¿En qué región vives?');
    expect(salida.perfil).toEqual(PERFIL_VACIO);
    expect(salida.historial).toEqual([
      { role: 'user', content: [{ text: 'Hola' }] },
      { role: 'assistant', content: [{ text: '¡Hola! ¿En qué región vives?' }] },
    ]);

    const llamada = invocar.mock.calls[0][0];
    expect(llamada.modelId).toBe(MODELO);
    expect(llamada.system).toEqual([{ text: SYSTEM_PROMPT }]);
    expect(llamada.toolConfig.tools).toBe(HERRAMIENTAS);
    expect(llamada.messages).toEqual([{ role: 'user', content: [{ text: 'Hola' }] }]);
  });

  it('conserva el historial previo y le agrega el turno nuevo', async () => {
    const previo: Message[] = [
      { role: 'user', content: [{ text: 'Hola' }] },
      { role: 'assistant', content: [{ text: 'Hola, ¿región?' }] },
    ];
    const invocar = vi.fn().mockResolvedValueOnce(respuestaTexto('Anotado.'));
    const salida = await conversar(invocar, MODELO, entrada('Biobío', previo));
    expect(salida.historial.slice(0, 2)).toEqual(previo);
    expect(salida.historial).toHaveLength(4);
    expect(invocar.mock.calls[0][0].messages).toHaveLength(3);
  });

  it('ejecuta la herramienta pedida, devuelve su resultado al modelo y actualiza el perfil', async () => {
    const invocar = vi
      .fn()
      .mockResolvedValueOnce(respuestaHerramienta('actualizar_perfil', { tramoRSH: 40 }, 'tu-7'))
      .mockResolvedValueOnce(respuestaTexto('Listo, tramo 40%.'));
    const salida = await conversar(invocar, MODELO, entrada('Estoy en el tramo 40'));

    expect(salida.perfil.tramoRSH).toBe(40);
    expect(salida.respuesta).toBe('Listo, tramo 40%.');
    expect(invocar).toHaveBeenCalledTimes(2);

    const segunda = invocar.mock.calls[1][0].messages as Message[];
    const ultimo = segunda[segunda.length - 1];
    expect(ultimo.role).toBe('user');
    const resultado = ultimo.content?.[0].toolResult;
    expect(resultado?.toolUseId).toBe('tu-7');
    expect(resultado?.status).toBe('success');
    expect(resultado?.content?.[0].json).toEqual({ aceptados: ['tramoRSH'], rechazados: [] });

    // user, assistant(toolUse), user(toolResult), assistant(texto)
    expect(salida.historial).toHaveLength(4);
  });

  it('una herramienta desconocida vuelve al modelo con status error y la conversación sigue', async () => {
    const invocar = vi
      .fn()
      .mockResolvedValueOnce(respuestaHerramienta('borrar_todo', {}))
      .mockResolvedValueOnce(respuestaTexto('Perdón, sigamos.'));
    const salida = await conversar(invocar, MODELO, entrada('hola'));

    const segunda = invocar.mock.calls[1][0].messages as Message[];
    expect(segunda[segunda.length - 1].content?.[0].toolResult?.status).toBe('error');
    expect(salida.respuesta).toBe('Perdón, sigamos.');
  });

  it('si el modelo no deja de pedir herramientas, corta y deja un historial válido', async () => {
    const invocar = vi.fn().mockResolvedValue(respuestaHerramienta('evaluar_elegibilidad', {}));
    const salida = await conversar(invocar, MODELO, entrada('hola'));

    expect(invocar).toHaveBeenCalledTimes(MAX_VUELTAS_HERRAMIENTAS);
    expect(salida.respuesta).toBe(RESPUESTA_RESPALDO);
    expect(salida.historial).toEqual([
      { role: 'user', content: [{ text: 'hola' }] },
      { role: 'assistant', content: [{ text: RESPUESTA_RESPALDO }] },
    ]);
  });

  it('una respuesta sin texto se reintenta una vez y, si sigue vacía, usa el respaldo', async () => {
    const invocar = vi.fn().mockResolvedValue(respuestaTexto('   '));
    const salida = await conversar(invocar, MODELO, entrada('hola'));
    expect(invocar).toHaveBeenCalledTimes(2);
    expect(salida.respuesta).toBe(RESPUESTA_RESPALDO);
  });

  const vacia = {
    stopReason: 'end_turn',
    output: { message: { role: 'assistant', content: [] } },
  } as unknown as Awaited<ReturnType<typeof respuestaTexto>>;

  it('si tras una herramienta el modelo calla, la respuesta es el texto que ya había escrito antes de llamarla', async () => {
    const invocar = vi
      .fn()
      .mockResolvedValueOnce(respuestaHerramienta('actualizar_perfil', { tienePropiedad: false }))
      .mockResolvedValueOnce(vacia);
    const salida = await conversar(invocar, MODELO, entrada('Somos 4 y no tenemos casa'));

    // Ese texto es la respuesta real del modelo: no se reintenta ni se cae al respaldo.
    expect(invocar).toHaveBeenCalledTimes(2);
    expect(salida.respuesta).toBe('Déjame anotarlo.');
    expect(salida.perfil.tienePropiedad).toBe(false);
    expect(salida.historial.at(-1)).toEqual({ role: 'assistant', content: [{ text: 'Déjame anotarlo.' }] });
  });

  it('si no hay texto en ningún turno, reintenta una vez y usa el texto de la segunda vez', async () => {
    const invocar = vi.fn().mockResolvedValueOnce(vacia).mockResolvedValueOnce(respuestaTexto('¡Hola! ¿En qué región vives?'));
    const salida = await conversar(invocar, MODELO, entrada('hola'));
    expect(invocar).toHaveBeenCalledTimes(2);
    expect(salida.respuesta).toBe('¡Hola! ¿En qué región vives?');
  });

  it('si Bedrock falla, propaga el error', async () => {
    const invocar = vi.fn().mockRejectedValueOnce(new Error('ThrottlingException'));
    await expect(conversar(invocar, MODELO, entrada('hola'))).rejects.toThrow('ThrottlingException');
  });

  it('usa el prompt del idioma pedido y, sin idioma, el de español', async () => {
    const invocarEn = vi.fn().mockResolvedValueOnce(respuestaTexto('Hi!'));
    await conversar(invocarEn, MODELO, { ...entrada('Hola'), idioma: 'en' });
    expect(invocarEn.mock.calls[0][0].system).toEqual([{ text: construirSystemPrompt('en') }]);

    const invocarSin = vi.fn().mockResolvedValueOnce(respuestaTexto('¡Hola!'));
    await conversar(invocarSin, MODELO, entrada('Hola'));
    expect(invocarSin.mock.calls[0][0].system).toEqual([{ text: construirSystemPrompt('es') }]);
  });

  it('las herramientas le devuelven al modelo los resultados en el idioma pedido', async () => {
    const invocar = vi
      .fn()
      .mockResolvedValueOnce(respuestaHerramienta('evaluar_elegibilidad', {}))
      .mockResolvedValueOnce(respuestaTexto('Done.'));
    await conversar(invocar, MODELO, { ...entrada('Hola'), idioma: 'en' });

    const segunda = invocar.mock.calls[1][0].messages as Message[];
    const resultado = segunda[segunda.length - 1].content?.[0].toolResult?.content?.[0] as {
      json: { resultados: { motivo: string }[] };
    };
    expect(resultado.json.resultados[0].motivo).toBe(
      'I need more information to check whether you qualify for DS49.',
    );
  });

  it('la respuesta de respaldo sale en el idioma pedido', async () => {
    const invocar = vi.fn().mockResolvedValue(respuestaTexto('   '));
    const salida = await conversar(invocar, MODELO, { ...entrada('hi'), idioma: 'en' });
    expect(salida.respuesta).toBe(MENSAJES_CHAT.en.respaldo);
    expect(MENSAJES_CHAT.es.respaldo).toBe(RESPUESTA_RESPALDO);
  });
});
