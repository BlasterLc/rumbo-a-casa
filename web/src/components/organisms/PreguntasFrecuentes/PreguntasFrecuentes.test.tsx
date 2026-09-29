import { describe, it, expect, afterEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderConIdioma } from '../../../test/utilidades';
import { PreguntasFrecuentes } from './PreguntasFrecuentes';

describe('PreguntasFrecuentes', () => {
  afterEach(() => window.localStorage.clear());

  it('muestra las seis preguntas, cerradas', () => {
    renderConIdioma(<PreguntasFrecuentes />);
    expect(screen.getByRole('heading', { level: 2, name: 'Lo que la gente nos pregunta' })).toBeInTheDocument();
    const preguntas = screen.getAllByRole('button');
    expect(preguntas).toHaveLength(6);
    for (const p of preguntas) expect(p).toHaveAttribute('aria-expanded', 'false');
  });

  it('al tocar una pregunta se abre su respuesta, y al volver a tocarla se cierra', async () => {
    renderConIdioma(<PreguntasFrecuentes />);
    const pregunta = screen.getByRole('button', { name: '¿Me piden mi Clave Única?' });
    await userEvent.click(pregunta);
    expect(pregunta).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(/Nunca\. Solo la usas tú/)).toBeVisible();
    await userEvent.click(pregunta);
    expect(pregunta).toHaveAttribute('aria-expanded', 'false');
  });

  it('en inglés no deja texto en español', () => {
    window.localStorage.setItem('rumbo-idioma', 'en');
    renderConIdioma(<PreguntasFrecuentes />);
    expect(screen.getByRole('button', { name: 'Is the result final?' })).toBeInTheDocument();
    expect(screen.queryByText(/¿|Necesito|Tiene algún/)).not.toBeInTheDocument();
  });
});
