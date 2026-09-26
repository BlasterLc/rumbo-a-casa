import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Simbolo } from './Simbolo';

describe('Simbolo', () => {
  it('usa la versión clara sobre fondo oscuro por defecto en tono claro', () => {
    render(<Simbolo tono="claro" />);
    const img = screen.getByRole('img', { name: 'Rumbo a Casa' });
    expect(img).toHaveAttribute('src', '/marca/rumbo-simbolo-oscuro.svg');
  });

  it('usa la versión a dos tintas por defecto', () => {
    render(<Simbolo />);
    expect(screen.getByRole('img', { name: 'Rumbo a Casa' })).toHaveAttribute('src', '/marca/rumbo-simbolo.svg');
  });

  it('respeta el tamaño pedido', () => {
    render(<Simbolo tamano={32} />);
    const img = screen.getByRole('img', { name: 'Rumbo a Casa' });
    expect(img).toHaveAttribute('width', '32');
    expect(img).toHaveAttribute('height', '32');
  });
});
