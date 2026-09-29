import { AppBar, ButtonBase, Toolbar, IconButton, Typography, Stack } from '@mui/material';
import { Icono, type NombreIcono } from '../../atoms/Icono/Icono';
import { Logotipo } from '../Logotipo/Logotipo';
import { Franja } from '../Franja/Franja';
import { SelectorIdioma } from '../../atoms/SelectorIdioma/SelectorIdioma';
import { useT } from '../../../i18n/LocaleContext';
import { type as typeTokens } from '../../../theme/tokens';

export interface CabeceraAppProps {
  titulo: string;
  /** El logo de la izquierda es un botón que vuelve al landing, igual que en escritorio. */
  onInicio: () => void;
  accion?: boolean;
  accionIcono?: NombreIcono;
  onAccion?: () => void;
  conFranja?: boolean;
}

/**
 * La cabecera fija de la app. Es el único lugar de la interfaz donde el azul profundo ocupa una
 * superficie grande. A la izquierda lleva el logotipo completo, que es el botón para volver al
 * landing (como en `CabeceraEscritorio`); no hay flecha de volver. No se oculta al desplazar. Lleva siempre, a la derecha, el
 * selector de idioma — es el único lugar donde vive, y no depende de ninguna prop.
 */
export function CabeceraApp({
  titulo,
  onInicio,
  accion,
  accionIcono,
  onAccion,
  conFranja,
}: CabeceraAppProps) {
  const t = useT();
  return (
    <AppBar position="sticky" elevation={0} sx={{ backgroundColor: 'var(--surface-brand)', top: 0 }}>
      {/* El Toolbar de MUI trae por defecto la mitad de este padding y un gap de 4px entre el
          título y el selector — demasiado angosto, deja el selector de idioma pegado al borde
          y al título en móvil. Se fuerza al margen y separación estándar de la app. */}
      <Toolbar sx={{ gap: 'var(--space-3)', px: 'var(--space-4)', minHeight: 'var(--size-touch)' }}>
        <ButtonBase
          aria-label={`Rumbo a Casa · ${t.organisms.cabeceraEscritorio.inicio}`}
          onClick={onInicio}
          sx={{
            minHeight: 'var(--size-touch)',
            borderRadius: 'var(--radius-sm)',
            '&:focus-visible': { outline: '3px solid var(--ink-on-brand)', outlineOffset: '2px' },
          }}
        >
          <Logotipo disposicion="horizontal" alto={28} tono="claro" />
        </ButtonBase>
        <Typography
          noWrap
          sx={{
            fontFamily: typeTokens.title.fontFamily,
            fontWeight: typeTokens.title.fontWeight,
            fontSize: typeTokens.title.fontSize,
            color: 'var(--ink-on-brand)',
            flex: 1,
          }}
        >
          {titulo}
        </Typography>
        <Stack direction="row" spacing={0.5} alignItems="center">
          {accion && accionIcono && (
            <IconButton
              aria-label={t.organisms.cabeceraApp.accion}
              onClick={onAccion}
              sx={{ color: 'var(--ink-on-brand)' }}
            >
              <Icono nombre={accionIcono} />
            </IconButton>
          )}
          <SelectorIdioma />
        </Stack>
      </Toolbar>
      {conFranja && <Franja alto={24} tono="brand" borde="abajo" />}
    </AppBar>
  );
}
