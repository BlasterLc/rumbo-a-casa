import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Logotipo } from './Logotipo';

describe('Logotipo', () => {
  it('en disposición simbolo, no muestra el nombre', () => {
    render(<Logotipo disposicion="simbolo" />);
    expect(screen.getByRole('img', { name: 'Rumbo a Casa' })).toBeInTheDocument();
    expect(screen.queryByText('Rumbo a Casa')).not.toBeInTheDocument();
  });

  it('en horizontal, el nombre va junto al símbolo en una sola línea', () => {
    render(<Logotipo disposicion="horizontal" />);
    expect(screen.getByText('Rumbo a Casa')).toBeInTheDocument();
    expect(screen.getByRole('img')).toBeInTheDocument();
  });

  it('en vertical, el nombre va en dos líneas bajo el símbolo', () => {
    const { container } = render(<Logotipo disposicion="vertical" />);
    expect(container.querySelector('br')).toBeInTheDocument();
  });

  it('en tono claro, usa la versión del símbolo para fondo oscuro', () => {
    render(<Logotipo tono="claro" />);
    expect(screen.getByRole('img')).toHaveAttribute('src', '/marca/rumbo-simbolo-oscuro.svg');
  });

  it('en tono monocromo, usa la versión de una tinta del símbolo', () => {
    render(<Logotipo tono="monocromo" />);
    expect(screen.getByRole('img')).toHaveAttribute('src', '/marca/rumbo-simbolo-monocromo.svg');
  });
});
