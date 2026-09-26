import { AppBar, Box, ButtonBase, Toolbar } from '@mui/material';
import { Logotipo } from '../Logotipo/Logotipo';
import { NavegacionSuperior } from '../NavegacionSuperior/NavegacionSuperior';
import type { DestinoBarraInferior } from '../BarraInferior/BarraInferior';
import { SelectorIdioma } from '../../atoms/SelectorIdioma/SelectorIdioma';
import { useT } from '../../../i18n/LocaleContext';
import { sizePx } from '../../../theme/tokens';

export interface CabeceraEscritorioProps {
  destino: DestinoBarraInferior;
  avisos?: number;
  onNavegar: (destino: DestinoBarraInferior) => void;
  onInicio: () => void;
}

/**
 * Cabecera de escritorio: marca a la izquierda, los cuatro destinos al centro y el selector de
 * idioma a la derecha. Ocupa todo el ancho en `surface-brand`; el contenido interior se limita
 * al mismo ancho de página que el resto. Reemplaza a `CabeceraApp` + `BarraInferior` a partir
 * de 900 px (lo decide `AppShell`).
 */
export function CabeceraEscritorio({ destino, avisos = 0, onNavegar, onInicio }: CabeceraEscritorioProps) {
  const t = useT();
  return (
    <AppBar position="sticky" elevation={0} sx={{ backgroundColor: 'var(--surface-brand)', top: 0 }}>
      <Toolbar
        disableGutters
        sx={{
          width: '100%',
          maxWidth: sizePx['size-page'],
          mx: 'auto',
          px: 'var(--space-6)',
          minHeight: 'var(--size-header)',
          gap: 'var(--space-6)',
        }}
      >
        <ButtonBase
          aria-label={`Rumbo a Casa · ${t.organisms.cabeceraEscritorio.inicio}`}
          onClick={onInicio}
          sx={{ minHeight: 'var(--size-touch)', borderRadius: 'var(--radius-sm)', '&:focus-visible': { outlineColor: 'var(--ink-on-brand)' } }}
        >
          <Logotipo disposicion="horizontal" alto={36} tono="claro" />
        </ButtonBase>
        <Box sx={{ flex: 1 }}>
          <NavegacionSuperior value={destino} avisos={avisos} onChange={(_e, v) => onNavegar(v as DestinoBarraInferior)} />
        </Box>
        <SelectorIdioma />
      </Toolbar>
    </AppBar>
  );
}
