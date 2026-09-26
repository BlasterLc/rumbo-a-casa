import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderConIdioma } from '../../../test/utilidades';
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
