import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OpcionTarjeta } from './OpcionTarjeta';

const opciones = [
  { value: 'allegado', titulo: 'Vivo de allegado', detalle: 'En la casa de un familiar, sin contrato.' },
  { value: 'arriendo', titulo: 'Arriendo', detalle: 'Pago arriendo mensual.' },
  { value: 'no_seguro', titulo: 'No estoy seguro' },
];

describe('OpcionTarjeta', () => {
  it('muestra la pregunta y cada opción con su título y detalle', () => {
    render(<OpcionTarjeta pregunta="¿Dónde vives hoy?" opciones={opciones} name="vivienda" />);
    expect(screen.getByText('¿Dónde vives hoy?')).toBeInTheDocument();
    expect(screen.getByText('Vivo de allegado')).toBeInTheDocument();
    expect(screen.getByText('En la casa de un familiar, sin contrato.')).toBeInTheDocument();
  });

  it('"No estoy seguro" es una opción válida, sin detalle obligatorio', () => {
    render(<OpcionTarjeta opciones={opciones} name="vivienda" />);
    expect(screen.getByText('No estoy seguro')).toBeInTheDocument();
  });

  it('llama a onChange con el value de la opción elegida', async () => {
    const onChange = vi.fn();
    render(<OpcionTarjeta opciones={opciones} name="vivienda" onChange={onChange} />);
    await userEvent.click(screen.getByText('Arriendo'));
    expect(onChange).toHaveBeenCalled();
    expect((onChange.mock.calls[0][0] as { target: { value: string } }).target.value).toBe('arriendo');
  });
});
