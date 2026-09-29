import type { Idioma } from '../i18n/LocaleContext';

/** Coincide con MAX_CARACTERES_VOZ del backend (`POST /api/voz`). */
export const MAX_CARACTERES_VOZ = 1500;

const cache = new Map<string, string>();

/** Recorta al último fin de frase que quepa, para no cortar una palabra a la mitad. */
export function recortarParaVoz(texto: string): string {
  if (texto.length <= MAX_CARACTERES_VOZ) return texto;
  const corte = texto.slice(0, MAX_CARACTERES_VOZ);
  const fin = Math.max(corte.lastIndexOf('. '), corte.lastIndexOf('? '), corte.lastIndexOf('! '));
  return fin > 0 ? corte.slice(0, fin + 1) : corte;
}

/**
 * Pide a `POST /api/voz` (Amazon Polly) el audio del texto y lo devuelve como data URL MP3.
 * Cada par idioma+texto se pide una sola vez (se cachea): volver a pulsar "Escuchar" no cuesta nada.
 * Lanza si el servidor no responde bien; quien llama cae a la voz del navegador.
 */
export async function pedirAudioPolly(texto: string, idioma: Idioma): Promise<string> {
  const limpio = recortarParaVoz(texto);
  const clave = `${idioma}|${limpio}`;
  const guardado = cache.get(clave);
  if (guardado) return guardado;
  const res = await fetch('/api/voz', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ texto: limpio, idioma }),
  });
  if (!res.ok) throw new Error(`voz ${res.status}`);
  const { audio } = (await res.json()) as { audio: string };
  const url = `data:audio/mpeg;base64,${audio}`;
  cache.set(clave, url);
  return url;
}

export function vaciarCacheVozPolly() {
  cache.clear();
}
