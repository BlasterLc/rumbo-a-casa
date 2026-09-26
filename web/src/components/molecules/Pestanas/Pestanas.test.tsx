import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Pestanas } from './Pestanas';

const pestanas = [
  { valor: 'califica', etiqueta: 'Calificas', cuenta: 2 },
  { valor: 'falta', etiqueta: 'Te falta', cuenta: 1 },
  { valor: 'no_aplica', etiqueta: 'No aplica' },
];

describe('Pestanas', () => {
  it('sin value, arranca en la primera pestaña', () => {
    render(<Pestanas pestanas={pestanas} />);
    expect(screen.getByRole('tab', { name: /Calificas/ })).toHaveAttribute('aria-selected', 'true');
  });

  it('la cuenta se ve como número, no como punto', () => {
    render(<Pestanas pestanas={pestanas} />);
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('llama a onChange con el value de la pestaña elegida', async () => {
    const onChange = vi.fn();
    render(<Pestanas pestanas={pestanas} value="califica" onChange={onChange} />);
    await userEvent.click(screen.getByRole('tab', { name: /Te falta/ }));
    expect(onChange).toHaveBeenCalledWith(expect.anything(), 'falta');
  });

  it('nunca muestra más de cuatro pestañas', () => {
    const cinco = [...pestanas, { valor: 'x', etiqueta: 'Extra' }, { valor: 'y', etiqueta: 'Otra' }];
    render(<Pestanas pestanas={cinco} />);
    expect(screen.getAllByRole('tab')).toHaveLength(4);
  });
});
