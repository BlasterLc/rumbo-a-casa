import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { es } from './es';
import { en } from './en';
import type { DiccionarioTextos } from './diccionario';

export type Idioma = 'es' | 'en';

const DICCIONARIOS: Record<Idioma, DiccionarioTextos> = { es, en };
const CLAVE_STORAGE = 'rumbo-idioma';

interface LocaleContextValue {
  idioma: Idioma;
  cambiarIdioma: (idioma: Idioma) => void;
  t: DiccionarioTextos;
}

const LocaleContext = createContext<LocaleContextValue | undefined>(undefined);

function leerIdiomaGuardado(): Idioma {
  try {
    return window.localStorage.getItem(CLAVE_STORAGE) === 'en' ? 'en' : 'es';
  } catch {
    return 'es';
  }
}

/** Idioma por defecto: español. Persistido en localStorage, degrada a memoria si el navegador lo bloquea. */
export function LocaleProvider({ children }: { children: ReactNode }) {
  const [idioma, setIdioma] = useState<Idioma>(() => leerIdiomaGuardado());

  useEffect(() => {
    try {
      window.localStorage.setItem(CLAVE_STORAGE, idioma);
    } catch {
      // localStorage bloqueado (modo privado, cuotas): el idioma sigue funcionando en memoria.
    }
  }, [idioma]);

  return (
    <LocaleContext.Provider value={{ idioma, cambiarIdioma: setIdioma, t: DICCIONARIOS[idioma] }}>
      {children}
    </LocaleContext.Provider>
  );
}

function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale debe usarse dentro de <LocaleProvider>');
  return ctx;
}

export function useIdioma(): { idioma: Idioma; cambiarIdioma: (idioma: Idioma) => void } {
  const { idioma, cambiarIdioma } = useLocale();
  return { idioma, cambiarIdioma };
}

/** El diccionario del idioma activo. Todo componente con copy fijo llama a esto. */
export function useT(): DiccionarioTextos {
  return useLocale().t;
}
