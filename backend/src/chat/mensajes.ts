import type { Idioma } from '../rules-engine/index';

export interface MensajesChat {
  limiteMensajes: string;
  asistenteNoDisponible: string;
  respaldo: string;
}

export const MENSAJES_CHAT: Record<Idioma, MensajesChat> = {
  es: {
    limiteMensajes: 'Esta conversación llegó a su límite de mensajes. Puedes empezar una nueva.',
    asistenteNoDisponible: 'El asistente no está disponible en este momento. Puedes probar el modo demo.',
    respaldo: 'Perdón, me enredé procesando tu mensaje. ¿Me lo puedes repetir con otras palabras?',
  },
  en: {
    limiteMensajes: 'This conversation has reached its message limit. You can start a new one.',
    asistenteNoDisponible: 'The assistant is not available right now. You can try the demo mode.',
    respaldo: 'Sorry, I got tangled up processing your message. Could you say it again in other words?',
  },
};
