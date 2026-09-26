import { describe, it, expect } from 'vitest';
import { type as tipo, sizePx } from './tokens';

describe('tokens de escritorio', () => {
  it('el título de la Bienvenida escala de forma fluida entre 40 y 56 px', () => {
    expect(tipo['display-2xl'].fontSize).toBe('clamp(40px, 4.4vw, 56px)');
    expect(tipo['display-2xl'].fontWeight).toBe(700);
  });

  it('el contenido mide 1120 px y la cabecera de escritorio 72 px', () => {
    expect(sizePx['size-page']).toBe(1120);
    expect(sizePx['size-header']).toBe(72);
  });
});
