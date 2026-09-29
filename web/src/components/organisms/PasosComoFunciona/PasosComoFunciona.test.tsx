import { describe, it, expect, afterEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderConIdioma } from '../../../test/utilidades';
import { PasosComoFunciona } from './PasosComoFunciona';

describe('PasosComoFunciona', () => {
  afterEach(() => window.localStorage.clear());

  it('tiene su propio encabezado, para que no quede anidada bajo el h2 de PanelProgramas', () => {
    renderConIdioma(<PasosComoFunciona />);
    expect(screen.getByRole('heading', { level: 2, name: 'Cómo funciona' })).toBeInTheDocument();
  });

  it('muestra los tres pasos numerados, en orden', () => {
    renderConIdioma(<PasosComoFunciona />);
    const titulos = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
    expect(titulos).toEqual([
      'Cuéntanos de tu familia',
      'Mira tu resultado',
      'Arma tu plan y postula',
    ]);
  });

  it('en inglés traduce los tres pasos', () => {
    window.localStorage.setItem('rumbo-idioma', 'en');
    renderConIdioma(<PasosComoFunciona />);
    expect(screen.getByText('Tell us about your family')).toBeInTheDocument();
  });
});
