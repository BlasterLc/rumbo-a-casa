import type { ReactNode } from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LocaleProvider } from '../i18n/LocaleContext';
import { SesionProvider } from '../state/SesionContext';

/** Envuelve solo en `<LocaleProvider>`, para probar un átomo, molécula u organismo aislado. */
export function renderConIdioma(ui: ReactNode) {
  return render(<LocaleProvider>{ui}</LocaleProvider>);
}

/**
 * Envuelve en `<LocaleProvider><SesionProvider><MemoryRouter>`, para una pantalla completa con
 * una sola ruta y sin parámetros de URL. Las pantallas que necesitan coincidencia de ruta
 * (`useParams`) o que navegan a otra pantalla dentro del mismo test arman su propio árbol de
 * `<Routes>`/`<Route>` (ver Tasks 27-32), envuelto igual en `<LocaleProvider>`.
 */
export function renderPantalla(ui: ReactNode, opciones: { ruta?: string } = {}) {
  return render(
    <LocaleProvider>
      <SesionProvider>
        <MemoryRouter initialEntries={[opciones.ruta ?? '/']}>{ui}</MemoryRouter>
      </SesionProvider>
    </LocaleProvider>,
  );
}
