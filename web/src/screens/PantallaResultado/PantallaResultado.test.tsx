import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { LocaleProvider } from '../../i18n/LocaleContext';
import { PantallaResultado } from './PantallaResultado';
import { PERFIL_DESCONOCIDO, type ResultadoPrograma } from '../../types/dominio';
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
