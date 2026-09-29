import { useCallback, useEffect, useRef, useState } from 'react';
import type { Idioma } from '../i18n/LocaleContext';
import { elegirVoz } from './elegirVoz';

const IDIOMA_VOZ: Record<Idioma, string> = { es: 'es-CL', en: 'en-US' };

/**
 * Envuelve `window.speechSynthesis` (Web Speech API del navegador, sin costo ni backend). `hablar`
 * cancela cualquier lectura en curso (propia o de otra burbuja) antes de empezar la nueva, así que
 * nunca se superponen dos voces. `soportado` es false en navegadores que no implementan la API
 * (y en jsdom, donde no existe) para poder ocultar el botón en vez de dejarlo sin efecto.
 */
export function useLectorDeVoz() {
  const [hablando, setHablando] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const soportado = typeof window !== 'undefined' && 'speechSynthesis' in window;

  const detener = useCallback(() => {
    if (!soportado) return;
    window.speechSynthesis.cancel();
    setHablando(false);
  }, [soportado]);

  const hablar = useCallback(
    (texto: string, idioma: Idioma) => {
      if (!soportado) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(texto.replaceAll('**', ''));
      utterance.lang = IDIOMA_VOZ[idioma];
      // Voz más natural disponible (neural/Google) en vez de la robótica por defecto; un poco más
      // pausada y cálida. Si getVoices() aún viene vacío, el navegador usa su voz por `lang`.
      const voz = elegirVoz(window.speechSynthesis.getVoices?.() ?? [], idioma);
      if (voz) {
        utterance.voice = voz;
        utterance.lang = voz.lang;
      }
      utterance.rate = 0.95;
      utterance.pitch = 1.05;
      utterance.onend = () => setHablando(false);
      utterance.onerror = () => setHablando(false);
      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
      setHablando(true);
    },
    [soportado],
  );

  // Al desmontar (p.ej. se cambia de pantalla) no debe seguir hablando una burbuja que ya no existe.
  useEffect(() => {
    if (!soportado) return;
    return () => window.speechSynthesis?.cancel();
  }, [soportado]);

  return { hablando, hablar, detener, soportado };
}
