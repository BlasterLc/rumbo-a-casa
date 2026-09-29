import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Columnas } from './Columnas';
import { cssActual } from '../../../test/utilidades';

describe('Columnas', () => {
  it('muestra todos sus hijos en el orden dado', () => {
    render(
      <Columnas>
        <div>primero</div>
        <div>segundo</div>
      </Columnas>,
    );
    const textos = screen.getAllByText(/primero|segundo/).map((el) => el.textContent);
    expect(textos).toEqual(['primero', 'segundo']);
  });

  it('bajo 900 px es una sola columna y desde 900 px son dos iguales', () => {
    render(
      <Columnas>
        <div>a</div>
      </Columnas>,
    );
    const css = cssActual();
    expect(css).toMatch(/display:\s*grid/);
    expect(css).toMatch(/grid-template-columns:\s*minmax\(0,\s*1fr\)/);
    expect(css).toMatch(
      /@media \(min-width:900px\)\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/,
    );
  });

  it('acepta una plantilla propia para columnas desiguales', () => {
    render(
      <Columnas plantilla="minmax(0, 1fr) 340px">
        <div>a</div>
      </Columnas>,
    );
    expect(cssActual()).toMatch(/@media \(min-width:900px\)\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)\s*340px/);
  });

  it('separa las filas con el valor responsive que se le pase', () => {
    render(
      <Columnas espacioFila={{ xs: '7px', md: '31px' }}>
        <div>a</div>
      </Columnas>,
    );
    const css = cssActual();
    expect(css).toMatch(/row-gap:\s*7px/);
    expect(css).toMatch(/@media \(min-width:900px\)\s*\{[^}]*row-gap:\s*31px/);
  });
});
