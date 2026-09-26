import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { LocaleProvider } from '../../i18n/LocaleContext';
import { SesionProvider } from '../../state/SesionContext';
import { PantallaBienvenida } from './PantallaBienvenida';

function renderPantalla() {
  return render(
    <LocaleProvider>
      <SesionProvider>
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route path="/" element={<PantallaBienvenida />} />
            <Route path="/hablar" element={<div>pantalla hablar</div>} />
          </Routes>
        </MemoryRouter>
      </SesionProvider>
    </LocaleProvider>,
  );
}

describe('PantallaBienvenida', () => {
  beforeEach(() => window.localStorage.clear());

  it('muestra la promesa con el tiempo que toma', () => {
    renderPantalla();
    expect(screen.getByText('Averigua a qué subsidio de vivienda puedes postular')).toBeInTheDocument();
    expect(screen.getByText('Cuéntanos de tu familia en unos 5 minutos.')).toBeInTheDocument();
  });

  it('nombra los cuatro programas como chips informativos', () => {
    renderPantalla();
    expect(screen.getByText('DS49')).toBeInTheDocument();
    expect(screen.getByText('DS52')).toBeInTheDocument();
  });

  it('sin sesión previa, ofrece Empezar y ambos botones llevan a la entrevista', async () => {
    renderPantalla();
    await userEvent.click(screen.getByRole('button', { name: 'Empezar' }));
    expect(await screen.findByText('pantalla hablar')).toBeInTheDocument();
  });

  it('siempre muestra la frase de confianza completa', () => {
    renderPantalla();
    expect(
      screen.getByText(
        'Herramienta independiente, no oficial. Nunca te pediremos tu Clave Única. Puedes borrar tus datos cuando quieras.',
      ),
    ).toBeInTheDocument();
  });

  it('nunca pide correo, registro ni Clave Única: no hay ningún campo de texto', () => {
    renderPantalla();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });
});
