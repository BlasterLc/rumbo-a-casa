import type { ReactNode } from 'react';
import { Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { CabeceraApp } from '../../organisms/CabeceraApp/CabeceraApp';
import { BarraInferior, type DestinoBarraInferior } from '../../organisms/BarraInferior/BarraInferior';

const RUTA_DESTINO: Record<DestinoBarraInferior, string> = {
  hablar: '/hablar',
  plan: '/resultado',
  documentos: '/documentos',
  avisos: '/avisos',
};

const ANCHO_MAXIMO = 480;

export interface AppShellProps {
  titulo: string;
  destino: DestinoBarraInferior;
  avisos?: number;
  atras?: boolean;
  children: ReactNode;
}

/**
 * Armazón de pantalla: cabecera fija arriba, contenido con margen lateral, barra de navegación
 * fija abajo. `space-7` de relleno inferior para que el último bloque no quede tapado por la
 * barra. Centrado con `maxWidth: 480` en pantallas anchas — la misma columna móvil del design
 * system, letterboxed sobre el `surface-sunken` de `body` (Task 3); nunca un layout de
 * escritorio nuevo.
 */
export function AppShell({ titulo, destino, avisos = 0, atras = false, children }: AppShellProps) {
  const navigate = useNavigate();
  return (
    <Box
      sx={{
        minHeight: '100dvh',
        maxWidth: ANCHO_MAXIMO,
        mx: 'auto',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--surface-base)',
      }}
    >
      <CabeceraApp titulo={titulo} atras={atras} onAtras={() => navigate(-1)} />
      <Box component="main" sx={{ flex: 1, px: 'var(--space-4)', pt: 'var(--space-5)', pb: 'var(--space-7)' }}>
        {children}
      </Box>
      <BarraInferior
        value={destino}
        avisos={avisos}
        onChange={(_e, v) => navigate(RUTA_DESTINO[v as DestinoBarraInferior])}
      />
    </Box>
  );
}
