import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderConIdioma } from '../../../test/utilidades';
import { BarraInferior } from './BarraInferior';

describe('BarraInferior', () => {
  it('tiene los cuatro destinos fijos, siempre con su etiqueta visible', () => {
    renderConIdioma(<BarraInferior value="hablar" />);
    expect(screen.getByRole('button', { name: /Hablar/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Mi plan/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Documentos/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Avisos/ })).toBeInTheDocument();
  });

  it('muestra el número de avisos, no solo un punto', () => {
    renderConIdioma(<BarraInferior value="hablar" avisos={2} />);
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('llama a onChange con el destino elegido', async () => {
    const onChange = vi.fn();
    renderConIdioma(<BarraInferior value="hablar" onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: /Mi plan/ }));
    expect(onChange).toHaveBeenCalled();
    expect(onChange.mock.calls[0][1]).toBe('plan');
  });
});
