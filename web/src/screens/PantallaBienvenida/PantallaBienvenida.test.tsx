import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { LocaleProvider } from '../../i18n/LocaleContext';
import { SesionProvider } from '../../state/SesionContext';
import { en } from '../../i18n/en';
import { simularEscritorio, type ControlEscritorio } from '../../test/utilidades';
import { PantallaBienvenida } from './PantallaBienvenida';

function renderPantalla() {
  return render(
    <LocaleProvider>
      <SesionProvider>
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route path="/" element={<PantallaBienvenida />} />
            <Route path="/hablar" element={<div>pantalla hablar</div>} />
            <Route path="/resultado" element={<div>pantalla resultado</div>} />
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

  it('sin sesión previa, ofrece Empezar y lleva a la entrevista; ya no hay un segundo botón "Prefiero hablar"', async () => {
    renderPantalla();
    expect(screen.queryByRole('button', { name: /prefiero hablar/i })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Empezar' }));
    expect(await screen.findByText('pantalla hablar')).toBeInTheDocument();
  });

  it('sin sesión previa, "Probar modo demo" activa la familia ficticia y lleva al resultado', async () => {
    renderPantalla();
    await userEvent.click(screen.getByRole('button', { name: 'Probar modo demo' }));
    expect(await screen.findByText('pantalla resultado')).toBeInTheDocument();
    expect(JSON.parse(window.localStorage.getItem('rumbo-sesion') ?? '{}').esDemo).toBe(true);
  });

  it('con sesión previa no ofrece el demo (no pisa la conversación)', async () => {
    window.localStorage.setItem(
      'rumbo-sesion',
      JSON.stringify({ sessionId: 'x', transcript: [{ id: '1', autor: 'agente', texto: 'hola' }] }),
    );
    renderPantalla();
    expect(screen.queryByRole('button', { name: 'Probar modo demo' })).not.toBeInTheDocument();
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

describe('PantallaBienvenida en escritorio', () => {
  let control: ControlEscritorio;
  beforeEach(() => {
    window.localStorage.clear();
    control = simularEscritorio(true);
  });
  afterEach(() => {
    control.restaurar();
    window.localStorage.clear();
  });

  it('la promesa es el h1 y la bajada sigue visible', () => {
    renderPantalla();
    expect(
      screen.getByRole('heading', { level: 1, name: 'Averigua a qué subsidio de vivienda puedes postular' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Cuéntanos de tu familia en unos 5 minutos.')).toBeInTheDocument();
  });

  it('muestra el panel de programas y no repite los chips de la versión móvil', () => {
    renderPantalla();
    expect(screen.getByText('Revisamos tus cuatro programas')).toBeInTheDocument();
    expect(screen.getAllByText('DS49')).toHaveLength(1);
  });

  it('Empezar sigue llevando a la entrevista', async () => {
    renderPantalla();
    await userEvent.click(screen.getByRole('button', { name: 'Empezar' }));
    expect(await screen.findByText('pantalla hablar')).toBeInTheDocument();
  });

  it('ofrece el selector de idioma y cambiarlo traduce la pantalla al vuelo', async () => {
    renderPantalla();
    await userEvent.click(screen.getByRole('button', { name: 'English' }));
    expect(await screen.findByRole('heading', { level: 1, name: en.pantallas.bienvenida.titulo })).toBeInTheDocument();
    expect(screen.getByText('We check four programs for you')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: en.pantallas.bienvenida.empezar })).toBeInTheDocument();
  });

  it('sigue sin pedir ningún dato: no hay campos de texto', () => {
    renderPantalla();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('en escritorio muestra la banda de cómo funciona, debajo del hero', () => {
    renderPantalla();
    expect(screen.getByText('Mira tu resultado')).toBeInTheDocument();
  });
});
