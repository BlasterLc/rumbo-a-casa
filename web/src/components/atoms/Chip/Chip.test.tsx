import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChipFiltro, ChipEtiqueta } from './Chip';

describe('ChipFiltro', () => {
  it('mide al menos 48 px de alto, aunque el texto sea corto', () => {
    render(<ChipFiltro label="Arriendo" />);
    expect(screen.getByText('Arriendo').closest('.MuiChip-root')).toHaveStyle({ height: '48px' });
  });

  it('el filtro activo se marca con fondo y borde, no solo con un color', () => {
    render(<ChipFiltro label="Sin crédito" activo />);
    const chip = screen.getByText('Sin crédito').closest('.MuiChip-root') as HTMLElement;
    expect(chip).toHaveStyle({ backgroundColor: 'rgb(228, 237, 248)' });
  });
});

describe('ChipEtiqueta', () => {
  it('muestra la etiqueta informativa', () => {
    render(<ChipEtiqueta label="Región del Biobío" />);
    expect(screen.getByText('Región del Biobío')).toBeInTheDocument();
  });
});
