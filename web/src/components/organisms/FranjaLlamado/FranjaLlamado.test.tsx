import { describe, it, expect, afterEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderConIdioma } from '../../../test/utilidades';
import { FranjaLlamado } from './FranjaLlamado';

describe('FranjaLlamado', () => {
  afterEach(() => window.localStorage.clear());

  it('invita a empezar y muestra los botones que recibe', () => {
    renderConIdioma(
      <FranjaLlamado>
        <button>Empezar</button>
      </FranjaLlamado>,
    );
    expect(screen.getByRole('heading', { level: 2, name: '¿Vemos a qué puedes postular?' })).toBeInTheDocument();
    expect(screen.getByText('Toma unos 5 minutos. Sin registro, sin Clave Única, gratis.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Empezar' })).toBeInTheDocument();
  });

  it('en inglés no deja texto en español', () => {
    window.localStorage.setItem('rumbo-idioma', 'en');
    renderConIdioma(<FranjaLlamado>{null}</FranjaLlamado>);
    expect(screen.getByText('Shall we see what you can apply for?')).toBeInTheDocument();
    expect(screen.queryByText(/Vemos|Toma unos/)).not.toBeInTheDocument();
  });
});
