import { AppBar, Box, ButtonBase, Toolbar, Typography } from '@mui/material';
import { Logotipo } from '../Logotipo/Logotipo';
import { SelectorIdioma } from '../../atoms/SelectorIdioma/SelectorIdioma';
import { useT } from '../../../i18n/LocaleContext';

export interface CabeceraEscritorioProps {
  onInicio: () => void;
}

/**
 * Cabecera angosta de escritorio: marca, la aclaración de que no es un sitio del Estado, y el
 * selector de idioma. Ya no lleva navegación — los cuatro destinos viven en `SidebarEscritorio`,
 * debajo de esta cabecera (lo arma `AppShell`).
 */
export function CabeceraEscritorio({ onInicio }: CabeceraEscritorioProps) {
  const t = useT();
  return (
    <AppBar position="sticky" elevation={0} sx={{ backgroundColor: 'var(--surface-brand)', top: 0 }}>
      <Toolbar
        disableGutters
        sx={{
          width: '100%',
          px: 'var(--space-6)',
          minHeight: 'var(--size-header)',
          // El `Toolbar` de MUI trae su propia regla `@media (min-width:600px){min-height:64px}`,
          // que le gana al `minHeight` de arriba desde ese ancho. Sin este override la cabecera
          // termina midiendo 64 px en vez de 72, y `SidebarEscritorio` (que asume `--size-header`)
          // deja un hueco visible debajo de la cabecera.
          '@media (min-width:600px)': { minHeight: 'var(--size-header)' },
          gap: 'var(--space-4)',
        }}
      >
        <ButtonBase
          aria-label={`Rumbo a Casa · ${t.organisms.cabeceraEscritorio.inicio}`}
          onClick={onInicio}
          sx={{
            minHeight: 'var(--size-touch)',
            borderRadius: 'var(--radius-sm)',
            '&:focus-visible': { outline: '3px solid var(--ink-on-brand)', outlineOffset: '2px' },
          }}
        >
          <Logotipo disposicion="horizontal" alto={44} tono="claro" />
        </ButtonBase>
        <Typography
          sx={{
            fontSize: '13px',
            fontWeight: 600,
            color: 'var(--surface-brand-soft)',
            backgroundColor: 'rgba(255, 255, 255, 0.12)',
            px: 'var(--space-3)',
            py: '4px',
            borderRadius: 'var(--radius-pill)',
          }}
        >
          {t.organisms.cabeceraEscritorio.etiquetaNoOficial}
        </Typography>
        <Box sx={{ flex: 1 }} />
        <SelectorIdioma />
      </Toolbar>
    </AppBar>
  );
}
