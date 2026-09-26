import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderConIdioma } from '../../../test/utilidades';
import { SelloElegibilidad } from './SelloElegibilidad';

describe('SelloElegibilidad', () => {
  it('muestra la palabra "Califica" dentro del sello, no solo el color', () => {
    renderConIdioma(<SelloElegibilidad estado="califica" />);
    expect(screen.getByText('Califica')).toBeInTheDocument();
  });

  it('nunca escribe "rechazado" ni "no cumple" para noAplica', () => {
    renderConIdioma(<SelloElegibilidad estado="noAplica" />);
    expect(screen.getByText('No aplica')).toBeInTheDocument();
    expect(screen.queryByText(/rechazad/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/no cumple/i)).not.toBeInTheDocument();
  });

  it('con programa, antepone la sigla a la palabra', () => {
    renderConIdioma(<SelloElegibilidad estado="falta" programa="DS49" />);
    expect(screen.getByText('DS49 · Falta un dato')).toBeInTheDocument();
  });

  it('en compacto baja de tamaño pero conserva el texto', () => {
    renderConIdioma(<SelloElegibilidad estado="posible" compacto />);
    const chip = screen.getByText('Posible').closest('.MuiChip-root');
    expect(chip).toHaveStyle({ height: '26px' });
  });
});
