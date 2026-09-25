import { LocaleProvider } from './i18n/LocaleContext';
import { Catalogo } from './dev/Catalogo';

export function App() {
  return (
    <LocaleProvider>
      <AppInterno />
    </LocaleProvider>
  );
}

function AppInterno() {
  if (window.location.pathname === '/catalogo') return <Catalogo />;
  return (
    <div style={{ padding: 24, fontFamily: 'sans-serif' }}>
      Rumbo a Casa — interfaz en construcción. Visita <a href="/catalogo">/catalogo</a> para ver los
      componentes ya hechos.
    </div>
  );
}
