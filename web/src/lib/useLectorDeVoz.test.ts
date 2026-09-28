import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLectorDeVoz } from './useLectorDeVoz';

/** jsdom no implementa la Web Speech API: se arma un doble mínimo para probar el hook. */
function instalarSpeechSynthesisFalso() {
  class UtteranceFalso {
    text: string;
    lang = '';
    onend: (() => void) | null = null;
    onerror: (() => void) | null = null;
    constructor(text: string) {
      this.text = text;
    }
  }
  const cancel = vi.fn();
  const speak = vi.fn();
  vi.stubGlobal('SpeechSynthesisUtterance', UtteranceFalso);
  vi.stubGlobal('speechSynthesis', { cancel, speak });
  return { cancel, speak, UtteranceFalso };
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
