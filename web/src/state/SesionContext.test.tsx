import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LocaleProvider } from '../i18n/LocaleContext';
import { SesionProvider, useSesion } from './SesionContext';
import * as chatClient from '../api/chatClient';
import { PERFIL_DESCONOCIDO } from '../types/dominio';
import type { ResultadoPrograma } from '../types/dominio';

function resultado(programa: ResultadoPrograma['programa'], estado: ResultadoPrograma['estado']): ResultadoPrograma {
  return { programa, estado, motivo: '', regla: { decreto: '', fuente: '', fechaConsulta: '' } };
}

const LOS_4_FALTA_DATO: ResultadoPrograma[] = [
  resultado('DS49', 'falta_dato'),
  resultado('DS1', 'falta_dato'),
  resultado('DS19', 'falta_dato'),
  resultado('DS52', 'falta_dato'),
];

function Sonda() {
  const s = useSesion();
  return (
    <div>
      <div data-testid="transcript-length">{s.transcript.length}</div>
      <div data-testid="eventos-length">{s.eventos.length}</div>
      <div data-testid="error">{s.error?.codigo ?? ''}</div>
      <button onClick={() => s.enviarTurno('Hola')}>enviar</button>
      <button onClick={() => s.borrarDatos()}>borrar</button>
    </div>
  );
}

function conProveedores() {
  return render(
    <LocaleProvider>
      <SesionProvider>
        <Sonda />
      </SesionProvider>
    </LocaleProvider>,
  );
}

describe('SesionProvider', () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it('genera un sessionId nuevo en la primera visita y lo guarda', () => {
    conProveedores();
    expect(window.localStorage.getItem('rumbo-sesion')).toBeTruthy();
  });

  it('al enviar un turno, agrega el mensaje de la persona y luego la respuesta del agente', async () => {
    vi.spyOn(chatClient, 'enviarMensaje').mockResolvedValue({
      ok: true,
      respuesta: 'Hola, ¿en qué región vives?',
      perfil: PERFIL_DESCONOCIDO,
      resultados: [],
      plan: [],
    });
    conProveedores();
    await userEvent.click(screen.getByRole('button', { name: 'enviar' }));
    await waitFor(() => expect(screen.getByTestId('transcript-length')).toHaveTextContent('2'));
  });

  it('al enviar un turno manda el idioma activo de la interfaz al backend', async () => {
    window.localStorage.setItem('rumbo-idioma', 'en');
    const espia = vi.spyOn(chatClient, 'enviarMensaje').mockResolvedValue({
      ok: true,
      respuesta: 'Hi, which region do you live in?',
      perfil: PERFIL_DESCONOCIDO,
      resultados: [],
      plan: [],
    });
    conProveedores();
    await userEvent.click(screen.getByRole('button', { name: 'enviar' }));
    await waitFor(() => expect(espia).toHaveBeenCalledTimes(1));
    expect(espia).toHaveBeenCalledWith(expect.any(String), 'Hola', 'en');
  });

  it('un error del backend queda expuesto, nunca se pierde en silencio', async () => {
    vi.spyOn(chatClient, 'enviarMensaje').mockResolvedValue({
      ok: false,
      status: 503,
      codigo: 'asistente_no_disponible',
      mensaje: 'El asistente no está disponible en este momento. Puedes probar el modo demo.',
    });
    conProveedores();
    await userEvent.click(screen.getByRole('button', { name: 'enviar' }));
    await waitFor(() => expect(screen.getByTestId('error')).toHaveTextContent('asistente_no_disponible'));
  });

  it('borrar los datos limpia localStorage y arranca una sesión nueva', async () => {
    conProveedores();
    const idAntes = JSON.parse(window.localStorage.getItem('rumbo-sesion')!).sessionId;
    await userEvent.click(screen.getByRole('button', { name: 'borrar' }));
    await waitFor(() => {
      const idDespues = JSON.parse(window.localStorage.getItem('rumbo-sesion')!).sessionId;
      expect(idDespues).not.toBe(idAntes);
    });
  });

  it('el primer turno, con los 4 programas en "falta_dato", no genera ningún sello: no es una decisión, es el punto de partida', async () => {
    vi.spyOn(chatClient, 'enviarMensaje').mockResolvedValue({
      ok: true,
      respuesta: 'Cuéntame de tu familia.',
      perfil: PERFIL_DESCONOCIDO,
      resultados: LOS_4_FALTA_DATO,
      plan: [],
    });
    conProveedores();
    await userEvent.click(screen.getByRole('button', { name: 'enviar' }));
    await waitFor(() => expect(screen.getByTestId('transcript-length')).toHaveTextContent('2'));
    expect(screen.getByTestId('eventos-length')).toHaveTextContent('0');
  });

  it('cuando un programa pasa de "falta_dato" a una decisión real, sí genera un sello', async () => {
    const espia = vi
      .spyOn(chatClient, 'enviarMensaje')
      .mockResolvedValueOnce({
        ok: true,
        respuesta: 'Cuéntame de tu familia.',
        perfil: PERFIL_DESCONOCIDO,
        resultados: LOS_4_FALTA_DATO,
        plan: [],
      })
      .mockResolvedValueOnce({
        ok: true,
        respuesta: 'Calificas para DS19.',
        perfil: PERFIL_DESCONOCIDO,
        resultados: [
          resultado('DS49', 'falta_dato'),
          resultado('DS1', 'falta_dato'),
          resultado('DS19', 'elegible'),
          resultado('DS52', 'no_elegible'),
        ],
        plan: [],
      });
    conProveedores();
    await userEvent.click(screen.getByRole('button', { name: 'enviar' }));
    await waitFor(() => expect(espia).toHaveBeenCalledTimes(1));
    await userEvent.click(screen.getByRole('button', { name: 'enviar' }));
    await waitFor(() => expect(espia).toHaveBeenCalledTimes(2));
    // Solo DS19 (a elegible) y DS52 (a no_elegible) son decisiones nuevas; los dos que
    // siguen en falta_dato no deberían sumar un segundo sello.
    expect(screen.getByTestId('eventos-length')).toHaveTextContent('2');
  });

  it('si localStorage lanza (modo privado), la sesión sigue funcionando en memoria', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    expect(() => conProveedores()).not.toThrow();
  });
});
