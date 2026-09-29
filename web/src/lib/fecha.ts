import type { Idioma } from '../i18n/LocaleContext';

const MESES: Record<Idioma, string[]> = {
  es: ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
};

/** 'YYYY-MM-DD' → '22 sep 2026' (es) / 'Sep 22, 2026' (en) — el formato corto de tarjeta que
 * usa el design system, en el idioma activo. */
export function formatoFechaCorta(iso: string, idioma: Idioma = 'es'): string {
  const [anio, mes, dia] = iso.split('-').map(Number);
  if (!anio || !mes || !dia) return iso;
  const nombreMes = MESES[idioma][mes - 1];
  return idioma === 'en' ? `${nombreMes} ${dia}, ${anio}` : `${dia} ${nombreMes} ${anio}`;
}
