import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderPantalla, simularEscritorio, cssActual, type ControlEscritorio } from '../../test/utilidades';
import { PantallaDocumentos } from './PantallaDocumentos';
import { PERFIL_DESCONOCIDO } from '../../types/dominio';
import * as SesionContextModulo from '../../state/SesionContext';

function mockSesion(overrides: Partial<ReturnType<typeof SesionContextModulo.useSesion>> = {}) {
  const marcarDocumento = vi.fn();
  vi.spyOn(SesionContextModulo, 'useSesion').mockReturnValue({
    sessionId: 'sesion-test',
    transcript: [],
    eventos: [],
    perfil: PERFIL_DESCONOCIDO,
    resultados: [],
    plan: [],
    documentosListos: {},
    seguimiento: { etapa: 'papeles' },
    esDemo: false,
    cargando: false,
    error: undefined,
    enviarTurno: vi.fn(),
    activarDemo: vi.fn(),
    marcarDocumento,
    marcarEtapa: vi.fn(),
    guardarFolio: vi.fn(),
    borrarDatos: vi.fn(),
    ...overrides,
  });
  return { marcarDocumento };
}

describe('PantallaDocumentos', () => {
  it('sin ningún programa elegible, invita a volver a la entrevista', () => {
    mockSesion();
    renderPantalla(<PantallaDocumentos />, { ruta: '/documentos' });
    expect(screen.getByText(/Todavía no calificas para ningún programa/)).toBeInTheDocument();
  });

  it('sin programas no muestra el aviso de que no hay que subir nada', () => {
    mockSesion();
    renderPantalla(<PantallaDocumentos />, { ruta: '/documentos' });
    expect(screen.queryByText('No tienes que subir nada')).not.toBeInTheDocument();
  });

  it('explica que no hay que subir documentos, solo saber qué juntar', () => {
    mockSesion({ plan: [{ programa: 'DS49', documentos: [{ nombre: 'Tu cédula' }], fuente: 'x' }] });
    renderPantalla(<PantallaDocumentos />, { ruta: '/documentos' });
    expect(screen.getByText('No tienes que subir nada')).toBeInTheDocument();
    expect(screen.getByText(/Esta es solo una lista de los papeles que vas a necesitar/)).toBeInTheDocument();
  });

  it('agrupa los documentos de cada programa elegible por separado', () => {
    mockSesion({
      plan: [
        { programa: 'DS49', documentos: [{ nombre: 'Tu cédula' }], fuente: 'x' },
        { programa: 'DS52', documentos: [{ nombre: 'Formulario A-01' }], fuente: 'y' },
      ],
    });
    renderPantalla(<PantallaDocumentos />, { ruta: '/documentos' });
    expect(screen.getByText('DS49 — Casa propia sin crédito')).toBeInTheDocument();
    expect(screen.getByText('DS52 — Arriendo')).toBeInTheDocument();
  });

  it('los checklists empiezan cerrados y se despliegan al tocar el programa', async () => {
    mockSesion({ plan: [{ programa: 'DS49', documentos: [{ nombre: 'Tu cédula' }], fuente: 'x' }] });
    renderPantalla(<PantallaDocumentos />, { ruta: '/documentos' });
    const cabecera = screen.getByRole('button', { name: /DS49/ });
    expect(cabecera).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('checkbox', { name: /Tu cédula/ })).not.toBeInTheDocument();
    await userEvent.click(cabecera);
    expect(cabecera).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('checkbox', { name: /Tu cédula/ })).toBeInTheDocument();
  });

  it('la cabecera del desplegable muestra cuántos documentos van listos', () => {
    mockSesion({
      plan: [{ programa: 'DS49', documentos: [{ nombre: 'Tu cédula' }, { nombre: 'Cartola' }], fuente: 'x' }],
      documentosListos: { 'DS49:Tu cédula': true },
    });
    renderPantalla(<PantallaDocumentos />, { ruta: '/documentos' });
    expect(screen.getByRole('button', { name: /DS49/ })).toHaveTextContent('1 de 2 listos');
  });

  it('usa la misma clave de documento que PantallaPlan, para compartir el progreso entre pantallas', async () => {
    const { marcarDocumento } = mockSesion({
      plan: [{ programa: 'DS49', documentos: [{ nombre: 'Tu cédula' }], fuente: 'x' }],
    });
    renderPantalla(<PantallaDocumentos />, { ruta: '/documentos' });
    await userEvent.click(screen.getByRole('button', { name: /DS49/ }));
    await userEvent.click(screen.getByRole('checkbox', { name: /Tu cédula/ }));
    expect(marcarDocumento).toHaveBeenCalledWith('DS49:Tu cédula', true);
  });
});

describe('PantallaDocumentos en escritorio', () => {
  let control: ControlEscritorio;
  beforeEach(() => {
    control = simularEscritorio(true);
  });
  afterEach(() => {
    control.restaurar();
    window.localStorage.clear();
  });

  it('con dos programas, cada checklist es un desplegable en una columna centrada', () => {
    mockSesion({
      plan: [
        { programa: 'DS49', documentos: [{ nombre: 'Tu cédula' }], fuente: 'x' },
        { programa: 'DS52', documentos: [{ nombre: 'Formulario A-01' }], fuente: 'y' },
      ],
    });
    renderPantalla(<PantallaDocumentos />, { ruta: '/documentos' });
    expect(screen.getByRole('heading', { level: 1, name: 'Tus documentos' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /DS49 — Casa propia sin crédito/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /DS52 — Arriendo/ })).toBeInTheDocument();
    expect(cssActual()).toMatch(/max-width:\s*720px/);
    expect(cssActual()).not.toMatch(/grid-template-columns:\s*repeat\(2/);
  });

  it('sin programas muestra el mensaje con h1 y sin una grilla vacía', () => {
    mockSesion();
    renderPantalla(<PantallaDocumentos />, { ruta: '/documentos' });
    expect(screen.getByRole('heading', { level: 1, name: 'Tus documentos' })).toBeInTheDocument();
    expect(screen.getByText(/Todavía no calificas para ningún programa/)).toBeInTheDocument();
  });

  it('marcar un documento sigue usando la misma clave que el plan', async () => {
    const { marcarDocumento } = mockSesion({
      plan: [{ programa: 'DS49', documentos: [{ nombre: 'Tu cédula' }], fuente: 'x' }],
    });
    renderPantalla(<PantallaDocumentos />, { ruta: '/documentos' });
    await userEvent.click(screen.getByRole('button', { name: /DS49/ }));
    await userEvent.click(screen.getByRole('checkbox', { name: /Tu cédula/ }));
    expect(marcarDocumento).toHaveBeenCalledWith('DS49:Tu cédula', true);
  });
});
