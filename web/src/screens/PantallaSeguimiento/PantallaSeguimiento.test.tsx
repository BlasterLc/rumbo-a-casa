import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderPantalla } from '../../test/utilidades';
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
