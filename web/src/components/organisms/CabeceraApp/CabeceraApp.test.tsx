import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderConIdioma, cssActual } from '../../../test/utilidades';
import { CabeceraApp } from './CabeceraApp';

describe('CabeceraApp', () => {
  it('muestra el título de la pantalla', () => {
    renderConIdioma(<CabeceraApp titulo="Tu entrevista" onInicio={() => {}} />);
    expect(screen.getByText('Tu entrevista')).toBeInTheDocument();
  });

  it('el logo completo (símbolo y nombre) es un botón que llama a onInicio', async () => {
    const onInicio = vi.fn();
    renderConIdioma(<CabeceraApp titulo="Tus documentos" onInicio={onInicio} />);
    const boton = screen.getByRole('button', { name: /Rumbo a Casa/ });
    expect(boton).toHaveTextContent('Rumbo a Casa');
    await userEvent.click(boton);
    expect(onInicio).toHaveBeenCalledOnce();
  });

  it('no hay flecha de volver en la cabecera', () => {
    renderConIdioma(<CabeceraApp titulo="Tu plan" onInicio={() => {}} />);
    expect(screen.queryByRole('button', { name: 'Volver' })).not.toBeInTheDocument();
  });

  it('con conFranja, agrega la firma de marca bajo la cabecera', () => {
    renderConIdioma(<CabeceraApp titulo="Tu plan" onInicio={() => {}} conFranja />);
    expect(screen.getByTestId('franja')).toHaveAttribute('height', '24');
  });

  it('siempre muestra el selector de idioma, sin depender de ninguna prop', () => {
    renderConIdioma(<CabeceraApp titulo="Tu plan" onInicio={() => {}} />);
    expect(screen.getByRole('button', { name: 'Español' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'English' })).toBeInTheDocument();
  });

  it('deja margen (--space-4) a los bordes, no el padding angosto por defecto del Toolbar', () => {
    renderConIdioma(<CabeceraApp titulo="Tu plan" onInicio={() => {}} />);
    expect(cssActual()).toMatch(/padding-(left|right|inline):\s*var\(--space-4\)/);
  });

  it('separa el título del selector con --space-3, no los 4px por defecto', () => {
    renderConIdioma(<CabeceraApp titulo="Tu plan" onInicio={() => {}} />);
    expect(cssActual()).toMatch(/gap:\s*var\(--space-3\)/);
  });

  it('deja aire arriba y abajo del selector, en vez de que ocupe el 100% del alto de la barra', () => {
    // El botón del selector usa min-height: var(--size-touch) (tamaño táctil, no se toca). Sin
    // padding vertical propio, el Toolbar terminaba con el mismo alto exacto que ese botón — cero
    // margen arriba y abajo, pegado a ambos bordes de la barra (confirmado midiendo el sitio real).
    renderConIdioma(<CabeceraApp titulo="Tu plan" onInicio={() => {}} />);
    expect(cssActual()).toMatch(/padding-(top|block-start|block):\s*var\(--space-2\)/);
  });
});
