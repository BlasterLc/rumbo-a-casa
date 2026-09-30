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
    expect(screen.getByRole('heading', { level: 1, name: 'Averigua a qué subsidio de vivienda puedes postular' })).toBeInTheDocument();
    expect(screen.getByText(/^Cuéntanos de tu familia en unos 5 minutos\./)).toBeInTheDocument();
  });

  it('nombra los cuatro programas como chips y también en el panel azul', () => {
    renderPantalla();
    expect(screen.getAllByText('DS49')).toHaveLength(2);
    expect(screen.getAllByText('DS52')).toHaveLength(2);
  });

  it('muestra el panel azul con "Tú postulas. Nosotros te preparamos."', () => {
    renderPantalla();
    expect(screen.getByRole('heading', { level: 2, name: 'Tú postulas. Nosotros te preparamos.' })).toBeInTheDocument();
  });

  it('sin sesión previa, ofrece Empezar y lleva a la entrevista; no hay "Prefiero hablar" porque no hay entrada de voz', async () => {
    renderPantalla();
    expect(screen.queryByRole('button', { name: /prefiero hablar/i })).not.toBeInTheDocument();
    await userEvent.click(screen.getAllByRole('button', { name: 'Empezar' })[0]);
    expect(await screen.findByText('pantalla hablar')).toBeInTheDocument();
  });

  it('repite la invitación a empezar en la franja final', async () => {
    renderPantalla();
    expect(screen.getByRole('heading', { level: 2, name: '¿Vemos a qué puedes postular?' })).toBeInTheDocument();
    const empezar = screen.getAllByRole('button', { name: 'Empezar' });
    expect(empezar).toHaveLength(2);
    await userEvent.click(empezar[1]);
    expect(await screen.findByText('pantalla hablar')).toBeInTheDocument();
  });

  it('incluye "Cómo trabajamos contigo" y las preguntas frecuentes', () => {
    renderPantalla();
    expect(screen.getByRole('heading', { level: 2, name: 'Cada quien hace su parte, sin sorpresas' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Lo que la gente nos pregunta' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '¿Tiene algún costo?' })).toBeInTheDocument();
  });

  it('sin sesión previa, "Probar modo demo" activa la familia ficticia y lleva al resultado', async () => {
    renderPantalla();
    await userEvent.click(screen.getAllByRole('button', { name: 'Probar modo demo' })[0]);
    expect(await screen.findByText('pantalla resultado')).toBeInTheDocument();
    expect(JSON.parse(window.localStorage.getItem('rumbo-sesion') ?? '{}').esDemo).toBe(true);
  });

  it('con sesión previa no ofrece el demo (no pisa la conversación) y ofrece seguir', async () => {
    window.localStorage.setItem(
      'rumbo-sesion',
      JSON.stringify({ sessionId: 'x', transcript: [{ id: '1', autor: 'agente', texto: 'hola' }] }),
    );
    renderPantalla();
    expect(screen.queryByRole('button', { name: 'Probar modo demo' })).not.toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Seguir donde quedaste' })).toHaveLength(2);
  });

  it('siempre muestra la frase de confianza completa', () => {
    renderPantalla();
    expect(
      screen.getByText(
        'Herramienta independiente, no oficial. Nunca te pediremos tu Clave Única. Puedes borrar tus datos de este navegador cuando quieras.',
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
    expect(screen.getByText(/^Cuéntanos de tu familia en unos 5 minutos\./)).toBeInTheDocument();
  });

  it('Empezar sigue llevando a la entrevista', async () => {
    renderPantalla();
    await userEvent.click(screen.getAllByRole('button', { name: 'Empezar' })[0]);
    expect(await screen.findByText('pantalla hablar')).toBeInTheDocument();
  });

  it('ofrece el selector de idioma y cambiarlo traduce la pantalla al vuelo', async () => {
    renderPantalla();
    await userEvent.click(screen.getByRole('button', { name: 'English' }));
    expect(await screen.findByRole('heading', { level: 1, name: en.pantallas.bienvenida.titulo })).toBeInTheDocument();
    expect(screen.getByText('You apply. We get you ready.')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: en.pantallas.bienvenida.empezar })).toHaveLength(2);
    expect(screen.getByRole('heading', { level: 2, name: en.pantallas.bienvenida.faq.titulo })).toBeInTheDocument();
  });

  it('sigue sin pedir ningún dato: no hay campos de texto', () => {
    renderPantalla();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('muestra la banda de cómo funciona, debajo del hero', () => {
    renderPantalla();
    expect(screen.getByText('Mira tu resultado')).toBeInTheDocument();
  });
});
