import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderPantalla, simularEscritorio, cssActual, type ControlEscritorio } from '../../test/utilidades';
import { PantallaEntrevista } from './PantallaEntrevista';
import * as chatClient from '../../api/chatClient';
import { PERFIL_DESCONOCIDO } from '../../types/dominio';

describe('PantallaEntrevista', () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it('el botón de enviar está deshabilitado con el mensaje vacío', () => {
    renderPantalla(<PantallaEntrevista />, { ruta: '/hablar' });
    expect(screen.getByRole('button', { name: 'Enviar' })).toBeDisabled();
  });

  it('bloquea el envío de más de 2000 caracteres, sin depender del backend', () => {
    const enviarMensajeSpy = vi.spyOn(chatClient, 'enviarMensaje');
    renderPantalla(<PantallaEntrevista />, { ruta: '/hablar' });
    const campo = screen.getByLabelText('Escribe tu respuesta');
    fireEvent.change(campo, { target: { value: 'a'.repeat(2001) } });
    const botonEnviar = screen.getByRole('button', { name: 'Enviar' });
    expect(botonEnviar).toBeDisabled();
    expect(screen.getByText('Máximo 2000 caracteres.')).toBeInTheDocument();
    fireEvent.click(botonEnviar);
    expect(enviarMensajeSpy).not.toHaveBeenCalled();
  });

  it('muestra el mensaje de bienvenida mientras la conversación está vacía, y desaparece al enviar el primer mensaje', async () => {
    vi.spyOn(chatClient, 'enviarMensaje').mockResolvedValue({
      ok: true,
      respuesta: 'Hola, ¿en qué región vives?',
      perfil: PERFIL_DESCONOCIDO,
      resultados: [],
      plan: [],
    });
    renderPantalla(<PantallaEntrevista />, { ruta: '/hablar' });
    expect(screen.getByText('¡Bienvenido a Rumbo a Casa!')).toBeInTheDocument();
    expect(screen.getByText(/Cuéntame cuando quieras y empezamos/)).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Escribe tu respuesta'), 'Hola');
    await userEvent.click(screen.getByRole('button', { name: 'Enviar' }));
    await screen.findByText('Hola, ¿en qué región vives?');
    expect(screen.queryByText('¡Bienvenido a Rumbo a Casa!')).not.toBeInTheDocument();
  });

  it('envía el mensaje y muestra primero el turno de la persona, luego el del agente', async () => {
    vi.spyOn(chatClient, 'enviarMensaje').mockResolvedValue({
      ok: true,
      respuesta: 'Hola, ¿en qué región vives?',
      perfil: PERFIL_DESCONOCIDO,
      resultados: [],
      plan: [],
    });
    renderPantalla(<PantallaEntrevista />, { ruta: '/hablar' });
    await userEvent.type(screen.getByLabelText('Escribe tu respuesta'), 'Hola');
    await userEvent.click(screen.getByRole('button', { name: 'Enviar' }));
    expect(screen.getByText('Hola')).toBeInTheDocument();
    expect(await screen.findByText('Hola, ¿en qué región vives?')).toBeInTheDocument();
  });

  it('las negritas del agente se ven como negritas, sin asteriscos, y la persona se muestra literal', async () => {
    vi.spyOn(chatClient, 'enviarMensaje').mockResolvedValue({
      ok: true,
      respuesta: 'Perfecto. **¿En qué región viven?**',
      perfil: PERFIL_DESCONOCIDO,
      resultados: [],
      plan: [],
    });
    renderPantalla(<PantallaEntrevista />, { ruta: '/hablar' });
    await userEvent.type(screen.getByLabelText('Escribe tu respuesta'), '**hola**');
    await userEvent.click(screen.getByRole('button', { name: 'Enviar' }));
    const negrita = await screen.findByText('¿En qué región viven?');
    expect(negrita.tagName).toBe('STRONG');
    expect(screen.queryByText(/\*\*¿En qué/)).not.toBeInTheDocument();
    expect(screen.getByText('**hola**')).toBeInTheDocument();
  });

  it('presionar Enter en el campo de mensaje lo envía, igual que el botón', async () => {
    vi.spyOn(chatClient, 'enviarMensaje').mockResolvedValue({
      ok: true,
      respuesta: 'Hola, ¿en qué región vives?',
      perfil: PERFIL_DESCONOCIDO,
      resultados: [],
      plan: [],
    });
    renderPantalla(<PantallaEntrevista />, { ruta: '/hablar' });
    await userEvent.type(screen.getByLabelText('Escribe tu respuesta'), 'Hola{Enter}');
    expect(screen.getByText('Hola')).toBeInTheDocument();
    expect(await screen.findByText('Hola, ¿en qué región vives?')).toBeInTheDocument();
  });

  it('Enter con el campo vacío no envía nada, igual que el botón deshabilitado', () => {
    const enviarMensajeSpy = vi.spyOn(chatClient, 'enviarMensaje');
    renderPantalla(<PantallaEntrevista />, { ruta: '/hablar' });
    fireEvent.keyDown(screen.getByLabelText('Escribe tu respuesta'), { key: 'Enter', code: 'Enter' });
    expect(enviarMensajeSpy).not.toHaveBeenCalled();
  });

  it('el indicador de pasos avanza cuando el motor ya no pide datos de un grupo', async () => {
    vi.spyOn(chatClient, 'enviarMensaje').mockResolvedValue({
      ok: true,
      respuesta: 'Anotado.',
      perfil: { ...PERFIL_DESCONOCIDO, postulanteEdad: 34, integrantesGrupoFamiliar: [] },
      resultados: [
        {
          programa: 'DS49',
          estado: 'falta_dato',
          motivo: 'Faltan datos.',
          camposFaltantes: ['tienePropiedad'],
          regla: { decreto: 'D.S. N°49', fuente: 'docs/programas-subsidio.md', fechaConsulta: '2026-09-22' },
        },
      ],
      plan: [],
    });
    renderPantalla(<PantallaEntrevista />, { ruta: '/hablar' });
    expect(screen.getByText(/PASO 1 DE 5/i)).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Escribe tu respuesta'), 'Hola');
    await userEvent.click(screen.getByRole('button', { name: 'Enviar' }));
    expect(await screen.findByText(/PASO 2 DE 5/i)).toBeInTheDocument();
  });

  it('un 429 muestra el mensaje exacto del backend sobre el límite de mensajes', async () => {
    vi.spyOn(chatClient, 'enviarMensaje').mockResolvedValue({
      ok: false,
      status: 429,
      codigo: 'limite_mensajes',
      mensaje: 'Esta conversación llegó a su límite de mensajes. Puedes empezar una nueva.',
    });
    renderPantalla(<PantallaEntrevista />, { ruta: '/hablar' });
    await userEvent.type(screen.getByLabelText('Escribe tu respuesta'), 'Hola');
    await userEvent.click(screen.getByRole('button', { name: 'Enviar' }));
    expect(
      await screen.findByText('Esta conversación llegó a su límite de mensajes. Puedes empezar una nueva.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Probar modo demo' })).not.toBeInTheDocument();
  });

  it('un 500 sin mensaje del backend muestra el error genérico', async () => {
    vi.spyOn(chatClient, 'enviarMensaje').mockResolvedValue({
      ok: false,
      status: 500,
      codigo: 'error_interno',
    });
    renderPantalla(<PantallaEntrevista />, { ruta: '/hablar' });
    await userEvent.type(screen.getByLabelText('Escribe tu respuesta'), 'Hola');
    await userEvent.click(screen.getByRole('button', { name: 'Enviar' }));
    expect(
      await screen.findByText('Algo no funcionó. Intenta de nuevo en un momento.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Probar modo demo' })).not.toBeInTheDocument();
  });

  it('un 503 ofrece el modo demo, que llena resultados reales sin llamar a la API', async () => {
    const enviarMensajeSpy = vi.spyOn(chatClient, 'enviarMensaje').mockResolvedValue({
      ok: false,
      status: 503,
      codigo: 'asistente_no_disponible',
      mensaje: 'El asistente no está disponible en este momento. Puedes probar el modo demo.',
    });
    renderPantalla(<PantallaEntrevista />, { ruta: '/hablar' });
    await userEvent.type(screen.getByLabelText('Escribe tu respuesta'), 'Hola');
    await userEvent.click(screen.getByRole('button', { name: 'Enviar' }));
    const botonDemo = await screen.findByRole('button', { name: 'Probar modo demo' });
    await userEvent.click(botonDemo);
    expect((await screen.findAllByText(/Califica|No aplica|Falta un dato/)).length).toBeGreaterThan(0);
    expect(enviarMensajeSpy).toHaveBeenCalledTimes(1);
  });

  it('en modo demo dice que es una familia ficticia y no ofrece el campo de mensaje', async () => {
    vi.spyOn(chatClient, 'enviarMensaje').mockResolvedValue({
      ok: false,
      status: 503,
      codigo: 'asistente_no_disponible',
    });
    renderPantalla(<PantallaEntrevista />, { ruta: '/hablar' });
    await userEvent.type(screen.getByLabelText('Escribe tu respuesta'), 'Hola');
    await userEvent.click(screen.getByRole('button', { name: 'Enviar' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Probar modo demo' }));
    expect(await screen.findByText('Estás en modo demo')).toBeInTheDocument();
    expect(screen.getByText(/familia ficticia: los resultados salen del motor real/)).toBeInTheDocument();
    expect(screen.queryByLabelText('Escribe tu respuesta')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Enviar' })).not.toBeInTheDocument();
  });

  it('"Empezar mi conversación" sale del demo y devuelve el campo de mensaje con una sesión nueva', async () => {
    vi.spyOn(chatClient, 'enviarMensaje').mockResolvedValue({
      ok: false,
      status: 503,
      codigo: 'asistente_no_disponible',
    });
    renderPantalla(<PantallaEntrevista />, { ruta: '/hablar' });
    await userEvent.type(screen.getByLabelText('Escribe tu respuesta'), 'Hola');
    await userEvent.click(screen.getByRole('button', { name: 'Enviar' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Probar modo demo' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Empezar mi conversación' }));
    expect(await screen.findByLabelText('Escribe tu respuesta')).toBeInTheDocument();
    expect(screen.queryByText('Estás en modo demo')).not.toBeInTheDocument();
  });
});

describe('PantallaEntrevista en escritorio', () => {
  let control: ControlEscritorio;
  beforeEach(() => {
    window.localStorage.clear();
    control = simularEscritorio(true);
  });
  afterEach(() => {
    control.restaurar();
    vi.restoreAllMocks();
    window.localStorage.clear();
    // Quita el `scrollIntoView` falso que define un test de abajo, aunque ese test falle a mitad.
    delete (HTMLElement.prototype as unknown as Record<string, unknown>).scrollIntoView;
  });

  it('no repite el título "Hablemos" y el avance vive en un panel lateral vertical, no sobre el chat', () => {
    const { container } = renderPantalla(<PantallaEntrevista />, { ruta: '/hablar' });
    expect(screen.queryByRole('heading', { name: 'Hablemos' })).not.toBeInTheDocument();
    const lateral = screen.getByRole('complementary', { name: 'Avance de la entrevista' });
    expect(lateral).toHaveTextContent(/PASO 1 DE 5/i);
    expect(container.querySelector('.MuiStepper-vertical')).toBeInTheDocument();
    expect(container.querySelector('.MuiStepper-horizontal')).not.toBeInTheDocument();
  });

  it('en escritorio no repite la nota de confianza: ya la muestra el sidebar', () => {
    renderPantalla(<PantallaEntrevista />, { ruta: '/hablar' });
    expect(screen.queryByText(/Herramienta independiente, no oficial/)).not.toBeInTheDocument();
  });

  it('la conversación no tiene scroll propio: el scroll es el de la página', () => {
    renderPantalla(<PantallaEntrevista />, { ruta: '/hablar' });
    const registro = screen.getByRole('log', { name: 'Conversación' });
    expect(registro).not.toHaveStyle({ overflowY: 'auto' });
    expect(registro).not.toHaveStyle({ overflowY: 'scroll' });
  });

  it('al llegar mensajes, la página baja hasta el final de la conversación', async () => {
    const scrollIntoView = vi.fn();
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', { configurable: true, value: scrollIntoView });
    vi.spyOn(chatClient, 'enviarMensaje').mockResolvedValue({
      ok: true,
      respuesta: 'Anotado, ¿y tu ahorro?',
      perfil: PERFIL_DESCONOCIDO,
      resultados: [],
      plan: [],
    });
    renderPantalla(<PantallaEntrevista />, { ruta: '/hablar' });
    scrollIntoView.mockClear();
    await userEvent.type(screen.getByLabelText('Escribe tu respuesta'), 'Somos cuatro');
    await userEvent.click(screen.getByRole('button', { name: 'Enviar' }));
    await screen.findByText('Anotado, ¿y tu ahorro?');
    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'end' });
  });

  it('el campo de texto queda fuera del registro, anclado bajo la conversación', () => {
    renderPantalla(<PantallaEntrevista />, { ruta: '/hablar' });
    const registro = screen.getByRole('log', { name: 'Conversación' });
    expect(registro).not.toContainElement(screen.getByLabelText('Escribe tu respuesta'));
  });

  it('si la ventana cruza los 900 px con una respuesta a medias, no se pierde lo escrito', async () => {
    renderPantalla(<PantallaEntrevista />, { ruta: '/hablar' });
    await userEvent.type(screen.getByLabelText('Escribe tu respuesta'), 'Somos cuatro');
    act(() => control.cambiar(false));
    expect(screen.getByLabelText('Escribe tu respuesta')).toHaveValue('Somos cuatro');
    act(() => control.cambiar(true));
    expect(screen.getByLabelText('Escribe tu respuesta')).toHaveValue('Somos cuatro');
  });
});
