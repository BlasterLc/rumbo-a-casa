import type { ReactNode } from 'react';
import { render } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import { MemoryRouter } from 'react-router-dom';
import { LocaleProvider } from '../i18n/LocaleContext';
import { SesionProvider } from '../state/SesionContext';
import { temaRumbo } from '../theme/theme';

/**
 * Envuelve en `<ThemeProvider><LocaleProvider>`, para probar un átomo, molécula u organismo
 * aislado. El tema va siempre: sin él, los `defaultProps` de `temaRumbo` (variant "contained"
 * por defecto, etc.) no se aplican y un componente correcto puede parecer roto en el test.
 */
export function renderConIdioma(ui: ReactNode) {
  return render(
    <ThemeProvider theme={temaRumbo}>
      <LocaleProvider>{ui}</LocaleProvider>
    </ThemeProvider>,
  );
}

/**
 * Envuelve en `<ThemeProvider><LocaleProvider><SesionProvider><MemoryRouter>`, para una pantalla
 * completa con una sola ruta y sin parámetros de URL. Las pantallas que necesitan coincidencia de
 * ruta (`useParams`) o que navegan a otra pantalla dentro del mismo test arman su propio árbol de
 * `<Routes>`/`<Route>` (ver Tasks 27-32), envuelto igual en `<ThemeProvider><LocaleProvider>`.
 */
export function renderPantalla(ui: ReactNode, opciones: { ruta?: string } = {}) {
  return render(
    <ThemeProvider theme={temaRumbo}>
      <LocaleProvider>
        <SesionProvider>
          <MemoryRouter initialEntries={[opciones.ruta ?? '/']}>{ui}</MemoryRouter>
        </SesionProvider>
      </LocaleProvider>
    </ThemeProvider>,
  );
}

export interface ControlEscritorio {
  /** Simula cruzar los 900 px. Envolver en `act()`. */
  cambiar: (activo: boolean) => void;
  restaurar: () => void;
}

/**
 * Simula una ventana ancha (o angosta) con un `matchMedia` falso que responde lo mismo a
 * cualquier consulta. jsdom no trae `matchMedia`, así que sin llamar a esto `useEscritorio()`
 * devuelve false. Llamar ANTES de renderizar y `restaurar()` en `afterEach`.
 */
export function simularEscritorio(activoInicial = true): ControlEscritorio {
  let activo = activoInicial;
  const escuchas = new Set<() => void>();
  const original = window.matchMedia;
  window.matchMedia = ((consulta: string) => ({
    get matches() {
      return activo;
    },
    media: consulta,
    onchange: null,
    addListener: (fn: () => void) => {
      escuchas.add(fn);
    },
    removeListener: (fn: () => void) => {
      escuchas.delete(fn);
    },
    addEventListener: (_tipo: string, fn: () => void) => {
      escuchas.add(fn);
    },
    removeEventListener: (_tipo: string, fn: () => void) => {
      escuchas.delete(fn);
    },
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
  return {
    cambiar(nuevo) {
      activo = nuevo;
      escuchas.forEach((fn) => fn());
    },
    restaurar() {
      window.matchMedia = original;
    },
  };
}

/**
 * El CSS que emotion inyectó hasta ahora. jsdom no evalúa `@media`, así que para probar reglas
 * responsive se busca el texto de la regla en vez de usar `toHaveStyle`.
 */
export function cssActual(): string {
  return Array.from(document.querySelectorAll('style'))
    .map((s) => s.textContent ?? '')
    .join('\n');
}
