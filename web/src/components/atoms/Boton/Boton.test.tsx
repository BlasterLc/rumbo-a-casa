import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Boton } from './Boton';

describe('Boton', () => {
  it('es "contained" por defecto, la jerarquía de acción principal', () => {
    render(<Boton>Ver mi plan</Boton>);
    expect(screen.getByRole('button', { name: 'Ver mi plan' })).toHaveClass('MuiButton-contained');
  });

  it('muestra el icono inicial cuando se pide', () => {
    render(<Boton icono="externo">Ir a postulacionenlinea.minvu.cl</Boton>);
    expect(screen.getByTestId('OpenInNewRoundedIcon')).toBeInTheDocument();
  });

  it('se deshabilita y marca aria-busy mientras carga, sin perder su texto', () => {
    render(<Boton loading>Guardando…</Boton>);
    const boton = screen.getByRole('button', { name: 'Guardando…' });
    expect(boton).toBeDisabled();
    expect(boton).toHaveAttribute('aria-busy', 'true');
  });

  it('llama a onClick al presionar', async () => {
    const onClick = vi.fn();
    render(<Boton onClick={onClick}>Guardar y seguir</Boton>);
    await userEvent.click(screen.getByRole('button', { name: 'Guardar y seguir' }));
    expect(onClick).toHaveBeenCalledOnce();
  });
});
