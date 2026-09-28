import { AppBar, Toolbar, IconButton, Typography, Stack } from '@mui/material';
import { Icono, type NombreIcono } from '../../atoms/Icono/Icono';
import { Simbolo } from '../../atoms/Simbolo/Simbolo';
import { Franja } from '../Franja/Franja';
import { SelectorIdioma } from '../../atoms/SelectorIdioma/SelectorIdioma';
import { useT } from '../../../i18n/LocaleContext';
import { type as typeTokens } from '../../../theme/tokens';

export interface CabeceraAppProps {
  titulo: string;
  atras?: boolean;
  onAtras?: () => void;
  accion?: boolean;
  accionIcono?: NombreIcono;
  onAccion?: () => void;
  conFranja?: boolean;
}

/**
 * La cabecera fija de la app. Es el único lugar de la interfaz donde el azul profundo ocupa una
 * superficie grande. Solo lleva el símbolo en tintas oscuras, nunca el logotipo completo — el
 * nombre ya está en el título. No se oculta al desplazar. Lleva siempre, a la derecha, el
 * selector de idioma — es el único lugar donde vive, y no depende de ninguna prop.
 */
export function CabeceraApp({
  titulo,
  atras,
  onAtras,
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
          y al título en móvil. Se fuerza al margen y separación estándar de la app. Además, sin
          `py`, el alto del Toolbar quedaba exactamente igual al min-height del botón del
          selector (ambos usan --size-touch): el botón ocupaba el 100% del alto de la barra, sin
          aire arriba ni abajo. */}
      <Toolbar
        sx={{ gap: 'var(--space-3)', px: 'var(--space-4)', py: 'var(--space-2)', minHeight: 'var(--size-touch)' }}
      >
        {atras && (
          <IconButton
            aria-label={t.organisms.cabeceraApp.volver}
            onClick={onAtras}
            sx={{ color: 'var(--ink-on-brand)' }}
          >
            <Icono nombre="atras" />
          </IconButton>
        )}
        <Simbolo tamano={28} tono="claro" />
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
