import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderPantalla } from '../../test/utilidades';
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
});
