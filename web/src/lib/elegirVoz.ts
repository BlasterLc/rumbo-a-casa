import type { Idioma } from '../i18n/LocaleContext';

/** Región preferida por idioma, de mayor a menor: la primera que exista gana a igualdad de calidad. */
const REGIONES: Record<Idioma, string[]> = {
  es: ['es-cl', 'es-mx', 'es-us', 'es-419', 'es-es'],
  en: ['en-us', 'en-gb', 'en-au', 'en-ca'],
};

type VozMinima = Pick<SpeechSynthesisVoice, 'name' | 'lang'>;

/** Puntaje de calidad por nombre: las voces neurales/naturales del navegador suenan mucho más humanas. */
function puntajeCalidad(nombre: string): number {
  let puntaje = 0;
  if (/natural|neural|online/i.test(nombre)) puntaje += 30;
  if (/google/i.test(nombre)) puntaje += 20;
  if (/premium|enhanced|mejorada/i.test(nombre)) puntaje += 15;
  if (/compact|espeak/i.test(nombre)) puntaje -= 20;
  return puntaje;
}

/**
 * Elige la voz más agradable disponible en el navegador para el idioma: descarta las de otro
 * idioma y ordena por calidad (neural/natural > Google > resto) y luego por región preferida.
 * Devuelve `undefined` si no hay ninguna del idioma (el navegador usará su voz por defecto).
 */
export function elegirVoz<T extends VozMinima>(voces: readonly T[], idioma: Idioma): T | undefined {
  const prefijo = idioma === 'es' ? 'es' : 'en';
  const regiones = REGIONES[idioma];
  const candidatas = voces.filter((v) => v.lang.toLowerCase().replace('_', '-').split('-')[0] === prefijo);
  const puntaje = (v: T) => {
    const idx = regiones.indexOf(v.lang.toLowerCase().replace('_', '-'));
    return puntajeCalidad(v.name) * 10 + (idx === -1 ? 0 : regiones.length - idx);
  };
  return [...candidatas].sort((a, b) => puntaje(b) - puntaje(a))[0];
}
