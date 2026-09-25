import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderConIdioma } from '../../../test/utilidades';
import { CampoTexto } from './CampoTexto';

describe('CampoTexto', () => {
  it('usa la pregunta como etiqueta y la ayuda como texto de apoyo', () => {
    renderConIdioma(
      <CampoTexto
        pregunta="¿Cuántas personas viven contigo?"
        ayuda="Con esto vemos tu grupo familiar."
        value=""
        onChange={() => {}}
      />,
    );
    expect(screen.getByLabelText('¿Cuántas personas viven contigo?')).toBeInTheDocument();
    expect(screen.getByText('Con esto vemos tu grupo familiar.')).toBeInTheDocument();
  });

  it('el error reemplaza la ayuda y marca el campo inválido', () => {
    renderConIdioma(
      <CampoTexto
        pregunta="¿Cuánto tienes ahorrado?"
        ayuda="Con esto vemos si alcanzas el mínimo del programa."
        error="Escribe solo números, sin puntos ni signo peso."
        value=""
        onChange={() => {}}
      />,
    );
    expect(screen.getByText('Escribe solo números, sin puntos ni signo peso.')).toBeInTheDocument();
    expect(screen.queryByText('Con esto vemos si alcanzas el mínimo del programa.')).not.toBeInTheDocument();
    expect(screen.getByLabelText('¿Cuánto tienes ahorrado?')).toBeInvalid();
  });

  it('muestra el botón de dictado cuando se pide, con su etiqueta traducida', () => {
    renderConIdioma(<CampoTexto pregunta="¿En qué región vives?" dictado value="" onChange={() => {}} />);
    expect(screen.getByRole('button', { name: 'Dictar por voz' })).toBeInTheDocument();
  });

  it('el botón de dictado llama a onDictar al presionarlo, para que quien use el campo lo cablee', async () => {
    const onDictar = vi.fn();
    renderConIdioma(
      <CampoTexto pregunta="¿En qué región vives?" dictado onDictar={onDictar} value="" onChange={() => {}} />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Dictar por voz' }));
    expect(onDictar).toHaveBeenCalledOnce();
  });

  it('muestra la equivalencia calculada bajo el campo, en vez de pedirla directamente en UF', () => {
    renderConIdioma(
      <CampoTexto pregunta="¿Cuánto tienes ahorrado?" equivalencia="12,3 UF" value="500000" onChange={() => {}} />,
    );
    expect(screen.getByText('12,3 UF')).toBeInTheDocument();
  });
});
