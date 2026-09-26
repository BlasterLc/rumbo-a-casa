import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderConIdioma } from '../../../test/utilidades';
import { PasoAPaso } from './PasoAPaso';

const pasos = ['Familia', 'Vivienda', 'Ahorro', 'Ingreso', 'Región'];

describe('PasoAPaso', () => {
  it('muestra el número y el total como dato, no solo la barra', () => {
    renderConIdioma(<PasoAPaso pasos={pasos} activo={2} />);
    expect(screen.getByText('Paso 3 de 5')).toBeInTheDocument();
  });

  it('los pasos ya contestados son tocables', async () => {
    const onActivarPaso = vi.fn();
    renderConIdioma(<PasoAPaso pasos={pasos} activo={2} onActivarPaso={onActivarPaso} />);
    await userEvent.click(screen.getByRole('button', { name: /Familia/ }));
    expect(onActivarPaso).toHaveBeenCalledWith(0);
  });

  it('los pasos pendientes no son tocables', () => {
    renderConIdioma(<PasoAPaso pasos={pasos} activo={2} onActivarPaso={vi.fn()} />);
    expect(screen.queryByRole('button', { name: /Región/ })).not.toBeInTheDocument();
  });

  it('nunca muestra más de seis pasos', () => {
    const muchos = ['1', '2', '3', '4', '5', '6', '7', '8'];
    renderConIdioma(<PasoAPaso pasos={muchos} activo={0} />);
    expect(screen.getByText('Paso 1 de 6')).toBeInTheDocument();
  });
});
