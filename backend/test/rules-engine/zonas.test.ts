import { describe, it, expect } from 'vitest';
import { obtenerZonaDS1 } from '../../src/rules-engine/zonas';

describe('obtenerZonaDS1', () => {
  it('Antofagasta es zona extremo norte', () => {
    expect(obtenerZonaDS1({ region: 'Antofagasta', zonaEspecial: 'ninguna' })).toBe('extremo_norte');
  });

  it('Metropolitana es zona regular', () => {
    expect(obtenerZonaDS1({ region: 'Metropolitana', zonaEspecial: 'ninguna' })).toBe('regular');
  });

  it('Magallanes es zona extremo sur e insular', () => {
    expect(obtenerZonaDS1({ region: 'Magallanes', zonaEspecial: 'ninguna' })).toBe('extremo_sur_insular');
  });

  it('la provincia de Chiloé cuenta como extremo norte aunque la región sea Los Lagos', () => {
    expect(obtenerZonaDS1({ region: 'Los Lagos', zonaEspecial: 'chiloe' })).toBe('extremo_norte');
  });

  it('Isla de Pascua cuenta como extremo sur e insular', () => {
    expect(obtenerZonaDS1({ region: 'Valparaíso', zonaEspecial: 'isla_de_pascua' })).toBe('extremo_sur_insular');
  });

  it('devuelve "desconocido" si falta la región', () => {
    expect(obtenerZonaDS1({ region: 'desconocido', zonaEspecial: 'ninguna' })).toBe('desconocido');
  });
});
