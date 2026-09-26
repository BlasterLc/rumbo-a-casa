import { describe, it, expect, vi, afterEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderConIdioma } from '../../../test/utilidades';
import { NavegacionSuperior } from './NavegacionSuperior';

describe('NavegacionSuperior', () => {
  afterEach(() => window.localStorage.clear());

  it('es una navegación con los cuatro destinos fijos', () => {
    renderConIdioma(<NavegacionSuperior value="hablar" />);
    const nav = screen.getByRole('navigation', { name: 'Navegación principal' });
    expect(nav).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Hablar/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Mi plan/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Documentos/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Avisos/ })).toBeInTheDocument();
  });

  it('marca el destino activo con aria-current y solo ese', () => {
    renderConIdioma(<NavegacionSuperior value="documentos" />);
    expect(screen.getByRole('button', { name: /Documentos/ })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: /Hablar/ })).not.toHaveAttribute('aria-current');
  });

  it('muestra el número de avisos, "9+" si son más de nueve y nada si son cero', () => {
    // `renderConIdioma` envuelve en JSX, no con la opción `wrapper`: un `rerender` perdería los
    // providers. Por eso cada caso se monta y se desmonta por separado.
    const dos = renderConIdioma(<NavegacionSuperior value="hablar" avisos={2} />);
    expect(screen.getByText('2')).toBeInTheDocument();
    dos.unmount();
    const doce = renderConIdioma(<NavegacionSuperior value="hablar" avisos={12} />);
    expect(screen.getByText('9+')).toBeInTheDocument();
    doce.unmount();
    renderConIdioma(<NavegacionSuperior value="hablar" avisos={0} />);
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('llama a onChange con el destino elegido', async () => {
    const onChange = vi.fn();
    renderConIdioma(<NavegacionSuperior value="hablar" onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: /Mi plan/ }));
    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange.mock.calls[0][1]).toBe('plan');
  });

  it('en inglés traduce la etiqueta de la navegación y los destinos', () => {
    window.localStorage.setItem('rumbo-idioma', 'en');
    renderConIdioma(<NavegacionSuperior value="hablar" />);
    expect(screen.getByRole('navigation', { name: 'Main navigation' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Talk/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /My plan/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Documents/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Alerts/ })).toBeInTheDocument();
  });
});
