import { useMediaQuery, useTheme } from '@mui/material';

/**
 * true a partir de 900 px (el breakpoint `md` de MUI). Sin `matchMedia` (jsdom, render en
 * servidor) devuelve false: la versión móvil. Se usa solo para cambios estructurales; los de
 * estilo van con breakpoints en `sx`.
 */
export function useEscritorio(): boolean {
  const theme = useTheme();
  return useMediaQuery(theme.breakpoints.up('md'));
}
