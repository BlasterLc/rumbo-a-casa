import { describe, it, expect, vi, afterEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderPantalla } from '../../../test/utilidades';
import { SidebarEscritorio } from './SidebarEscritorio';

describe('SidebarEscritorio', () => {
  afterEach(() => window.localStorage.clear());

  it('es una navegación con los cuatro destinos fijos', () => {
    renderPantalla(<SidebarEscritorio destino="hablar" />);
    const nav = screen.getByRole('navigation', { name: 'Navegación principal' });
    expect(nav).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Hablar/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Mi plan/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Documentos/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Avisos/ })).toBeInTheDocument();
  });

  it('marca el destino activo con aria-current y solo ese', () => {
    renderPantalla(<SidebarEscritorio destino="documentos" />);
    expect(screen.getByRole('button', { name: /Documentos/ })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: /Hablar/ })).not.toHaveAttribute('aria-current');
  });

  it('muestra el número de avisos, "9+" si son más de nueve y nada si son cero', () => {
    const dos = renderPantalla(<SidebarEscritorio destino="hablar" avisos={2} />);
    expect(screen.getByText('2')).toBeInTheDocument();
    dos.unmount();
    const doce = renderPantalla(<SidebarEscritorio destino="hablar" avisos={12} />);
    expect(screen.getByText('9+')).toBeInTheDocument();
    doce.unmount();
    renderPantalla(<SidebarEscritorio destino="hablar" avisos={0} />);
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('llama a onNavegar con el destino elegido', async () => {
    const onNavegar = vi.fn();
    renderPantalla(<SidebarEscritorio destino="hablar" onNavegar={onNavegar} />);
    await userEvent.click(screen.getByRole('button', { name: /Mi plan/ }));
    expect(onNavegar).toHaveBeenCalledWith('plan');
  });

  it('en inglés traduce la etiqueta de la navegación, los destinos y el pie', () => {
    window.localStorage.setItem('rumbo-idioma', 'en');
    renderPantalla(<SidebarEscritorio destino="hablar" />);
    expect(screen.getByRole('navigation', { name: 'Main navigation' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Talk/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete my data' })).toBeInTheDocument();
    expect(screen.getByText(/We never ask for your Clave Única/)).toBeInTheDocument();
  });

  it('«Borrar mis datos» limpia la sesión y vuelve al inicio', async () => {
    renderPantalla(<SidebarEscritorio destino="documentos" />, { ruta: '/documentos' });
    const idAntes = JSON.parse(window.localStorage.getItem('rumbo-sesion')!).sessionId;
    await userEvent.click(screen.getByRole('button', { name: 'Borrar mis datos' }));
    // `renderPantalla` no arma <Routes>: solo se comprueba que no truena y que la sesión quedó
    // limpia (un `sessionId` nuevo, igual que ya lo comprueba `SesionContext.test.tsx`). La
    // navegación real de "volver al inicio" la cubre el e2e (Tarea 6).
    await waitFor(() => {
      const idDespues = JSON.parse(window.localStorage.getItem('rumbo-sesion')!).sessionId;
      expect(idDespues).not.toBe(idAntes);
    });
  });
});
