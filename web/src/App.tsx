import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LocaleProvider } from './i18n/LocaleContext';
import { SesionProvider } from './state/SesionContext';
import { Catalogo } from './dev/Catalogo';
import { PantallaBienvenida } from './screens/PantallaBienvenida/PantallaBienvenida';
import { PantallaEntrevista } from './screens/PantallaEntrevista/PantallaEntrevista';
import { PantallaResultado } from './screens/PantallaResultado/PantallaResultado';
import { PantallaPlan } from './screens/PantallaPlan/PantallaPlan';
import { PantallaDocumentos } from './screens/PantallaDocumentos/PantallaDocumentos';
import { PantallaSeguimiento } from './screens/PantallaSeguimiento/PantallaSeguimiento';

export function App() {
  return (
    <LocaleProvider>
      <SesionProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<PantallaBienvenida />} />
            <Route path="/hablar" element={<PantallaEntrevista />} />
            <Route path="/resultado" element={<PantallaResultado />} />
            <Route path="/plan/:programa" element={<PantallaPlan />} />
            <Route path="/documentos" element={<PantallaDocumentos />} />
            <Route path="/avisos" element={<PantallaSeguimiento />} />
            <Route path="/catalogo" element={<Catalogo />} />
          </Routes>
        </BrowserRouter>
      </SesionProvider>
    </LocaleProvider>
  );
}
