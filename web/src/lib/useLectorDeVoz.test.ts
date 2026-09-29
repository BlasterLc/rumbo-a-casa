import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useLectorDeVoz } from './useLectorDeVoz';
import { vaciarCacheVozPolly } from './vozPolly';

/** jsdom no implementa Web Speech ni reproducción de audio: se arman dobles mínimos. */
function instalarDobles() {
  class UtteranceFalso {
    text: string;
    lang = '';
    voice: unknown = null;
    rate = 1;
    pitch = 1;
    onend: (() => void) | null = null;
    onerror: (() => void) | null = null;
    constructor(text: string) {
      this.text = text;
    }
  }
  const cancel = vi.fn();
  const speak = vi.fn();
  const getVoices = vi.fn(() => [] as { name: string; lang: string }[]);
  vi.stubGlobal('SpeechSynthesisUtterance', UtteranceFalso);
  vi.stubGlobal('speechSynthesis', { cancel, speak, getVoices });

  const reproducidos: AudioFalso[] = [];
  class AudioFalso {
    src: string;
    onended: (() => void) | null = null;
    onerror: (() => void) | null = null;
    play = vi.fn(async () => {});
    pause = vi.fn();
    constructor(src: string) {
      this.src = src;
      reproducidos.push(this);
    }
  }
  vi.stubGlobal('Audio', AudioFalso);
  return { cancel, speak, getVoices, reproducidos };
}

const polly = (ok = true) =>
  vi.fn(async () => ({ ok, status: ok ? 200 : 503, json: async () => ({ audio: 'QUJD' }) }));

describe('useLectorDeVoz', () => {
  beforeEach(() => vaciarCacheVozPolly());
  afterEach(() => vi.unstubAllGlobals());

  it('sin speechSynthesis (jsdom por defecto) no está soportado', () => {
    const { result } = renderHook(() => useLectorDeVoz());
    expect(result.current.soportado).toBe(false);
  });

  describe('con speechSynthesis disponible', () => {
    let dobles: ReturnType<typeof instalarDobles>;
    beforeEach(() => {
      dobles = instalarDobles();
    });

    it('está soportado', () => {
      const { result } = renderHook(() => useLectorDeVoz());
      expect(result.current.soportado).toBe(true);
    });

    it('hablar() pide la voz a Polly con el idioma, sin marcas de negrita, y la reproduce', async () => {
      const fetchFalso = polly();
      vi.stubGlobal('fetch', fetchFalso);
      const { result } = renderHook(() => useLectorDeVoz());
      act(() => result.current.hablar('**Hola**, ¿cuántos son?', 'es'));
      expect(result.current.hablando).toBe(true);
      await waitFor(() => expect(dobles.reproducidos).toHaveLength(1));
      const init = (fetchFalso.mock.calls[0] as unknown as [string, RequestInit])[1];
      expect(JSON.parse(init.body as string)).toEqual({ texto: 'Hola, ¿cuántos son?', idioma: 'es' });
      expect(dobles.reproducidos[0].src).toBe('data:audio/mpeg;base64,QUJD');
      expect(dobles.reproducidos[0].play).toHaveBeenCalled();
      expect(dobles.speak).not.toHaveBeenCalled();
    });

    it('al terminar el audio deja de estar "hablando"', async () => {
      vi.stubGlobal('fetch', polly());
      const { result } = renderHook(() => useLectorDeVoz());
      act(() => result.current.hablar('Hola', 'en'));
      await waitFor(() => expect(dobles.reproducidos).toHaveLength(1));
      act(() => dobles.reproducidos[0].onended?.());
      expect(result.current.hablando).toBe(false);
    });

    it('si Polly falla, cae a la voz del navegador con la mejor voz del idioma', async () => {
      vi.stubGlobal('fetch', polly(false));
      dobles.getVoices.mockReturnValue([
        { name: 'Voz básica', lang: 'en-US' },
        { name: 'Microsoft Aria Online (Natural)', lang: 'en-US' },
      ]);
      const { result } = renderHook(() => useLectorDeVoz());
      act(() => result.current.hablar('Hello', 'en'));
      await waitFor(() => expect(dobles.speak).toHaveBeenCalledOnce());
      const utterance = dobles.speak.mock.calls[0][0];
      expect(utterance.text).toBe('Hello');
      expect(utterance.voice.name).toBe('Microsoft Aria Online (Natural)');
      expect(utterance.rate).toBe(0.95);
      act(() => utterance.onend());
      expect(result.current.hablando).toBe(false);
    });

    it('si el audio de Polly no se puede reproducir, cae a la voz del navegador', async () => {
      vi.stubGlobal('fetch', polly());
      const { result } = renderHook(() => useLectorDeVoz());
      act(() => result.current.hablar('Hola', 'es'));
      await waitFor(() => expect(dobles.reproducidos).toHaveLength(1));
      act(() => dobles.reproducidos[0].onerror?.());
      expect(dobles.speak).toHaveBeenCalledOnce();
      expect(dobles.speak.mock.calls[0][0].lang).toBe('es-CL');
    });

    it('detener() corta el audio y deja de estar "hablando" de inmediato', async () => {
      vi.stubGlobal('fetch', polly());
      const { result } = renderHook(() => useLectorDeVoz());
      act(() => result.current.hablar('Hola', 'es'));
      await waitFor(() => expect(dobles.reproducidos).toHaveLength(1));
      act(() => result.current.detener());
      expect(dobles.reproducidos[0].pause).toHaveBeenCalled();
      expect(result.current.hablando).toBe(false);
    });

    it('detener() antes de que llegue el audio evita que hable tarde', async () => {
      let resolver!: (v: unknown) => void;
      vi.stubGlobal('fetch', vi.fn(() => new Promise((r) => (resolver = r))));
      const { result } = renderHook(() => useLectorDeVoz());
      act(() => result.current.hablar('Hola', 'es'));
      act(() => result.current.detener());
      await act(async () => resolver({ ok: true, json: async () => ({ audio: 'QUJD' }) }));
      expect(dobles.reproducidos).toHaveLength(0);
      expect(dobles.speak).not.toHaveBeenCalled();
    });
  });
});
