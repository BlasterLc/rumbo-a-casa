import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Franja } from './Franja';

describe('Franja', () => {
  it('usa el alto pedido', () => {
    const { getByTestId } = render(<Franja alto={96} />);
    expect(getByTestId('franja')).toHaveAttribute('height', '96');
  });

  it('en tono brand pinta el fondo surface-brand y agrega la huella de discos', () => {
    const { container } = render(<Franja tono="brand" />);
    const rects = container.querySelectorAll('rect');
    expect(rects[0]).toHaveAttribute('fill', 'var(--surface-brand)');
    expect(container.querySelectorAll('circle')).toHaveLength(4); // 1 arco + 3 discos
  });

  it('en tono accent lleva un máximo de dos tintas: fondo y arco, sin huella', () => {
    const { container } = render(<Franja tono="accent" />);
    expect(container.querySelectorAll('circle')).toHaveLength(1);
  });

  it('con alto 24 sirve como firma de cabecera', () => {
    const { getByTestId } = render(<Franja alto={24} />);
    expect(getByTestId('franja')).toHaveAttribute('height', '24');
  });

  it('repite el patrón cada 96 px en vez de estirarlo al ancho de la pantalla', () => {
    const { getByTestId, container } = render(<Franja alto={96} />);
    expect(getByTestId('franja')).not.toHaveAttribute('viewBox');
    expect(getByTestId('franja')).not.toHaveAttribute('preserveAspectRatio');
    expect(container.querySelector('pattern')).toHaveAttribute('width', '96');
  });
});
