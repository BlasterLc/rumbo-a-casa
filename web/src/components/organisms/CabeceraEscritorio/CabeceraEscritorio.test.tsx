import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderConIdioma } from '../../../test/utilidades';
import { CabeceraEscritorio } from './CabeceraEscritorio';

describe('CabeceraEscritorio', () => {
  it('lleva la marca, la etiqueta de "no oficial" y el selector de idioma, sin navegación', () => {
    renderConIdioma(<CabeceraEscritorio onInicio={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Rumbo a Casa · Inicio' })).toBeInTheDocument();
    expect(screen.getByText('Herramienta no oficial')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Español' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'English' })).toBeInTheDocument();
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  it('tocar la marca lleva al inicio', async () => {
    const onInicio = vi.fn();
    renderConIdioma(<CabeceraEscritorio onInicio={onInicio} />);
    await userEvent.click(screen.getByRole('button', { name: 'Rumbo a Casa · Inicio' }));
    expect(onInicio).toHaveBeenCalledOnce();
  });
});
