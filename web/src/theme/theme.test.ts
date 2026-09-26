import { describe, it, expect } from 'vitest';
import { temaRumbo } from './theme';
import { color } from './tokens';

describe('temaRumbo', () => {
  it('usa el azul de marca como color primario y el terracota como secundario', () => {
    expect(temaRumbo.palette.primary.main).toBe(color.brand);
    expect(temaRumbo.palette.secondary.main).toBe(color.accent);
  });

  it('el texto sobre un relleno es siempre ink-on-fill, nunca blanco literal fuera del token', () => {
    expect(temaRumbo.palette.primary.contrastText).toBe(color['ink-on-fill']);
  });

  it('los botones no usan elevación por sombra para jerarquía', () => {
    expect(temaRumbo.components?.MuiButton?.defaultProps?.disableElevation).toBe(true);
  });
});
