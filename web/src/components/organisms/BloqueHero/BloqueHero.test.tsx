import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { cssActual } from '../../../test/utilidades';
import { BloqueHero } from './BloqueHero';

describe('BloqueHero', () => {
  it('muestra el título y la bajada', () => {
    render(<BloqueHero titulo="Calificas para dos programas" bajada="Revisa el detalle de cada uno." />);
    expect(screen.getByText('Calificas para dos programas')).toBeInTheDocument();
    expect(screen.getByText('Revisa el detalle de cada uno.')).toBeInTheDocument();
  });

  it('muestra los chips de programas', () => {
    render(<BloqueHero titulo="Averigua a qué subsidio puedes postular" chips={['DS49', 'DS1', 'DS19', 'DS52']} />);
    expect(screen.getByText('DS49')).toBeInTheDocument();
    expect(screen.getByText('DS52')).toBeInTheDocument();
  });

  it('lleva la franja de marca al pie', () => {
    render(<BloqueHero titulo="Rumbo a Casa" />);
    expect(screen.getByTestId('franja')).toBeInTheDocument();
  });

  it('el título es el h1 de la pantalla', () => {
    render(<BloqueHero titulo="Calificas para 2 programas" />);
    expect(screen.getByRole('heading', { level: 1, name: 'Calificas para 2 programas' })).toBeInTheDocument();
  });

  it('desde 900 px pone el texto a la izquierda y los chips a la derecha', () => {
    render(<BloqueHero titulo="Calificas" chips={['DS49']} />);
    expect(cssActual()).toMatch(/@media \(min-width:900px\)\s*\{[^}]*flex-direction:\s*row/);
  });
});
