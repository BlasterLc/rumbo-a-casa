import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderConIdioma } from '../../../test/utilidades';
import { LineaDeLlamados } from './LineaDeLlamados';

const llamados = [
  { programa: 'DS49', fechas: '3 mar 2026 – 30 mar 2026', serviu: 'Serviu Metropolitana', estado: 'cerrado' as const },
  {
    programa: 'DS1',
    fechas: 'Sin fecha publicada',
    serviu: 'Por confirmar con tu Serviu regional',
    estado: 'porVenir' as const,
    porConfirmar: true,
    contador: 'Aún sin fecha',
    accion: 'Avisarme',
  },
];

describe('LineaDeLlamados', () => {
  it('muestra apertura, cierre y Serviu juntos, para cada llamado', () => {
    renderConIdioma(<LineaDeLlamados llamados={llamados} />);
    expect(screen.getByText('3 mar 2026 – 30 mar 2026 · Serviu Metropolitana')).toBeInTheDocument();
  });

  it('un llamado cerrado se muestra atenuado pero nunca se esconde', () => {
    renderConIdioma(<LineaDeLlamados llamados={llamados} />);
    expect(screen.getByText('DS49')).toBeInTheDocument();
  });

  it('una fecha por confirmar lo dice explícitamente', () => {
    renderConIdioma(<LineaDeLlamados llamados={llamados} />);
    expect(screen.getByText('Por confirmar con el Serviu.')).toBeInTheDocument();
  });

  it('la acción de recordatorio llama a onAccion con el índice', async () => {
    const onAccion = vi.fn();
    renderConIdioma(<LineaDeLlamados llamados={llamados} onAccion={onAccion} />);
    await userEvent.click(screen.getByRole('button', { name: 'Avisarme' }));
    expect(onAccion).toHaveBeenCalledWith(1);
  });
});
