import { z } from 'zod';
import { PollyClient, SynthesizeSpeechCommand } from '@aws-sdk/client-polly';
import { IDIOMAS, IDIOMA_POR_DEFECTO, type Idioma } from '../rules-engine/index';

/** Máximo de caracteres por solicitud: acota el costo de un endpoint sin login. */
export const MAX_CARACTERES_VOZ = 1500;

/** Voces generativas de Polly: Lupe (es-US) y Ruth (en-US). */
export const VOCES: Record<Idioma, { voiceId: 'Lupe' | 'Ruth'; languageCode: 'es-US' | 'en-US' }> = {
  es: { voiceId: 'Lupe', languageCode: 'es-US' },
  en: { voiceId: 'Ruth', languageCode: 'en-US' },
};

export const SolicitudVoz = z.object({
  texto: z.string().trim().min(1).max(MAX_CARACTERES_VOZ),
  idioma: z.enum(IDIOMAS).default(IDIOMA_POR_DEFECTO),
});

/** Devuelve el audio MP3 del texto en la voz del idioma. */
export type Sintetizar = (texto: string, idioma: Idioma) => Promise<Uint8Array>;

export function crearSintetizadorPolly(polly: Pick<PollyClient, 'send'>): Sintetizar {
  return async (texto, idioma) => {
    const { voiceId, languageCode } = VOCES[idioma];
    const salida = await polly.send(
      new SynthesizeSpeechCommand({
        Engine: 'generative',
        VoiceId: voiceId,
        LanguageCode: languageCode,
        OutputFormat: 'mp3',
        Text: texto,
      }),
    );
    if (!salida.AudioStream) throw new Error('Polly no devolvió audio');
    return salida.AudioStream.transformToByteArray();
  };
}
