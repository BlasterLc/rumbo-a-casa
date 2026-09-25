import { describe, it, expect } from 'vitest';
import { construirSystemPrompt } from '../../src/chat/prompt';
import { SYSTEM_PROMPT } from '../../src/chat/conversar';

describe('construirSystemPrompt', () => {
  it('en español es el SYSTEM_PROMPT de siempre', () => {
    expect(construirSystemPrompt('es')).toBe(SYSTEM_PROMPT);
  });

  it('fija el idioma de respuesta de forma explícita, aunque el historial esté en otro', () => {
    const es = construirSystemPrompt('es');
    const en = construirSystemPrompt('en');
    expect(es).toContain('Responde siempre en español, aunque el historial de la conversación esté en inglés.');
    expect(en).toContain('Responde siempre en inglés, aunque el historial de la conversación esté en español.');
    expect(es).not.toContain('Responde siempre en inglés');
    expect(en).not.toContain('Responde siempre en español');
  });

  it('en español pide tuteo singular y prohíbe usted, ustedes e impersonal', () => {
    const es = construirSystemPrompt('es');
    expect(es).toContain('Háblale de tú, siempre en singular');
    expect(es).toContain('Nunca "usted", "ustedes"');
    expect(es).not.toContain('How you speak (English)');
  });

  it('en inglés trae las reglas de tono en inglés', () => {
    const en = construirSystemPrompt('en');
    expect(en).toContain('How you speak (English)');
    expect(en).toContain('Speak directly to the person');
    expect(en).not.toContain('Háblale de tú');
  });

  it.each(['es', 'en'] as const)('[%s] mantiene lo esencial: Clave Única, herramientas y campos', (idioma) => {
    const prompt = construirSystemPrompt(idioma);
    expect(prompt).toContain('Clave Única');
    expect(prompt).toContain('evaluar_elegibilidad');
    expect(prompt).toContain('actualizar_perfil');
    expect(prompt).toContain('postulanteEdad');
    expect(prompt).toContain('objetivo');
  });

  it.each(['es', 'en'] as const)('[%s] pide guardar de inmediato y mapear ciudades a regiones', (idioma) => {
    const prompt = construirSystemPrompt(idioma);
    expect(prompt).toContain('incluso en el primer mensaje');
    expect(prompt).toContain('"Santiago" es "Metropolitana"');
  });

  it.each(['es', 'en'] as const)('[%s] prohíbe agregar datos que no vengan de las herramientas', (idioma) => {
    expect(construirSystemPrompt(idioma)).toContain('No agregues requisitos, montos ni beneficios');
  });
});
