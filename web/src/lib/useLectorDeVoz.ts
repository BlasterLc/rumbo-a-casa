import { useCallback, useEffect, useRef, useState } from 'react';
import type { Idioma } from '../i18n/LocaleContext';
import { elegirVoz } from './elegirVoz';
import { pedirAudioPolly } from './vozPolly';

const IDIOMA_VOZ: Record<Idioma, string> = { es: 'es-CL', en: 'en-US' };

/**
 * "Escuchar": lee el texto con una voz de Amazon Polly (Lupe en español, Ruth en inglés, vía
 * `POST /api/voz`), igual en todos los navegadores. Si Polly no responde, cae a la Web Speech API
 * del navegador (sin costo ni backend). `hablar` cancela cualquier lectura en curso (propia o de
 * otra burbuja) antes de empezar la nueva, así que nunca se superponen dos voces; `hablando` es
 * true también mientras se descarga el audio. `soportado` es false en navegadores sin
 * `speechSynthesis` (y en jsdom) para ocultar el botón en vez de dejarlo sin efecto.
 */
export function useLectorDeVoz() {
  const [hablando, setHablando] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // Cada lectura nueva o cancelada invalida las anteriores (una descarga lenta no debe hablar tarde).
  const turnoRef = useRef(0);
  const soportado = typeof window !== 'undefined' && 'speechSynthesis' in window;

  const cortar = useCallback(() => {
    turnoRef.current += 1;
    audioRef.current?.pause();
    audioRef.current = null;
    if (soportado) window.speechSynthesis.cancel();
  }, [soportado]);

  const detener = useCallback(() => {
    if (!soportado) return;
    cortar();
    setHablando(false);
  }, [soportado, cortar]);

  const hablarConNavegador = useCallback((texto: string, idioma: Idioma) => {
    const utterance = new SpeechSynthesisUtterance(texto);
    utterance.lang = IDIOMA_VOZ[idioma];
    // Voz más natural disponible (neural/Google) en vez de la robótica por defecto.
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
  }, []);

  const hablar = useCallback(
    (texto: string, idioma: Idioma) => {
      if (!soportado) return;
      cortar();
      const turno = turnoRef.current;
      const limpio = texto.replaceAll('**', '');
      setHablando(true);
      pedirAudioPolly(limpio, idioma)
        .then((url) => {
          if (turno !== turnoRef.current) return;
          const audio = new Audio(url);
          audioRef.current = audio;
          audio.onended = () => setHablando(false);
          audio.onerror = () => hablarConNavegador(limpio, idioma);
          return audio.play();
        })
        .catch(() => {
          if (turno === turnoRef.current) hablarConNavegador(limpio, idioma);
        });
    },
    [soportado, cortar, hablarConNavegador],
  );

  // Al desmontar (p.ej. se cambia de pantalla) no debe seguir hablando una burbuja que ya no existe.
  useEffect(() => {
    if (!soportado) return;
    return () => {
      turnoRef.current += 1;
      audioRef.current?.pause();
      window.speechSynthesis?.cancel();
    };
  }, [soportado]);

  return { hablando, hablar, detener, soportado };
}
