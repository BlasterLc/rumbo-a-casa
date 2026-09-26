import type { Idioma, Perfil, ResultadoPrograma, PlanPrograma } from '../types/dominio';

export interface ChatOk {
  ok: true;
  respuesta: string;
  perfil: Perfil;
  resultados: ResultadoPrograma[];
  plan: PlanPrograma[];
}

export type ChatErrorCodigo =
  | 'solicitud_invalida'
  | 'limite_mensajes'
  | 'asistente_no_disponible'
  | 'error_interno'
  | 'red';

export interface ChatError {
  ok: false;
  status: number;
  codigo: ChatErrorCodigo;
  mensaje?: string;
}

export type ChatResultado = ChatOk | ChatError;

/**
 * Cliente de `POST /api/chat`. Nunca lanza: todo error de red o del servidor vuelve como
 * `{ ok: false }`, para que la pantalla decida cómo mostrarlo — nunca depende de un catch
 * genérico que oculte el 429/503 documentado por el backend.
 */
export async function enviarMensaje(
  sessionId: string,
  mensaje: string,
  idioma: Idioma,
): Promise<ChatResultado> {
  let res: Response;
  try {
    res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ sessionId, mensaje, idioma }),
    });
  } catch {
    return { ok: false, status: 0, codigo: 'red' };
  }

  const cuerpo = (await res.json().catch(() => ({}))) as Record<string, unknown>;

  if (res.ok) {
    return {
      ok: true,
      respuesta: cuerpo.respuesta as string,
      perfil: cuerpo.perfil as Perfil,
      resultados: cuerpo.resultados as ResultadoPrograma[],
      plan: cuerpo.plan as PlanPrograma[],
    };
  }

  return {
    ok: false,
    status: res.status,
    codigo: (cuerpo.error as ChatErrorCodigo) ?? 'error_interno',
    mensaje: cuerpo.mensaje as string | undefined,
  };
}
