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
 * Cabecera de escritorio: marca a la izquierda, los cuatro destinos a continuación de la marca y el
 * selector de idioma a la derecha. Ocupa todo el ancho en `surface-brand`; el contenido interior se limita
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
          sx={{
            minHeight: 'var(--size-touch)',
            borderRadius: 'var(--radius-sm)',
            // ButtonBase pone `outline: 0` y gana al foco global: el anillo se declara completo, en blanco.
            '&:focus-visible': { outline: '3px solid var(--ink-on-brand)', outlineOffset: '2px' },
          }}
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
