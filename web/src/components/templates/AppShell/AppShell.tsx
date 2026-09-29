import type { ReactNode } from 'react';
import { Box, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { CabeceraApp } from '../../organisms/CabeceraApp/CabeceraApp';
import { CabeceraEscritorio } from '../../organisms/CabeceraEscritorio/CabeceraEscritorio';
import { SidebarEscritorio } from '../../organisms/SidebarEscritorio/SidebarEscritorio';
import { BarraInferior, type DestinoBarraInferior } from '../../organisms/BarraInferior/BarraInferior';
import { Boton } from '../../atoms/Boton/Boton';
import { useEscritorio } from '../../../lib/useEscritorio';
import { useT } from '../../../i18n/LocaleContext';
import { type as typeTokens, sizePx } from '../../../theme/tokens';

const RUTA_DESTINO: Record<DestinoBarraInferior, string> = {
  hablar: '/hablar',
  plan: '/resultado',
  documentos: '/documentos',
  avisos: '/avisos',
};

const ANCHO_MAXIMO_MOVIL = 480;

export interface AppShellProps {
  titulo: string;
  destino: DestinoBarraInferior;
  avisos?: number;
  atras?: boolean;
  /** Solo escritorio: con `false` no se dibuja el `h1`, porque el contenido ya trae su propio
   * título (el hero de Resultado). En móvil el título vive siempre en la cabecera. */
  tituloVisible?: boolean;
  children: ReactNode;
}

/**
 * Armazón de pantalla. En móvil (< 900 px): cabecera fija arriba, contenido con margen lateral,
 * barra de navegación fija abajo, en una columna centrada de 480 px. En escritorio (≥ 900 px):
 * `CabeceraEscritorio` (sin navegación) arriba y, debajo, `SidebarEscritorio` con los cuatro
 * destinos a la izquierda del contenido, que llega hasta 1120 px con el título como `h1` y, si
 * `atras`, un botón "Volver" encima.
 */
export function AppShell({ titulo, destino, avisos = 0, atras = false, tituloVisible = true, children }: AppShellProps) {
  const navigate = useNavigate();
  const escritorio = useEscritorio();
  const t = useT();

  if (escritorio) {
    return (
      <Box sx={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--surface-base)' }}>
        <CabeceraEscritorio onInicio={() => navigate('/')} />
        <Box sx={{ flex: 1, display: 'flex', minHeight: 0 }}>
          <SidebarEscritorio
            destino={destino}
            avisos={avisos}
            onNavegar={(d) => navigate(RUTA_DESTINO[d])}
          />
          <Box
            component="main"
            sx={{ flex: 1, minWidth: 0, width: '100%', maxWidth: sizePx['size-page'], mx: 'auto', px: 'var(--space-6)', pb: 'var(--space-8)' }}
          >
            {atras && (
              <Boton
                variant="text"
                icono="atras"
                onClick={() => navigate(-1)}
                sx={{ mt: 'var(--space-4)', px: 'var(--space-3)', ml: 'calc(-1 * var(--space-3))', minHeight: 'var(--size-touch)' }}
              >
                {t.organisms.cabeceraApp.volver}
              </Boton>
            )}
            {tituloVisible && (
              <Typography
                component="h1"
                sx={{ ...typeTokens['display-l'], color: 'var(--ink-strong)', pt: atras ? 0.5 : 'var(--space-6)' }}
              >
                {titulo}
              </Typography>
            )}
            <Box sx={{ pt: 'var(--space-5)' }}>{children}</Box>
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        maxWidth: ANCHO_MAXIMO_MOVIL,
        mx: 'auto',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--surface-base)',
      }}
    >
      <CabeceraApp titulo={titulo} onInicio={() => navigate('/')} />
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
