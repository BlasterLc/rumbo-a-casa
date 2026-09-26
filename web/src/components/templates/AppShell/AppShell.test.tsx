import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { LocaleProvider } from '../../../i18n/LocaleContext';
import { AppShell } from './AppShell';

function conEnrutamiento(inicial: string) {
  return render(
    <LocaleProvider>
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

  it('se centra con un ancho máximo en pantallas anchas, sin un layout de escritorio nuevo', () => {
    conEnrutamiento('/hablar');
    expect(screen.getByText('Hablemos').closest('header')?.parentElement).toHaveStyle({ maxWidth: '480px' });
  });
});
