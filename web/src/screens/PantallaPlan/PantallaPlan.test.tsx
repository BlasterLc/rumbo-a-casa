import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { simularEscritorio, cssActual, type ControlEscritorio } from '../../test/utilidades';
import { LocaleProvider } from '../../i18n/LocaleContext';
import { PantallaPlan } from './PantallaPlan';
import { PERFIL_DESCONOCIDO } from '../../types/dominio';
import * as SesionContextModulo from '../../state/SesionContext';

const REGLA = {
  decreto: 'D.S. N°49 (V. y U.) de 2011',
  fuente: 'docs/programas-subsidio.md, sección DS49',
  fechaConsulta: '2026-09-22',
};

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

function renderPantalla(ruta: string) {
  return render(
    <LocaleProvider>
      <MemoryRouter initialEntries={[ruta]}>
        <Routes>
          <Route path="/plan/:programa" element={<PantallaPlan />} />
          <Route path="/avisos" element={<div>pantalla avisos</div>} />
        </Routes>
      </MemoryRouter>
    </LocaleProvider>,
  );
}

describe('PantallaPlan', () => {
  it('con un programa que no existe en la URL, avisa en vez de romper', () => {
    mockSesion();
    renderPantalla('/plan/DS99');
    expect(screen.getByText('No reconocemos ese programa. Vuelve a tu resultado.')).toBeInTheDocument();
  });

  it('paso 1 cita la regla real del motor, nunca un texto inventado', () => {
    mockSesion({
      resultados: [{ programa: 'DS49', estado: 'elegible', motivo: 'Cumples los requisitos.', regla: REGLA }],
    });
    renderPantalla('/plan/DS49');
    expect(screen.getByText(/Cumples los requisitos\./)).toBeInTheDocument();
    expect(screen.getByText(/D\.S\. N°49 \(V\. y U\.\) de 2011/)).toBeInTheDocument();
  });

  it('paso 2 lista los documentos del plan y marca la casilla con la clave correcta', async () => {
    const { marcarDocumento } = mockSesion({
      resultados: [{ programa: 'DS49', estado: 'elegible', motivo: 'Cumples.', regla: REGLA }],
      plan: [
        {
          programa: 'DS49',
          documentos: [{ nombre: 'Tu cédula', detalle: 'Cédula vigente' }],
          fuente: 'Formularios oficiales DS49',
        },
      ],
    });
    renderPantalla('/plan/DS49');
    await userEvent.click(screen.getByRole('checkbox', { name: /Tu cédula/ }));
    expect(marcarDocumento).toHaveBeenCalledWith('DS49:Tu cédula', true);
  });

  it('paso 3 nunca inventa una fecha de llamado: usa el texto de repliegue del design system', () => {
    mockSesion({ resultados: [{ programa: 'DS49', estado: 'elegible', motivo: 'Cumples.', regla: REGLA }] });
    renderPantalla('/plan/DS49');
    expect(screen.getByText('Sin fecha publicada · Por confirmar con tu Serviu regional')).toBeInTheDocument();
  });

  it('paso 4 muestra el enlace de salida y deja marcar que ya postuló', async () => {
    mockSesion({ resultados: [{ programa: 'DS49', estado: 'elegible', motivo: 'Cumples.', regla: REGLA }] });
    renderPantalla('/plan/DS49');
    expect(screen.getByRole('link', { name: /postulacionenlinea\.minvu\.cl/ })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Ya postulé' }));
    expect(await screen.findByText('pantalla avisos')).toBeInTheDocument();
  });
});

describe('PantallaPlan en escritorio', () => {
  let control: ControlEscritorio;
  beforeEach(() => {
    control = simularEscritorio(true);
  });
  afterEach(() => {
    control.restaurar();
    window.localStorage.clear();
  });

  it('el título con el programa es el h1 y ofrece Volver', () => {
    mockSesion({
      resultados: [{ programa: 'DS49', estado: 'elegible', motivo: 'Cumples los requisitos.', regla: REGLA }],
    });
    renderPantalla('/plan/DS49');
    expect(screen.getByRole('heading', { level: 1, name: 'Tu plan · DS49' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Volver' })).toBeInTheDocument();
  });

  it('los cuatro pasos siguen en orden de lectura (1, 2, 3, 4) aunque estén en dos columnas', () => {
    mockSesion();
    renderPantalla('/plan/DS49');
    const pasos = screen.getAllByText(/^\d\. /).map((el) => el.textContent?.[0]);
    expect(pasos).toEqual(['1', '2', '3', '4']);
  });

  it('desde 900 px van en dos columnas y la de la derecha queda fija al hacer scroll', () => {
    mockSesion();
    renderPantalla('/plan/DS49');
    const css = cssActual();
    expect(css).toMatch(/@media \(min-width:900px\)\s*\{[^}]*grid-template-columns:\s*repeat\(2/);
    expect(css).toMatch(/@media \(min-width:900px\)\s*\{[^}]*position:\s*sticky/);
  });

  it('con un programa inexistente muestra el aviso con h1 y sin columnas', () => {
    mockSesion();
    renderPantalla('/plan/DS99');
    expect(screen.getByRole('heading', { level: 1, name: 'Tu plan' })).toBeInTheDocument();
    expect(screen.getByText('No reconocemos ese programa. Vuelve a tu resultado.')).toBeInTheDocument();
  });
});
