import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { LocaleProvider } from '../../i18n/LocaleContext';
import { PantallaResultado } from './PantallaResultado';
import { PERFIL_DESCONOCIDO, type ResultadoPrograma } from '../../types/dominio';
import { simularEscritorio, cssActual, type ControlEscritorio } from '../../test/utilidades';
import * as SesionContextModulo from '../../state/SesionContext';

const REGLA = {
  decreto: 'D.S. N°49 (V. y U.) de 2011',
  fuente: 'docs/programas-subsidio.md, sección DS49',
  fechaConsulta: '2026-09-22',
};

function mockSesion(resultados: ResultadoPrograma[]) {
  vi.spyOn(SesionContextModulo, 'useSesion').mockReturnValue({
    sessionId: 'sesion-test',
    transcript: [],
    eventos: [],
    perfil: PERFIL_DESCONOCIDO,
    resultados,
    plan: [],
    documentosListos: {},
    seguimiento: { etapa: 'papeles' },
    esDemo: false,
    cargando: false,
    error: undefined,
    enviarTurno: vi.fn(),
    activarDemo: vi.fn(),
    marcarDocumento: vi.fn(),
    marcarEtapa: vi.fn(),
    guardarFolio: vi.fn(),
    borrarDatos: vi.fn(),
  });
}

function renderPantalla() {
  return render(
    <LocaleProvider>
      <MemoryRouter initialEntries={['/resultado']}>
        <Routes>
          <Route path="/resultado" element={<PantallaResultado />} />
          <Route path="/plan/:programa" element={<div>pantalla plan</div>} />
        </Routes>
      </MemoryRouter>
    </LocaleProvider>,
  );
}

describe('PantallaResultado', () => {
  it('ordena elegible, luego falta_dato, luego no_elegible, sin importar el orden de llegada', () => {
    mockSesion([
      { programa: 'DS52', estado: 'no_elegible', motivo: 'Ya tienes vivienda propia.', regla: REGLA },
      { programa: 'DS1', estado: 'elegible', motivo: 'Cumples los requisitos.', regla: REGLA },
      {
        programa: 'DS19',
        estado: 'falta_dato',
        motivo: 'Falta tu subsidio previo.',
        regla: REGLA,
        camposFaltantes: ['subsidioPrevio'],
      },
      { programa: 'DS49', estado: 'elegible', motivo: 'Cumples los requisitos.', regla: REGLA },
    ]);
    renderPantalla();
    const titulos = screen.getAllByText(/^DS\d+ —/).map((el) => el.textContent);
    expect(titulos).toEqual([
      'DS1 — Sectores medios',
      'DS49 — Casa propia sin crédito',
      'DS19 — Integración social',
      'DS52 — Arriendo',
    ]);
  });

  it('sin resultados, invita a volver a la entrevista en vez de mostrar una lista vacía muda', () => {
    mockSesion([]);
    renderPantalla();
    expect(screen.getByText(/Todavía no tenemos datos suficientes/)).toBeInTheDocument();
  });

  it('muestra el decreto y la fecha, nunca la ruta de archivo interna de "fuente"', () => {
    mockSesion([{ programa: 'DS49', estado: 'elegible', motivo: 'Cumples.', regla: REGLA }]);
    renderPantalla();
    expect(screen.getByText('Fuente: D.S. N°49 (V. y U.) de 2011 · 22 sep 2026')).toBeInTheDocument();
    expect(screen.queryByText(/programas-subsidio\.md/)).not.toBeInTheDocument();
  });

  it('la acción de un programa elegible lleva a su plan', async () => {
    mockSesion([{ programa: 'DS49', estado: 'elegible', motivo: 'Cumples.', regla: REGLA }]);
    renderPantalla();
    await userEvent.click(screen.getByRole('button', { name: 'Ver los documentos' }));
    expect(await screen.findByText('pantalla plan')).toBeInTheDocument();
  });
});

describe('PantallaResultado en escritorio', () => {
  let control: ControlEscritorio;
  beforeEach(() => {
    control = simularEscritorio(true);
  });
  afterEach(() => {
    control.restaurar();
    window.localStorage.clear();
  });

  const DOS_PROGRAMAS: ResultadoPrograma[] = [
    { programa: 'DS49', estado: 'elegible', motivo: 'Cumples los requisitos.', regla: REGLA },
    { programa: 'DS1', estado: 'no_elegible', motivo: 'Tu ahorro no alcanza.', regla: REGLA },
  ];

  it('el hero es el único h1 y no se repite un título aparte', () => {
    mockSesion(DOS_PROGRAMAS);
    renderPantalla();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Calificas para 1 programa');
    expect(screen.queryByText('Tu resultado')).not.toBeInTheDocument();
  });

  it('el hero lista como chips los programas que califican', () => {
    mockSesion(DOS_PROGRAMAS);
    renderPantalla();
    expect(screen.getByText('DS49')).toBeInTheDocument();
    expect(screen.queryByText('DS1')).not.toBeInTheDocument();
  });

  it('las tarjetas van en una grilla de dos columnas desde 900 px', () => {
    mockSesion(DOS_PROGRAMAS);
    renderPantalla();
    expect(cssActual()).toMatch(/@media \(min-width:900px\)\s*\{[^}]*grid-template-columns:\s*repeat\(2/);
  });

  it('ofrece Volver y mantiene la acción de cada tarjeta', async () => {
    mockSesion(DOS_PROGRAMAS);
    renderPantalla();
    expect(screen.getByRole('button', { name: 'Volver' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Ver los documentos' }));
    expect(await screen.findByText('pantalla plan')).toBeInTheDocument();
  });

  it('sin resultados: hero sin chips, mensaje de datos insuficientes y sin grilla vacía', () => {
    mockSesion([]);
    renderPantalla();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Revisamos tus cuatro programas');
    expect(screen.getByText(/Todavía no tenemos datos suficientes/)).toBeInTheDocument();
    expect(screen.queryByText('DS49')).not.toBeInTheDocument();
  });
});
