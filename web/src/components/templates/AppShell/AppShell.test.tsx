import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { LocaleProvider } from '../../../i18n/LocaleContext';
import { SesionProvider } from '../../../state/SesionContext';
import { AppShell } from './AppShell';
import { simularEscritorio, type ControlEscritorio } from '../../../test/utilidades';

function conEnrutamiento(inicial: string) {
  return render(
    <LocaleProvider>
      <SesionProvider>
        <MemoryRouter initialEntries={[inicial]}>
          <Routes>
            <Route
              path="/hablar"
              element={
                <AppShell titulo="Hablemos" destino="hablar">
                  contenido hablar
                </AppShell>
              }
            />
            <Route
              path="/documentos"
              element={
                <AppShell titulo="Tus documentos" destino="documentos">
                  contenido documentos
                </AppShell>
              }
            />
          </Routes>
        </MemoryRouter>
      </SesionProvider>
    </LocaleProvider>,
  );
}

describe('AppShell', () => {
  it('muestra el título en la cabecera y el contenido de la pantalla', () => {
    conEnrutamiento('/hablar');
    expect(screen.getByText('Hablemos')).toBeInTheDocument();
    expect(screen.getByText('contenido hablar')).toBeInTheDocument();
  });

  it('navega al tocar un destino de la barra inferior', async () => {
    conEnrutamiento('/hablar');
    await userEvent.click(screen.getByRole('button', { name: /Documentos/ }));
    expect(await screen.findByText('contenido documentos')).toBeInTheDocument();
  });

  it('en móvil se centra con un ancho máximo de 480 px', () => {
    conEnrutamiento('/hablar');
    expect(screen.getByText('Hablemos').closest('header')?.parentElement).toHaveStyle({ maxWidth: '480px' });
  });
});

function conRutasEscritorio(entradas: string[], indice: number) {
  return render(
    <LocaleProvider>
      <SesionProvider>
        <MemoryRouter initialEntries={entradas} initialIndex={indice}>
          <Routes>
            <Route path="/" element={<div>pantalla inicio</div>} />
            <Route
              path="/hablar"
              element={
                <AppShell titulo="Hablemos" destino="hablar">
                  contenido hablar
                </AppShell>
              }
            />
            <Route
              path="/resultado"
              element={
                <AppShell titulo="Tu resultado" destino="plan" atras tituloVisible={false}>
                  contenido resultado
                </AppShell>
              }
            />
            <Route
              path="/plan/DS99"
              element={
                <AppShell titulo="Tu plan" destino="plan" atras>
                  No reconocemos ese programa.
                </AppShell>
              }
            />
            <Route
              path="/documentos"
              element={
                <AppShell titulo="Tus documentos" destino="documentos">
                  contenido documentos
                </AppShell>
              }
            />
          </Routes>
        </MemoryRouter>
      </SesionProvider>
    </LocaleProvider>,
  );
}

describe('AppShell en escritorio', () => {
  let control: ControlEscritorio;
  beforeEach(() => {
    control = simularEscritorio(true);
  });
  afterEach(() => {
    control.restaurar();
    window.localStorage.clear();
  });

  it('tiene una sola navegación: la del sidebar, sin barra inferior ni botones repetidos', () => {
    const { container } = conRutasEscritorio(['/hablar'], 0);
    expect(screen.getAllByRole('navigation')).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: /Documentos/ })).toHaveLength(1);
    expect(container.querySelector('.MuiBottomNavigation-root')).not.toBeInTheDocument();
  });

  it('el título es el único h1 y no se repite en la cabecera', () => {
    conRutasEscritorio(['/hablar'], 0);
    expect(screen.getByRole('heading', { level: 1, name: 'Hablemos' })).toBeInTheDocument();
    expect(screen.getAllByText('Hablemos')).toHaveLength(1);
  });

  it('con tituloVisible en false no dibuja el h1, para que el contenido use el suyo', () => {
    conRutasEscritorio(['/resultado'], 0);
    expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument();
    expect(screen.getByText('contenido resultado')).toBeInTheDocument();
  });

  it('el contenido se limita a 1120 px', () => {
    conRutasEscritorio(['/hablar'], 0);
    expect(screen.getByRole('main')).toHaveStyle({ maxWidth: '1120px' });
  });

  it('sin atras no hay botón Volver; con atras, vuelve a la pantalla anterior', async () => {
    conRutasEscritorio(['/documentos', '/resultado'], 1);
    await userEvent.click(screen.getByRole('button', { name: 'Volver' }));
    expect(await screen.findByText('contenido documentos')).toBeInTheDocument();
  });

  it('en una pantalla sin atras no ofrece Volver', () => {
    conRutasEscritorio(['/hablar'], 0);
    expect(screen.queryByRole('button', { name: 'Volver' })).not.toBeInTheDocument();
  });

  it('navega al tocar un destino y la marca lleva al inicio', async () => {
    conRutasEscritorio(['/hablar'], 0);
    await userEvent.click(screen.getByRole('button', { name: /Documentos/ }));
    expect(await screen.findByText('contenido documentos')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Rumbo a Casa · Inicio' }));
    expect(await screen.findByText('pantalla inicio')).toBeInTheDocument();
  });

  it('un estado vacío o de error sigue teniendo h1 y Volver, sin romper el layout', () => {
    conRutasEscritorio(['/plan/DS99'], 0);
    expect(screen.getByRole('heading', { level: 1, name: 'Tu plan' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Volver' })).toBeInTheDocument();
    expect(screen.getByText('No reconocemos ese programa.')).toBeInTheDocument();
  });

  it('al achicar la ventana bajo 900 px vuelve la barra inferior', () => {
    const { container } = conRutasEscritorio(['/hablar'], 0);
    act(() => control.cambiar(false));
    expect(container.querySelector('.MuiBottomNavigation-root')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument();
  });

  it('la navegación vive en un panel lateral, no dentro de la cabecera', () => {
    conRutasEscritorio(['/hablar'], 0);
    const nav = screen.getByRole('navigation', { name: 'Navegación principal' });
    expect(nav.closest('header')).toBeNull();
  });

  it('«Borrar mis datos» está siempre disponible, no solo en la Bienvenida', () => {
    conRutasEscritorio(['/documentos'], 0);
    expect(screen.getByRole('button', { name: 'Borrar mis datos' })).toBeInTheDocument();
  });
});
