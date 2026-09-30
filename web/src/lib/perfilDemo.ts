import { construirDemo, type Perfil } from '../types/dominio';

/**
 * Familia ficticia para el modo demo: el perfil con que termina la conversación de ejemplo del
 * guion (`construirDemo`), para que los resultados del demo y lo que se dijo en el chat sean lo
 * mismo. Nunca datos de una persona real, y nunca un resultado inventado a mano.
 */
export const PERFIL_DEMO: Perfil = construirDemo().pasos.at(-1)!.perfil;

/** Folio ficticio del modo demo: deja el seguimiento con una postulación de ejemplo ya enviada. */
export const FOLIO_DEMO = 'DEMO-2026-0001234';
