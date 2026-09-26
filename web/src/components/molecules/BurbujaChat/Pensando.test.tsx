import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderConIdioma } from '../../../test/utilidades';
import { Pensando } from './Pensando';

describe('Pensando', () => {
  it('nunca son solo tres puntitos: dice en qué está el agente', () => {
    renderConIdioma(<Pensando>Revisando el llamado de noviembre del DS1</Pensando>);
    expect(screen.getByText('Revisando el llamado de noviembre del DS1')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
});
