import { describe, it, expect } from 'vitest';
import { formatoFechaCorta } from './fecha';

describe('formatoFechaCorta', () => {
  it('formatea una fecha ISO al formato corto de tarjeta en español, por defecto', () => {
    expect(formatoFechaCorta('2026-09-22')).toBe('22 sep 2026');
  });

  it('formatea en inglés cuando se pide', () => {
    expect(formatoFechaCorta('2026-09-22', 'en')).toBe('Sep 22, 2026');
  });

  it('con un texto que no es una fecha ISO, lo devuelve tal cual en vez de romper', () => {
    expect(formatoFechaCorta('sin fecha')).toBe('sin fecha');
  });
});
