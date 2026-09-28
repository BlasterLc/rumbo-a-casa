import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderConIdioma, simularEscritorio, cssActual, type ControlEscritorio } from '../../../test/utilidades';
import { BurbujaChat } from './BurbujaChat';

/** jsdom no implementa la Web Speech API: se arma un doble mínimo para probar el botón «Escuchar». */
function instalarSpeechSynthesisFalso() {
  class UtteranceFalso {
    text: string;
    lang = '';
    onend: (() => void) | null = null;
    onerror: (() => void) | null = null;
    constructor(text: string) {
      this.text = text;
    }
  }
  const cancel = vi.fn();
  const speak = vi.fn();
  vi.stubGlobal('SpeechSynthesisUtterance', UtteranceFalso);
  vi.stubGlobal('speechSynthesis', { cancel, speak });
  return { cancel, speak };
}

describe('BurbujaChat', () => {
  beforeEach(() => {
    instalarSpeechSynthesisFalso();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('el turno del agente muestra el botón Escuchar con la palabra visible', () => {
    renderConIdioma(
      <BurbujaChat autor="agente" escuchable>
        Cuéntame de tu familia.
      </BurbujaChat>,
    );
    expect(screen.getByRole('button', { name: 'Escuchar' })).toBeInTheDocument();
  });

  it('el turno de la persona nunca muestra el botón Escuchar', () => {
    renderConIdioma(
      <BurbujaChat autor="persona" escuchable>
        Somos 4 personas.
      </BurbujaChat>,
    );
    expect(screen.queryByRole('button', { name: 'Escuchar' })).not.toBeInTheDocument();
  });

  it('un turno dictado se marca como editable, nunca se guarda en silencio', () => {
    renderConIdioma(
      <BurbujaChat autor="persona" dictado>
        Somos 4 personas.
      </BurbujaChat>,
    );
    expect(screen.getByText('Lo dijiste hablando · toca para corregir')).toBeInTheDocument();
  });

  it('"¿Por qué pregunto esto?" llama a onPorQue', async () => {
    const onPorQue = vi.fn();
    renderConIdioma(
      <BurbujaChat autor="agente" porQue onPorQue={onPorQue}>
        ¿Tienes ahorro?
      </BurbujaChat>,
    );
    await userEvent.click(screen.getByRole('button', { name: '¿Por qué pregunto esto?' }));
    expect(onPorQue).toHaveBeenCalledOnce();
  });
});

describe('BurbujaChat: botón Escuchar', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sin Web Speech API en el navegador no se muestra el botón', () => {
    renderConIdioma(
      <BurbujaChat autor="agente" escuchable>
        Cuéntame de tu familia.
      </BurbujaChat>,
    );
    expect(screen.queryByRole('button', { name: 'Escuchar' })).not.toBeInTheDocument();
  });

  it('clic en «Escuchar» manda el texto plano (sin **negrita**) a la voz del idioma activo', async () => {
    const { speak } = instalarSpeechSynthesisFalso();
    renderConIdioma(
      <BurbujaChat autor="agente" escuchable textoHablado="**Hola**, ¿cuántos son?">
        contenido no usado para hablar
      </BurbujaChat>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Escuchar' }));
    expect(speak).toHaveBeenCalledOnce();
    const utterance = speak.mock.calls[0][0];
    expect(utterance.text).toBe('Hola, ¿cuántos son?');
    expect(utterance.lang).toBe('es-CL');
  });

  it('mientras habla, el botón cambia a «Detener»; un segundo clic detiene la lectura', async () => {
    const { cancel } = instalarSpeechSynthesisFalso();
    renderConIdioma(
      <BurbujaChat autor="agente" escuchable textoHablado="Hola">
        contenido no usado para hablar
      </BurbujaChat>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Escuchar' }));
    expect(screen.getByRole('button', { name: 'Detener' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Detener' }));
    expect(cancel).toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Escuchar' })).toBeInTheDocument();
  });

  it('sin textoHablado, usa los `children` cuando son texto plano', async () => {
    const { speak } = instalarSpeechSynthesisFalso();
    renderConIdioma(<BurbujaChat autor="agente" escuchable>Cuéntame de tu familia.</BurbujaChat>);
    await userEvent.click(screen.getByRole('button', { name: 'Escuchar' }));
    expect(speak.mock.calls[0][0].text).toBe('Cuéntame de tu familia.');
  });
});

describe('BurbujaChat en escritorio', () => {
  let control: ControlEscritorio | undefined;
  beforeEach(() => {
    instalarSpeechSynthesisFalso();
  });
  afterEach(() => {
    control?.restaurar();
    control = undefined;
    vi.unstubAllGlobals();
  });

  it('en móvil "Escuchar" va encima de la burbuja, como hasta ahora', () => {
    renderConIdioma(
      <BurbujaChat autor="agente" escuchable>
        Cuéntame de tu familia.
      </BurbujaChat>,
    );
    const texto = screen.getByText('Cuéntame de tu familia.');
    const boton = screen.getByRole('button', { name: 'Escuchar' });
    expect(boton.compareDocumentPosition(texto) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('en escritorio "Escuchar" y "¿Por qué pregunto esto?" van debajo de la burbuja', () => {
    control = simularEscritorio(true);
    renderConIdioma(
      <BurbujaChat autor="agente" escuchable porQue>
        Cuéntame de tu familia.
      </BurbujaChat>,
    );
    const texto = screen.getByText('Cuéntame de tu familia.');
    const escuchar = screen.getByRole('button', { name: 'Escuchar' });
    const porQue = screen.getByRole('button', { name: '¿Por qué pregunto esto?' });
    expect(texto.compareDocumentPosition(escuchar) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(escuchar.compareDocumentPosition(porQue) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('en escritorio la burbuja de la persona no muestra Escuchar y se alinea a la derecha', () => {
    control = simularEscritorio(true);
    renderConIdioma(
      <BurbujaChat autor="persona" escuchable>
        Somos 4 personas.
      </BurbujaChat>,
    );
    expect(screen.queryByRole('button', { name: 'Escuchar' })).not.toBeInTheDocument();
    expect(cssActual()).toMatch(/@media \(min-width:900px\)\s*\{[^}]*align-self:\s*flex-end/);
  });

  it('el ancho máximo sube a 62 ch desde 900 px', () => {
    renderConIdioma(<BurbujaChat autor="agente">Hola.</BurbujaChat>);
    expect(cssActual()).toMatch(/@media \(min-width:900px\)\s*\{[^}]*max-width:\s*62ch/);
  });
});
