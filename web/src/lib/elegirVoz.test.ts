import { describe, it, expect } from 'vitest';
import { elegirVoz } from './elegirVoz';

const v = (name: string, lang: string) => ({ name, lang });

describe('elegirVoz', () => {
  it('sin voces del idioma devuelve undefined', () => {
    expect(elegirVoz([v('Samantha', 'en-US')], 'es')).toBeUndefined();
    expect(elegirVoz([], 'en')).toBeUndefined();
  });

  it('prefiere una voz neural/natural sobre una básica, aunque la región sea menos preferida', () => {
    const voces = [v('Microsoft Sabina', 'es-MX'), v('Microsoft Dalia Online (Natural)', 'es-MX'), v('Genérica', 'es-CL')];
    expect(elegirVoz(voces, 'es')?.name).toBe('Microsoft Dalia Online (Natural)');
  });

  it('prefiere Google sobre una voz sin marca', () => {
    const voces = [v('Alguna', 'en-US'), v('Google US English', 'en-US')];
    expect(elegirVoz(voces, 'en')?.name).toBe('Google US English');
  });

  it('a igualdad de calidad, respeta la región preferida', () => {
    const voces = [v('Voz A', 'es-ES'), v('Voz B', 'es-MX'), v('Voz C', 'es-CL')];
    expect(elegirVoz(voces, 'es')?.name).toBe('Voz C');
  });

  it('penaliza las voces compactas/espeak', () => {
    const voces = [v('eSpeak Spanish', 'es-CL'), v('Voz normal', 'es-ES')];
    expect(elegirVoz(voces, 'es')?.name).toBe('Voz normal');
  });

  it('acepta el guion bajo de Android (es_US) y no mezcla idiomas', () => {
    const voces = [v('Voz Android', 'es_US'), v('English', 'en-US')];
    expect(elegirVoz(voces, 'es')?.name).toBe('Voz Android');
  });
});
