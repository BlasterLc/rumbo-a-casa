import { describe, it, expect } from 'vitest';
import { Button } from '@mui/material';
import { screen } from '@testing-library/react';
import { renderConIdioma, renderPantalla } from './utilidades';

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
