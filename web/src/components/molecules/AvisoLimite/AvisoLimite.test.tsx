import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderConIdioma } from '../../../test/utilidades';
import { AvisoLimite } from './AvisoLimite';

describe('AvisoLimite', () => {
  it('dice siempre que nunca se pide la Clave Única', () => {
    renderConIdioma(<AvisoLimite />);
    expect(screen.getByText(/Nunca te pedimos tu Clave Única/)).toBeInTheDocument();
  });

  it('sin conSalida, no muestra el enlace al sitio del MINVU', () => {
    renderConIdioma(<AvisoLimite />);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('con conSalida, muestra el dominio completo y abre en una pestaña nueva del navegador', () => {
    renderConIdioma(<AvisoLimite conSalida />);
    const enlace = screen.getByRole('link', { name: /postulacionenlinea\.minvu\.cl/ });
    expect(enlace).toHaveAttribute('href', 'https://postulacionenlinea.minvu.cl');
    expect(enlace).toHaveAttribute('target', '_blank');
  });

  it('no tiene botón de cerrar', () => {
    renderConIdioma(<AvisoLimite conSalida />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
