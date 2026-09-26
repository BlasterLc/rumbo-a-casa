import { createTheme } from '@mui/material/styles';
import { color, fontFamily, type } from './tokens';

export const temaRumbo = createTheme({
  palette: {
    mode: 'light',
    background: { default: color['surface-base'], paper: color['surface-raised'] },
    text: { primary: color.ink, secondary: color['ink-muted'] },
    primary: { main: color.brand, dark: color['brand-strong'], contrastText: color['ink-on-fill'] },
    secondary: { main: color.accent, dark: color['accent-strong'], contrastText: color['ink-on-fill'] },
    success: { main: color.success, contrastText: color['ink-on-fill'] },
    warning: { main: color.warning, contrastText: color['ink-on-fill'] },
    error: { main: color.danger, contrastText: color['ink-on-fill'] },
    divider: color.border,
  },
  shape: { borderRadius: 14 },
  spacing: 4,
  typography: {
    fontFamily: fontFamily.sans,
    h1: type['display-xl'],
    h2: type['display-l'],
    h3: type['display-m'],
    subtitle1: type.title,
    body1: type['body-l'],
    body2: type.body,
    caption: type.caption,
    overline: { ...type.label, textTransform: 'none' },
    button: { ...type['body-strong'], textTransform: 'none' },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        ':focus-visible': { outline: '3px solid var(--focus-ring)', outlineOffset: '2px' },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true, variant: 'contained', size: 'large' },
      styleOverrides: {
        root: {
          borderRadius: 'var(--radius-md)',
          minHeight: 'var(--size-control)',
          paddingLeft: 'var(--space-5)',
          paddingRight: 'var(--space-5)',
        },
      },
    },
    MuiTextField: { defaultProps: { variant: 'outlined', fullWidth: true } },
    MuiOutlinedInput: {
      styleOverrides: {
        root: { borderRadius: 'var(--radius-md)', minHeight: 'var(--size-control)' },
        notchedOutline: { borderColor: 'var(--border-strong)' },
      },
    },
    MuiAlert: { defaultProps: { variant: 'standard' } },
    MuiTabs: { defaultProps: { variant: 'scrollable', allowScrollButtonsMobile: true } },
    MuiTab: { styleOverrides: { root: { minHeight: 'var(--size-touch)', textTransform: 'none' } } },
    MuiIconButton: { styleOverrides: { root: { minWidth: 'var(--size-touch)', minHeight: 'var(--size-touch)' } } },
    MuiBottomNavigationAction: {
      styleOverrides: { root: { minWidth: 'var(--size-touch)', minHeight: 'var(--size-touch)' } },
    },
    MuiChip: { styleOverrides: { root: { borderRadius: 'var(--radius-pill)' } } },
    MuiCard: { styleOverrides: { root: { borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' } } },
    MuiPaper: { defaultProps: { elevation: 0 } },
  },
});
