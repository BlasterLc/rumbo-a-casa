import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LocaleProvider, useIdioma } from '../i18n/LocaleContext';
import { SesionProvider, useSesion } from './SesionContext';
import * as chatClient from '../api/chatClient';
import { PERFIL_DESCONOCIDO } from '../types/dominio';
import { FOLIO_DEMO } from '../lib/perfilDemo';
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
  const { cambiarIdioma } = useIdioma();
  return (
    <div>
      <div data-testid="transcript-length">{s.transcript.length}</div>
      <div data-testid="eventos-length">{s.eventos.length}</div>
      <div data-testid="error">{s.error?.codigo ?? ''}</div>
      <button onClick={() => s.enviarTurno('Hola')}>enviar</button>
      <button onClick={() => s.borrarDatos()}>borrar</button>
      <button onClick={() => cambiarIdioma('en')}>en</button>
      <button onClick={() => cambiarIdioma('es')}>es</button>
      <button onClick={() => s.activarDemo()}>demo</button>
      <pre data-testid="estado-json">{JSON.stringify({ transcript: s.transcript, eventos: s.eventos, resultados: s.resultados })}</pre>
      <div data-testid="folio">{s.seguimiento.folio ?? ''}</div>
      <div data-testid="etapa">{s.seguimiento.etapa}</div>
      <div data-testid="docs-listos">{Object.values(s.documentosListos).filter(Boolean).length}</div>
      <div data-testid="programas-plan">{s.plan.length}</div>
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

  it('el modo demo deja un folio ficticio, la etapa "postulé" y un documento listo por programa', async () => {
    conProveedores();
    await userEvent.click(screen.getByRole('button', { name: 'demo' }));
    expect(screen.getByTestId('folio')).toHaveTextContent(FOLIO_DEMO);
    expect(screen.getByTestId('etapa')).toHaveTextContent('postule');
    const programas = Number(screen.getByTestId('programas-plan').textContent);
    expect(programas).toBeGreaterThan(0);
    expect(screen.getByTestId('docs-listos')).toHaveTextContent(String(programas));
  });


  const estadoJson = () => JSON.parse(screen.getByTestId('estado-json').textContent ?? '{}');

  it('el modo demo deja la conversación completa: aviso, y luego cada mensaje de la familia con su respuesta', async () => {
    conProveedores();
    await userEvent.click(screen.getByRole('button', { name: 'demo' }));
    const { transcript, resultados } = estadoJson();
    expect(transcript.map((t: { autor: string }) => t.autor)).toEqual([
      'agente', 'persona', 'agente', 'persona', 'agente', 'persona', 'agente', 'persona', 'agente',
    ]);
    expect(transcript[1].texto).toMatch(/familia de 4 en Santiago/);
    expect(transcript.at(-1).texto).toMatch(/No calificas a DS1/);
    expect(resultados.map((r: { programa: string }) => r.programa)).toEqual(['DS49', 'DS19', 'DS52', 'DS1']);
    const ids = transcript.map((t: { id: string }) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('activar el demo dos veces no repite los sellos ni la conversación', async () => {
    conProveedores();
    await userEvent.click(screen.getByRole('button', { name: 'demo' }));
    await userEvent.click(screen.getByRole('button', { name: 'demo' }));
    const { eventos, transcript } = estadoJson();
    expect(eventos).toHaveLength(4);
    expect(transcript).toHaveLength(9);
  });

  it('si cambias de idioma con el demo activo, la conversación y los resultados pasan al nuevo idioma', async () => {
    conProveedores();
    await userEvent.click(screen.getByRole('button', { name: 'demo' }));
    await userEvent.click(screen.getByRole('button', { name: 'en' }));
    const { transcript, resultados } = estadoJson();
    expect(transcript[1].texto).toMatch(/family of 4 in Santiago/);
    expect(transcript.at(-1).texto).toMatch(/You don't qualify for DS1/);
    expect(resultados.find((r: { programa: string }) => r.programa === 'DS1').motivo).not.toMatch(/No alcanza el ahorro/);
    expect(transcript).toHaveLength(9);
    await userEvent.click(screen.getByRole('button', { name: 'es' }));
    expect(estadoJson().transcript.at(-1).texto).toMatch(/No calificas a DS1/);
  });

  it('si localStorage lanza (modo privado), la sesión sigue funcionando en memoria', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    expect(() => conProveedores()).not.toThrow();
  });
});
