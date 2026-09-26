import { describe, it, expect, vi, afterEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderConIdioma } from '../../../test/utilidades';
import { CabeceraEscritorio } from './CabeceraEscritorio';

describe('CabeceraEscritorio', () => {
  afterEach(() => window.localStorage.clear());

  it('lleva la marca, la navegación y el selector de idioma', () => {
    renderConIdioma(<CabeceraEscritorio destino="hablar" onNavegar={vi.fn()} onInicio={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Rumbo a Casa · Inicio' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Navegación principal' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Español' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'English' })).toBeInTheDocument();
  });

  it('tocar la marca lleva al inicio', async () => {
    const onInicio = vi.fn();
    renderConIdioma(<CabeceraEscritorio destino="hablar" onNavegar={vi.fn()} onInicio={onInicio} />);
    await userEvent.click(screen.getByRole('button', { name: 'Rumbo a Casa · Inicio' }));
    expect(onInicio).toHaveBeenCalledOnce();
  });

  it('tocar un destino llama a onNavegar con ese destino', async () => {
    const onNavegar = vi.fn();
    renderConIdioma(<CabeceraEscritorio destino="hablar" onNavegar={onNavegar} onInicio={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: /Avisos/ }));
    expect(onNavegar).toHaveBeenCalledWith('avisos');
  });

  it('en inglés el botón de la marca dice Home', () => {
    window.localStorage.setItem('rumbo-idioma', 'en');
    renderConIdioma(<CabeceraEscritorio destino="hablar" onNavegar={vi.fn()} onInicio={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Rumbo a Casa · Home' })).toBeInTheDocument();
  });
});
