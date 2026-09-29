import { describe, it, expect, afterEach } from 'vitest';
import { screen, within } from '@testing-library/react';
import { renderConIdioma } from '../../../test/utilidades';
import { QuienHaceQue } from './QuienHaceQue';

describe('QuienHaceQue', () => {
  afterEach(() => window.localStorage.clear());

  it('separa lo que hace Rumbo a Casa de lo que hace la persona', () => {
    renderConIdioma(<QuienHaceQue />);
    expect(screen.getByRole('heading', { level: 2, name: 'Cada quien hace su parte, sin sorpresas' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Rumbo a Casa' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Tú' })).toBeInTheDocument();
    const listas = screen.getAllByRole('list');
    expect(within(listas[0]).getAllByRole('listitem')).toHaveLength(4);
    expect(within(listas[1]).getAllByRole('listitem')).toHaveLength(3);
  });

  it('recuerda que nunca se pide la Clave Única', () => {
    renderConIdioma(<QuienHaceQue />);
    expect(screen.getByText(/Nunca pedimos tu Clave Única/)).toBeInTheDocument();
  });

  it('en inglés no deja texto en español', () => {
    window.localStorage.setItem('rumbo-idioma', 'en');
    renderConIdioma(<QuienHaceQue />);
    expect(screen.getByText('Everyone does their part, no surprises')).toBeInTheDocument();
    expect(screen.queryByText(/Cada quien|Lo que hace/)).not.toBeInTheDocument();
  });
});
