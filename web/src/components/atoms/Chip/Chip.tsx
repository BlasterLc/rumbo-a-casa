import { Chip, type ChipProps } from '@mui/material';
import { color, fontFamily, sizePx } from '../../../theme/tokens';

export interface ChipFiltroProps extends ChipProps {
  activo?: boolean;
}

/** Filtro tocable: cambia lo que se ve en una lista. La selección se marca con fondo y borde juntos. */
export function ChipFiltro({ activo = false, sx, ...props }: ChipFiltroProps) {
  return (
    <Chip
      variant="outlined"
      sx={{
        height: sizePx['size-touch'],
        fontFamily: fontFamily.sans,
        borderColor: activo ? color.brand : color['border-strong'],
        borderWidth: activo ? 2 : 1,
        backgroundColor: activo ? color['surface-brand-soft'] : 'transparent',
        color: activo ? color['ink-brand'] : color.ink,
        fontWeight: activo ? 600 : 400,
        ...sx,
      }}
      {...props}
    />
  );
}

export interface ChipEtiquetaProps {
  label: string;
}

/** Etiqueta que solo informa: tipo de programa, región, tramo. No se toca. */
export function ChipEtiqueta({ label }: ChipEtiquetaProps) {
  return (
    <Chip
      label={label}
      variant="outlined"
      size="small"
      sx={{ borderColor: color.border, color: color['ink-muted'], fontFamily: fontFamily.sans }}
    />
  );
}
