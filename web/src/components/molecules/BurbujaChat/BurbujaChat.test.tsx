import { describe, it, expect, vi, afterEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderConIdioma, simularEscritorio, cssActual, type ControlEscritorio } from '../../../test/utilidades';
import { BurbujaChat } from './BurbujaChat';

describe('BurbujaChat', () => {
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

describe('BurbujaChat en escritorio', () => {
  let control: ControlEscritorio | undefined;
  afterEach(() => {
    control?.restaurar();
    control = undefined;
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
