import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderConIdioma, cssActual } from '../../../test/utilidades';
import { CabeceraApp } from './CabeceraApp';

describe('CabeceraApp', () => {
  it('muestra el título y el símbolo, nunca el logotipo completo', () => {
    renderConIdioma(<CabeceraApp titulo="Tu entrevista" />);
    expect(screen.getByText('Tu entrevista')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Rumbo a Casa' })).toBeInTheDocument();
  });

  it('el botón de volver llama a onAtras', async () => {
    const onAtras = vi.fn();
    renderConIdioma(<CabeceraApp titulo="Tu plan" atras onAtras={onAtras} />);
    await userEvent.click(screen.getByRole('button', { name: 'Volver' }));
    expect(onAtras).toHaveBeenCalledOnce();
  });

  it('sin atras, no muestra el botón de volver', () => {
    renderConIdioma(<CabeceraApp titulo="Rumbo a Casa" />);
    expect(screen.queryByRole('button', { name: 'Volver' })).not.toBeInTheDocument();
  });

  it('con conFranja, agrega la firma de marca bajo la cabecera', () => {
    renderConIdioma(<CabeceraApp titulo="Tu plan" conFranja />);
    expect(screen.getByTestId('franja')).toHaveAttribute('height', '24');
  });

  it('siempre muestra el selector de idioma, sin depender de ninguna prop', () => {
    renderConIdioma(<CabeceraApp titulo="Tu plan" />);
    expect(screen.getByRole('button', { name: 'Español' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'English' })).toBeInTheDocument();
  });

  it('deja margen (--space-4) a los bordes, no el padding angosto por defecto del Toolbar', () => {
    renderConIdioma(<CabeceraApp titulo="Tu plan" />);
    expect(cssActual()).toMatch(/padding-(left|right|inline):\s*var\(--space-4\)/);
  });

  it('separa el título del selector con --space-3, no los 4px por defecto', () => {
    renderConIdioma(<CabeceraApp titulo="Tu plan" />);
    expect(cssActual()).toMatch(/gap:\s*var\(--space-3\)/);
  });

  it('deja aire arriba y abajo del selector, en vez de que ocupe el 100% del alto de la barra', () => {
    // El botón del selector usa min-height: var(--size-touch) (tamaño táctil, no se toca). Sin
    // padding vertical propio, el Toolbar terminaba con el mismo alto exacto que ese botón — cero
    // margen arriba y abajo, pegado a ambos bordes de la barra (confirmado midiendo el sitio real).
    renderConIdioma(<CabeceraApp titulo="Tu plan" />);
    expect(cssActual()).toMatch(/padding-(top|block-start|block):\s*var\(--space-2\)/);
  });
});
