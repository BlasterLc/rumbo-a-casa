import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderPantalla, simularEscritorio, cssActual, type ControlEscritorio } from '../../test/utilidades';
import { PantallaSeguimiento } from './PantallaSeguimiento';
import { PERFIL_DESCONOCIDO } from '../../types/dominio';
import * as SesionContextModulo from '../../state/SesionContext';

function mockSesion(overrides: Partial<ReturnType<typeof SesionContextModulo.useSesion>> = {}) {
  const marcarEtapa = vi.fn();
  const guardarFolio = vi.fn();
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
    marcarDocumento: vi.fn(),
    marcarEtapa,
    guardarFolio,
    borrarDatos: vi.fn(),
    ...overrides,
  });
  return { marcarEtapa, guardarFolio };
}

describe('PantallaSeguimiento', () => {
  it('sin fecha real de llamado, dice "Sin fecha publicada" en vez de inventar una', () => {
    mockSesion();
    renderPantalla(<PantallaSeguimiento />, { ruta: '/avisos' });
    expect(screen.getByText('Sin fecha publicada')).toBeInTheDocument();
    expect(screen.getByText(/Fecha prevista/)).toBeInTheDocument();
  });

  it('elegir una etapa llama a marcarEtapa', async () => {
    const { marcarEtapa } = mockSesion();
    renderPantalla(<PantallaSeguimiento />, { ruta: '/avisos' });
    await userEvent.click(screen.getByText('Postulé'));
    expect(marcarEtapa).toHaveBeenCalledWith('postule');
  });

  it('en la etapa "papeles" no pide folio todavía', () => {
    mockSesion({ seguimiento: { etapa: 'papeles' } });
    renderPantalla(<PantallaSeguimiento />, { ruta: '/avisos' });
    expect(screen.queryByLabelText('¿Cuál es tu número de folio?')).not.toBeInTheDocument();
  });

  it('tras postular, pide el folio y lo guarda', async () => {
    const { guardarFolio } = mockSesion({ seguimiento: { etapa: 'postule' } });
    renderPantalla(<PantallaSeguimiento />, { ruta: '/avisos' });
    await userEvent.type(screen.getByLabelText('¿Cuál es tu número de folio?'), '12345');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar folio' }));
    expect(guardarFolio).toHaveBeenCalledWith('12345');
  });

  it('dice que el estado no se consulta solo', () => {
    mockSesion();
    renderPantalla(<PantallaSeguimiento />, { ruta: '/avisos' });
    expect(screen.getByText(/El estado no se consulta solo/)).toBeInTheDocument();
  });
});

describe('PantallaSeguimiento en escritorio', () => {
  let control: ControlEscritorio;
  beforeEach(() => {
    control = simularEscritorio(true);
  });
  afterEach(() => {
    control.restaurar();
    window.localStorage.clear();
  });

  it('el título es el h1 y todo el contenido sigue presente', () => {
    mockSesion({ seguimiento: { etapa: 'postule' } });
    renderPantalla(<PantallaSeguimiento />, { ruta: '/avisos' });
    expect(screen.getByRole('heading', { level: 1, name: 'Avisos' })).toBeInTheDocument();
    expect(screen.getByText('Sin fecha publicada')).toBeInTheDocument();
    expect(screen.getByText('Postulé')).toBeInTheDocument();
    expect(screen.getByLabelText('¿Cuál es tu número de folio?')).toBeInTheDocument();
  });

  it('la etapa ocupa la columna derecha en dos filas y el resto la izquierda', () => {
    mockSesion({ seguimiento: { etapa: 'postule' } });
    renderPantalla(<PantallaSeguimiento />, { ruta: '/avisos' });
    const css = cssActual();
    expect(css).toMatch(/@media \(min-width:900px\)\s*\{[^}]*grid-row:\s*1\s*\/\s*span 2/);
    expect(css).toMatch(/@media \(min-width:900px\)\s*\{[^}]*grid-column:\s*2/);
  });

  it('con el folio ya guardado, lo confirma y deshabilita "Guardar folio" hasta que cambie', async () => {
    mockSesion({ seguimiento: { etapa: 'postule', folio: 'ABC-123' } });
    renderPantalla(<PantallaSeguimiento />, { ruta: '/avisos' });
    expect(screen.getByRole('status')).toHaveTextContent('Folio guardado: ABC-123');
    expect(screen.getByRole('button', { name: 'Guardar folio' })).toBeDisabled();
    await userEvent.type(screen.getByLabelText('¿Cuál es tu número de folio?'), '9');
    expect(screen.getByRole('button', { name: 'Guardar folio' })).toBeEnabled();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('sin folio guardado no muestra confirmación', () => {
    mockSesion({ seguimiento: { etapa: 'postule' } });
    renderPantalla(<PantallaSeguimiento />, { ruta: '/avisos' });
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('en la etapa "papeles" sigue sin pedir folio', () => {
    mockSesion({ seguimiento: { etapa: 'papeles' } });
    renderPantalla(<PantallaSeguimiento />, { ruta: '/avisos' });
    expect(screen.queryByLabelText('¿Cuál es tu número de folio?')).not.toBeInTheDocument();
  });

  it('elegir una etapa sigue llamando a marcarEtapa', async () => {
    const { marcarEtapa } = mockSesion();
    renderPantalla(<PantallaSeguimiento />, { ruta: '/avisos' });
    await userEvent.click(screen.getByText('En evaluación'));
    expect(marcarEtapa).toHaveBeenCalledWith('evaluacion');
  });
});
