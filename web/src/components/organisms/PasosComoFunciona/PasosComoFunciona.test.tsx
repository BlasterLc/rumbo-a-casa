import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderConIdioma } from '../../../test/utilidades';
import { PasosComoFunciona } from './PasosComoFunciona';

describe('PasosComoFunciona', () => {
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
    window.localStorage.clear();
  });
});
