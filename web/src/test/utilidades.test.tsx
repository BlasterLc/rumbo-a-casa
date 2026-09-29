import { describe, it, expect } from 'vitest';
import { Button } from '@mui/material';
import { screen } from '@testing-library/react';
import { renderConIdioma, renderPantalla, simularEscritorio, cssActual } from './utilidades';

describe('renderConIdioma', () => {
  it('aplica el tema temaRumbo, para que los defaultProps de MUI se apliquen en los tests', () => {
    renderConIdioma(<Button>Ver mi plan</Button>);
    expect(screen.getByRole('button', { name: 'Ver mi plan' })).toHaveClass('MuiButton-contained');
  });
});

describe('renderPantalla', () => {
  it('aplica el tema temaRumbo, para que los defaultProps de MUI se apliquen en los tests', () => {
    renderPantalla(<Button>Ver mi plan</Button>);
    expect(screen.getByRole('button', { name: 'Ver mi plan' })).toHaveClass('MuiButton-contained');
  });
});

describe('simularEscritorio', () => {
  it('simula una ventana ancha, avisa al cambiar y luego se restaura', () => {
    expect(window.matchMedia).toBeUndefined();
    const control = simularEscritorio(true);
    expect(window.matchMedia('(min-width:900px)').matches).toBe(true);
    control.cambiar(false);
    expect(window.matchMedia('(min-width:900px)').matches).toBe(false);
    control.restaurar();
    expect(window.matchMedia).toBeUndefined();
  });
});

describe('cssActual', () => {
  it('devuelve el CSS que emotion inyectó, incluidas las reglas @media', () => {
    renderConIdioma(<Button sx={{ mt: { md: 3 } }}>Ver mi plan</Button>);
    expect(cssActual()).toMatch(/@media \(min-width:900px\)/);
  });
});
