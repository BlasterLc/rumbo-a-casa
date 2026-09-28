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

  it('el prompt en inglés repite en inglés la directiva de idioma; el de español no', () => {
    expect(construirSystemPrompt('en')).toContain('Always reply in English');
    expect(construirSystemPrompt('es')).not.toContain('Always reply in English');
  });

  it('en español pide tuteo singular y prohíbe usted, ustedes e impersonal', () => {
    const es = construirSystemPrompt('es');
    expect(es).toContain('Háblale de tú, siempre en singular');
    expect(es).toContain('Nunca "usted", "ustedes"');
    expect(es).not.toContain('How you speak (English)');
  });

  it('en español el tuteo singular vale aunque la persona hable en plural, con ejemplos', () => {
    const es = construirSystemPrompt('es');
    expect(es).toContain('Aunque hable en plural');
    expect(es).toContain('¿En qué región vives?');
    expect(es).toContain('¿Tú o alguien de tu grupo familiar es dueño de una vivienda?');
  });

  it.each(['es', 'en'] as const)('[%s] solo permite la negrita como formato, que es lo único que la interfaz dibuja', (idioma) => {
    const prompt = construirSystemPrompt(idioma);
    expect(prompt).toContain(idioma === 'es' ? '**negrita**' : '**bold**');
    expect(prompt).toContain(idioma === 'es' ? 'No uses ninguna otra marca de Markdown' : 'Do not use any other Markdown');
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

  it.each(['es', 'en'] as const)(
    '[%s] prohíbe decir que un programa califica sin el resultado de evaluar_elegibilidad de ese mismo turno',
    (idioma) => {
      expect(construirSystemPrompt(idioma)).toContain(
        'Nunca digas "calificas", "no calificas" ni ningún equivalente',
      );
    },
  );
});
