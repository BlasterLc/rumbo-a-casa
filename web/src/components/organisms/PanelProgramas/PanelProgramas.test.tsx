import { describe, it, expect, afterEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderConIdioma } from '../../../test/utilidades';
import { PanelProgramas } from './PanelProgramas';

describe('PanelProgramas', () => {
  afterEach(() => window.localStorage.clear());

  it('aclara que no es del Estado y lista los cuatro programas con su sigla y una línea', () => {
    renderConIdioma(<PanelProgramas />);
    expect(screen.getByRole('heading', { level: 2, name: 'Tú postulas. Nosotros te preparamos.' })).toBeInTheDocument();
    expect(screen.getByText(/Esto no es un sitio del Estado/)).toBeInTheDocument();
    for (const sigla of ['DS49', 'DS1', 'DS19', 'DS52']) expect(screen.getByText(sigla)).toBeInTheDocument();
    expect(screen.getByText(/la casa propia sin crédito hipotecario/)).toBeInTheDocument();
    expect(screen.getByText(/subsidio de arriendo/)).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(4);
  });

  it('en inglés no deja texto en español', () => {
    window.localStorage.setItem('rumbo-idioma', 'en');
    renderConIdioma(<PanelProgramas />);
    expect(screen.getByText('You apply. We get you ready.')).toBeInTheDocument();
    expect(screen.getByText(/your own home, no mortgage loan/)).toBeInTheDocument();
    expect(screen.queryByText(/postulas|Programas que revisamos|arriendo/)).not.toBeInTheDocument();
  });
});
