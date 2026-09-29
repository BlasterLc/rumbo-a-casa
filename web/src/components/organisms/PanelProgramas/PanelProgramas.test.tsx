import { describe, it, expect, afterEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderConIdioma } from '../../../test/utilidades';
import { PanelProgramas } from './PanelProgramas';

describe('PanelProgramas', () => {
  afterEach(() => window.localStorage.clear());

  it('lista los cuatro programas con su sigla, su nombre común y una línea', () => {
    renderConIdioma(<PanelProgramas />);
    expect(screen.getByText('Revisamos tus cuatro programas')).toBeInTheDocument();
    for (const sigla of ['DS49', 'DS1', 'DS19', 'DS52']) expect(screen.getByText(sigla)).toBeInTheDocument();
    expect(screen.getByText('Casa propia sin crédito')).toBeInTheDocument();
    expect(screen.getByText('Arriendo')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(4);
  });

  it('en inglés no deja texto en español', () => {
    window.localStorage.setItem('rumbo-idioma', 'en');
    renderConIdioma(<PanelProgramas />);
    expect(screen.getByText('We check four programs for you')).toBeInTheDocument();
    expect(screen.getByText('A home with no mortgage')).toBeInTheDocument();
    expect(screen.queryByText(/Revisamos|Casa propia|Arriendo/)).not.toBeInTheDocument();
  });
});
