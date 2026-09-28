import { describe, it, expect, vi, afterEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderPantalla, cssActual } from '../../../test/utilidades';
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

  it('los botones de destino y «Borrar mis datos» tienen un anillo de foco visible', () => {
    renderPantalla(<SidebarEscritorio destino="hablar" />);
    const regla = (elemento: HTMLElement) => {
      const clase = Array.from(elemento.classList).find((c) => c.startsWith('css-'))!;
      return new RegExp(`\\.${clase}:focus-visible\\{[^}]*outline:3px solid var\\(--focus-ring\\)`);
    };
    expect(cssActual()).toMatch(regla(screen.getByRole('button', { name: /Hablar/ })));
    expect(cssActual()).toMatch(regla(screen.getByRole('button', { name: 'Borrar mis datos' })));
  });

  it('«Borrar mis datos» pide confirmar: el primer clic no borra nada todavía', async () => {
    renderPantalla(<SidebarEscritorio destino="documentos" />, { ruta: '/documentos' });
    const idAntes = JSON.parse(window.localStorage.getItem('rumbo-sesion')!).sessionId;
    await userEvent.click(screen.getByRole('button', { name: 'Borrar mis datos' }));
    expect(JSON.parse(window.localStorage.getItem('rumbo-sesion')!).sessionId).toBe(idAntes);
    expect(screen.getByRole('button', { name: 'Sí, borrar' })).toBeInTheDocument();
    expect(screen.getByText(/¿Seguro\?/)).toBeInTheDocument();
  });

  it('cancelar la confirmación deja los datos intactos y vuelve a mostrar "Borrar mis datos"', async () => {
    renderPantalla(<SidebarEscritorio destino="documentos" />, { ruta: '/documentos' });
    const idAntes = JSON.parse(window.localStorage.getItem('rumbo-sesion')!).sessionId;
    await userEvent.click(screen.getByRole('button', { name: 'Borrar mis datos' }));
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(JSON.parse(window.localStorage.getItem('rumbo-sesion')!).sessionId).toBe(idAntes);
    expect(screen.getByRole('button', { name: 'Borrar mis datos' })).toBeInTheDocument();
  });

  it('confirmar con «Sí, borrar» recién ahí limpia la sesión y vuelve al inicio', async () => {
    renderPantalla(<SidebarEscritorio destino="documentos" />, { ruta: '/documentos' });
    const idAntes = JSON.parse(window.localStorage.getItem('rumbo-sesion')!).sessionId;
    await userEvent.click(screen.getByRole('button', { name: 'Borrar mis datos' }));
    await userEvent.click(screen.getByRole('button', { name: 'Sí, borrar' }));
    // `renderPantalla` no arma <Routes>: solo se comprueba que no truena y que la sesión quedó
    // limpia (un `sessionId` nuevo, igual que ya lo comprueba `SesionContext.test.tsx`). La
    // navegación real de "volver al inicio" la cubre el e2e (Tarea 6).
    await waitFor(() => {
      const idDespues = JSON.parse(window.localStorage.getItem('rumbo-sesion')!).sessionId;
      expect(idDespues).not.toBe(idAntes);
    });
  });
});
