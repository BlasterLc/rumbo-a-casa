import type { Idioma } from '../rules-engine/index';

export interface MensajesChat {
  limiteMensajes: string;
  asistenteNoDisponible: string;
  respaldo: string;
  /** Tope global de llamadas agotado: se muestra con el código `asistente_no_disponible`. */
  servicioSaturado: string;
  /** Se agrega al último turno de usuario cuando el modelo cierra vacío tras las herramientas. */
  recordatorioResponder: string;
}

export const MENSAJES_CHAT: Record<Idioma, MensajesChat> = {
  es: {
    limiteMensajes: 'Esta conversación llegó a su límite de mensajes. Puedes empezar una nueva.',
    asistenteNoDisponible: 'El asistente no está disponible en este momento. Puedes probar el modo demo.',
    respaldo: 'Perdón, me enredé procesando tu mensaje. ¿Me lo puedes repetir con otras palabras?',
    servicioSaturado:
      'Hay mucha gente usando el asistente en este momento. Prueba de nuevo en unos minutos o mira el modo demo.',
    recordatorioResponder:
      'Responde ahora a la persona usando solo lo que devolvieron las herramientas. No afirmes que califica o no a un programa si no salió en esos resultados.',
  },
  en: {
    limiteMensajes: 'This conversation has reached its message limit. You can start a new one.',
    asistenteNoDisponible: 'The assistant is not available right now. You can try the demo mode.',
    respaldo: 'Sorry, I got tangled up processing your message. Could you say it again in other words?',
    servicioSaturado:
      'The assistant is very busy right now. Try again in a few minutes or look at the demo mode.',
    recordatorioResponder:
      'Now answer the person using only what the tools returned. Do not say they qualify or not for a program unless it appears in those results.',
  },
};
