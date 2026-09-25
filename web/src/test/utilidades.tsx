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
