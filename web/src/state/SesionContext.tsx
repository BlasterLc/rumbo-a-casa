import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { enviarMensaje, type ChatError } from '../api/chatClient';
import { useIdioma, useT } from '../i18n/LocaleContext';
import {
  PERFIL_DESCONOCIDO,
  evaluarTodosLosProgramas,
  generarPlanPapeles,
  type Perfil,
  type ResultadoPrograma,
  type PlanPrograma,
  type Programa,
  type EstadoElegibilidad as EstadoBackend,
} from '../types/dominio';

export interface TurnoChat {
  id: string;
  autor: 'agente' | 'persona';
  texto: string;
  dictado?: boolean;
}

export interface EventoSello {
  id: string;
  programa: Programa;
  estado: EstadoBackend;
}

export interface EstadoSeguimiento {
  etapa: 'papeles' | 'postule' | 'evaluacion' | 'resultado';
  folio?: string;
}

export interface EstadoSesion {
  sessionId: string;
  transcript: TurnoChat[];
  eventos: EventoSello[];
  perfil: Perfil;
  resultados: ResultadoPrograma[];
  plan: PlanPrograma[];
  documentosListos: Record<string, boolean>;
  seguimiento: EstadoSeguimiento;
  esDemo: boolean;
}

const CLAVE_STORAGE = 'rumbo-sesion';

function crearId(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
}

function sesionNueva(): EstadoSesion {
  return {
    sessionId: crearId(),
    transcript: [],
    eventos: [],
    perfil: PERFIL_DESCONOCIDO,
    resultados: [],
    plan: [],
    documentosListos: {},
    seguimiento: { etapa: 'papeles' },
    esDemo: false,
  };
}

function leerStorage(): EstadoSesion | undefined {
  try {
    const bruto = window.localStorage.getItem(CLAVE_STORAGE);
    return bruto ? (JSON.parse(bruto) as EstadoSesion) : undefined;
  } catch {
    return undefined;
  }
}

function escribirStorage(estado: EstadoSesion) {
  try {
    window.localStorage.setItem(CLAVE_STORAGE, JSON.stringify(estado));
  } catch {
    // localStorage bloqueado (modo privado, cuotas): la sesión sigue en memoria, sin persistir.
  }
}

export interface SesionContextValue extends EstadoSesion {
  cargando: boolean;
  error?: ChatError;
  enviarTurno: (mensaje: string) => Promise<void>;
  activarDemo: (perfilDemo: Perfil) => void;
  marcarDocumento: (clave: string, listo: boolean) => void;
  marcarEtapa: (etapa: EstadoSeguimiento['etapa']) => void;
  guardarFolio: (folio: string) => void;
  borrarDatos: () => void;
}

const SesionContext = createContext<SesionContextValue | undefined>(undefined);

/** Requiere montarse dentro de `<LocaleProvider>` (Task 2) — usa `useT()` para el mensaje de
 * "modo demo activado" que agrega a la transcripción. */
export function SesionProvider({ children }: { children: ReactNode }) {
  const t = useT();
  const { idioma } = useIdioma();
  const [estado, setEstado] = useState<EstadoSesion>(() => leerStorage() ?? sesionNueva());
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<ChatError | undefined>();

  useEffect(() => {
    escribirStorage(estado);
  }, [estado]);

  const enviarTurno = async (mensaje: string) => {
    const idPersona = crearId();
    setEstado((prev) => ({
      ...prev,
      transcript: [...prev.transcript, { id: idPersona, autor: 'persona', texto: mensaje }],
    }));
    setCargando(true);
    setError(undefined);
    const resultado = await enviarMensaje(estado.sessionId, mensaje, idioma);
    setCargando(false);
    if (!resultado.ok) {
      setError(resultado);
      return;
    }
    setEstado((prev) => {
      // "falta_dato" no es una decisión, es el punto de partida: no se sella. Solo se sella
      // cuando el motor de reglas llega a un veredicto nuevo (elegible o no_elegible).
      const eventosNuevos: EventoSello[] = resultado.resultados
        .filter((r) => r.estado !== 'falta_dato')
        .filter((r) => prev.resultados.find((p) => p.programa === r.programa)?.estado !== r.estado)
        .map((r) => ({ id: crearId(), programa: r.programa, estado: r.estado }));
      return {
        ...prev,
        transcript: [...prev.transcript, { id: crearId(), autor: 'agente', texto: resultado.respuesta }],
        eventos: [...prev.eventos, ...eventosNuevos],
        perfil: resultado.perfil,
        resultados: resultado.resultados,
        plan: resultado.plan,
      };
    });
  };

  const activarDemo = (perfilDemo: Perfil) => {
    const resultados = evaluarTodosLosProgramas(perfilDemo, idioma);
    const plan = generarPlanPapeles(resultados, idioma);
    setEstado((prev) => ({
      ...prev,
      esDemo: true,
      perfil: perfilDemo,
      resultados,
      plan,
      eventos: resultados
        .filter((r) => r.estado !== 'falta_dato')
        .map((r) => ({ id: crearId(), programa: r.programa, estado: r.estado })),
      transcript: [
        ...prev.transcript,
        { id: crearId(), autor: 'agente', texto: t.pantallas.entrevista.mensajeDemoActivado },
      ],
    }));
    setError(undefined);
  };

  const marcarDocumento = (clave: string, listo: boolean) => {
    setEstado((prev) => ({ ...prev, documentosListos: { ...prev.documentosListos, [clave]: listo } }));
  };

  const marcarEtapa = (etapa: EstadoSeguimiento['etapa']) => {
    setEstado((prev) => ({ ...prev, seguimiento: { ...prev.seguimiento, etapa } }));
  };

  const guardarFolio = (folio: string) => {
    setEstado((prev) => ({ ...prev, seguimiento: { ...prev.seguimiento, folio } }));
  };

  const borrarDatos = () => {
    try {
      window.localStorage.removeItem(CLAVE_STORAGE);
    } catch {
      // nada que limpiar si localStorage no está disponible
    }
    setEstado(sesionNueva());
    setError(undefined);
  };

  return (
    <SesionContext.Provider
      value={{
        ...estado,
        cargando,
        error,
        enviarTurno,
        activarDemo,
        marcarDocumento,
        marcarEtapa,
        guardarFolio,
        borrarDatos,
      }}
    >
      {children}
    </SesionContext.Provider>
  );
}

export function useSesion(): SesionContextValue {
  const ctx = useContext(SesionContext);
  if (!ctx) throw new Error('useSesion debe usarse dentro de <SesionProvider>');
  return ctx;
}
