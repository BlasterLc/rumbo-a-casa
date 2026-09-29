import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { pedirAudioPolly, recortarParaVoz, vaciarCacheVozPolly, MAX_CARACTERES_VOZ } from './vozPolly';

describe('pedirAudioPolly', () => {
  beforeEach(() => vaciarCacheVozPolly());
  afterEach(() => vi.unstubAllGlobals());

  it('pide el audio a /api/voz y lo devuelve como data URL', async () => {
    const fetchFalso = vi.fn(async () => ({ ok: true, json: async () => ({ audio: 'QUJD', formato: 'mp3' }) }));
    vi.stubGlobal('fetch', fetchFalso);
    expect(await pedirAudioPolly('Hola', 'es')).toBe('data:audio/mpeg;base64,QUJD');
    const [url, init] = fetchFalso.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('/api/voz');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({ texto: 'Hola', idioma: 'es' });
  });

  it('cachea: el mismo texto e idioma no se pide dos veces', async () => {
    const fetchFalso = vi.fn(async () => ({ ok: true, json: async () => ({ audio: 'QUJD' }) }));
    vi.stubGlobal('fetch', fetchFalso);
    await pedirAudioPolly('Hola', 'es');
    await pedirAudioPolly('Hola', 'es');
    await pedirAudioPolly('Hola', 'en');
    expect(fetchFalso).toHaveBeenCalledTimes(2);
  });

  it('lanza si el servidor responde con error', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 503, json: async () => ({}) })));
    await expect(pedirAudioPolly('Hola', 'es')).rejects.toThrow();
  });
});

describe('recortarParaVoz', () => {
  it('deja intacto un texto corto', () => {
    expect(recortarParaVoz('Hola. Qué tal.')).toBe('Hola. Qué tal.');
  });
  it('recorta al último fin de frase que cabe', () => {
    const largo = 'Frase corta. '.repeat(200);
    const r = recortarParaVoz(largo);
    expect(r.length).toBeLessThanOrEqual(MAX_CARACTERES_VOZ);
    expect(r.endsWith('.')).toBe(true);
  });
});
