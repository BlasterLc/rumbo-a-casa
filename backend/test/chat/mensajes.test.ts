import { describe, it, expect } from 'vitest';
import { MENSAJES_CHAT } from '../../src/chat/mensajes';

describe('MENSAJES_CHAT', () => {
  it('es y en tienen las mismas claves y ningún texto vacío ni repetido entre idiomas', () => {
    expect(Object.keys(MENSAJES_CHAT.en).sort()).toEqual(Object.keys(MENSAJES_CHAT.es).sort());
    for (const clave of Object.keys(MENSAJES_CHAT.es) as (keyof typeof MENSAJES_CHAT.es)[]) {
      expect(MENSAJES_CHAT.es[clave].length).toBeGreaterThan(10);
      expect(MENSAJES_CHAT.en[clave]).not.toBe(MENSAJES_CHAT.es[clave]);
    }
  });

  it('el mensaje de límite y el de no disponible ofrecen la salida al usuario', () => {
    expect(MENSAJES_CHAT.es.limiteMensajes).toContain('Puedes empezar una nueva');
    expect(MENSAJES_CHAT.es.asistenteNoDisponible).toContain('modo demo');
    expect(MENSAJES_CHAT.en.limiteMensajes).toContain('start a new one');
    expect(MENSAJES_CHAT.en.asistenteNoDisponible).toContain('demo mode');
  });
});
