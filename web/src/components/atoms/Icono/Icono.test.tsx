import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Icono, NOMBRES_ICONO } from './Icono';

describe('Icono', () => {
  it('tiene los 17 nombres del design system', () => {
    expect(NOMBRES_ICONO).toHaveLength(19);
    expect(NOMBRES_ICONO).toContain('check');
    expect(NOMBRES_ICONO).toContain('banco');
  });

  it('renderiza el trazo correcto para "check"', () => {
    render(<Icono nombre="check" />);
    expect(screen.getByTestId('CheckRoundedIcon')).toBeInTheDocument();
  });

  it('respeta el tamaño pedido', () => {
    render(<Icono nombre="reloj" tamano={32} />);
    expect(screen.getByTestId('ScheduleRoundedIcon')).toHaveStyle({ fontSize: '32px' });
  });

  it('no fija un color propio, para heredar currentColor del texto que acompaña', () => {
    render(<Icono nombre="alerta" />);
    expect(screen.getByTestId('WarningAmberRoundedIcon')).not.toHaveAttribute('color');
  });
});
