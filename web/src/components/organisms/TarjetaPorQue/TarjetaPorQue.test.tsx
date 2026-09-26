import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderConIdioma } from '../../../test/utilidades';
import { TarjetaPorQue } from './TarjetaPorQue';

const reglas = [
  {
    enunciado: 'Tramo del Registro Social de Hogares de 40% o menos.',
    tuDato: '30,4%',
    cumple: true,
    fuente: 'D.S. N°49, artículo 4',
  },
  {
    enunciado: 'Ahorro mínimo de 10 UF.',
    tuDato: '8 UF',
    cumple: false,
    fuente: 'D.S. N°49, artículo 5',
    arreglo: 'Ahorra 2 UF más antes del cierre del llamado.',
  },
];

describe('TarjetaPorQue', () => {
  it('arranca cerrada', () => {
    renderConIdioma(<TarjetaPorQue titulo="Por qué calificas para DS49" reglas={reglas} />);
    expect(screen.getByRole('button', { name: /Por qué calificas para DS49/ })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });

  it('cada fila muestra el enunciado, el dato de la persona y la fuente', async () => {
    renderConIdioma(<TarjetaPorQue titulo="Por qué calificas para DS49" reglas={reglas} />);
    await userEvent.click(screen.getByRole('button', { name: /Por qué calificas para DS49/ }));
    expect(screen.getByText('Tramo del Registro Social de Hogares de 40% o menos.')).toBeInTheDocument();
    expect(screen.getByText('Tu dato: 30,4%')).toBeInTheDocument();
    expect(screen.getByText('Fuente: D.S. N°49, artículo 4')).toBeInTheDocument();
  });

  it('una regla que no se cumple ofrece un arreglo cuando es alcanzable', async () => {
    renderConIdioma(<TarjetaPorQue titulo="Por qué calificas para DS49" reglas={reglas} />);
    await userEvent.click(screen.getByRole('button', { name: /Por qué calificas para DS49/ }));
    expect(screen.getByText('Ahorra 2 UF más antes del cierre del llamado.')).toBeInTheDocument();
  });

  it('muestra con qué versión de reglas se calculó, en el pie', async () => {
    renderConIdioma(
      <TarjetaPorQue titulo="Por qué calificas para DS49" reglas={reglas} pie="Reglas al 22 de septiembre de 2026." />,
    );
    await userEvent.click(screen.getByRole('button', { name: /Por qué calificas para DS49/ }));
    expect(screen.getByText('Reglas al 22 de septiembre de 2026.')).toBeInTheDocument();
  });
});
