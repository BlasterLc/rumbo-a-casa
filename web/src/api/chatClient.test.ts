import { describe, it, expect, vi, afterEach } from 'vitest';
import { enviarMensaje } from './chatClient';

function mockFetch(status: number, body: unknown) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      json: async () => body,
    }),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('enviarMensaje', () => {
  it('200: devuelve respuesta, perfil, resultados y plan', async () => {
    mockFetch(200, { respuesta: 'Hola', perfil: {}, resultados: [], plan: [] });
    const r = await enviarMensaje('id-1', 'Hola');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.respuesta).toBe('Hola');
  });

  it('429: expone el mensaje exacto del backend sobre el límite de mensajes', async () => {
    mockFetch(429, {
      error: 'limite_mensajes',
      mensaje: 'Esta conversación llegó a su límite de mensajes. Puedes empezar una nueva.',
    });
    const r = await enviarMensaje('id-1', 'Hola');
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.codigo).toBe('limite_mensajes');
      expect(r.mensaje).toBe('Esta conversación llegó a su límite de mensajes. Puedes empezar una nueva.');
    }
  });

  it('503: identifica el fallo del asistente para que la pantalla ofrezca el modo demo', async () => {
    mockFetch(503, {
      error: 'asistente_no_disponible',
      mensaje: 'El asistente no está disponible en este momento. Puedes probar el modo demo.',
    });
    const r = await enviarMensaje('id-1', 'Hola');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.codigo).toBe('asistente_no_disponible');
  });

  it('400: expone solicitud_invalida cuando el backend rechaza la solicitud', async () => {
    mockFetch(400, { error: 'solicitud_invalida' });
    const r = await enviarMensaje('id-1', 'Hola');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.codigo).toBe('solicitud_invalida');
  });

  it('500: cae a error_interno', async () => {
    mockFetch(500, { error: 'error_interno' });
    const r = await enviarMensaje('id-1', 'Hola');
    if (!r.ok) expect(r.codigo).toBe('error_interno');
  });

  it('sin red: nunca lanza, vuelve como codigo "red"', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    const r = await enviarMensaje('id-1', 'Hola');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.codigo).toBe('red');
  });
});
