import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLectorDeVoz } from './useLectorDeVoz';

/** jsdom no implementa la Web Speech API: se arma un doble mínimo para probar el hook. */
function instalarSpeechSynthesisFalso() {
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
  vi.stubGlobal('SpeechSynthesisUtterance', UtteranceFalso);
  const getVoices = vi.fn(() => [] as { name: string; lang: string }[]);
  vi.stubGlobal('speechSynthesis', { cancel, speak, getVoices });
  return { cancel, speak, getVoices, UtteranceFalso };
}

describe('useLectorDeVoz', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sin speechSynthesis (jsdom por defecto) no está soportado', () => {
    const { result } = renderHook(() => useLectorDeVoz());
    expect(result.current.soportado).toBe(false);
  });

  describe('con speechSynthesis disponible', () => {
    let dobles: ReturnType<typeof instalarSpeechSynthesisFalso>;
    beforeEach(() => {
      dobles = instalarSpeechSynthesisFalso();
    });

    it('está soportado', () => {
      const { result } = renderHook(() => useLectorDeVoz());
      expect(result.current.soportado).toBe(true);
    });

    it('hablar() cancela cualquier lectura previa, arma la voz según el idioma y marca "hablando"', () => {
      const { result } = renderHook(() => useLectorDeVoz());
      act(() => result.current.hablar('**Hola**, ¿cuántos son?', 'es'));
      expect(dobles.cancel).toHaveBeenCalledOnce();
      expect(dobles.speak).toHaveBeenCalledOnce();
      const utterance = dobles.speak.mock.calls[0][0];
      expect(utterance.text).toBe('Hola, ¿cuántos son?');
      expect(utterance.lang).toBe('es-CL');
      expect(result.current.hablando).toBe(true);
    });

    it('usa la voz en inglés cuando el idioma es "en"', () => {
      const { result } = renderHook(() => useLectorDeVoz());
      act(() => result.current.hablar('Hello', 'en'));
      const utterance = dobles.speak.mock.calls[0][0];
      expect(utterance.lang).toBe('en-US');
    });

    it('usa la mejor voz disponible del idioma y un ritmo más pausado', () => {
      dobles.getVoices.mockReturnValue([
        { name: 'Voz básica', lang: 'en-US' },
        { name: 'Microsoft Aria Online (Natural)', lang: 'en-US' },
      ]);
      const { result } = renderHook(() => useLectorDeVoz());
      act(() => result.current.hablar('Hello', 'en'));
      const utterance = dobles.speak.mock.calls[0][0];
      expect(utterance.voice.name).toBe('Microsoft Aria Online (Natural)');
      expect(utterance.rate).toBe(0.95);
    });

    it('al terminar la lectura (onend) deja de estar "hablando"', () => {
      const { result } = renderHook(() => useLectorDeVoz());
      act(() => result.current.hablar('Hola', 'es'));
      const utterance = dobles.speak.mock.calls[0][0];
      act(() => utterance.onend());
      expect(result.current.hablando).toBe(false);
    });

    it('detener() cancela y deja de estar "hablando" de inmediato', () => {
      const { result } = renderHook(() => useLectorDeVoz());
      act(() => result.current.hablar('Hola', 'es'));
      act(() => result.current.detener());
      expect(dobles.cancel).toHaveBeenCalledTimes(2);
      expect(result.current.hablando).toBe(false);
    });
  });
});
