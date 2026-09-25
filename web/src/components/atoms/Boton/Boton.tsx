import { Button, type ButtonProps } from '@mui/material';
import { Icono, type NombreIcono } from '../Icono/Icono';

export interface BotonProps extends Omit<ButtonProps, 'startIcon' | 'endIcon'> {
  icono?: NombreIcono;
  iconoFinal?: NombreIcono;
  /** Deshabilita el botón y marca aria-busy. El texto de "Guardando…" lo decide quien lo usa. */
  loading?: boolean;
}

/**
 * Acción de la persona. Una sola jerarquía `contained` por pantalla: si compiten dos, uno de
 * los dos no es la acción principal. Ver `guidelines/20-material-ui.md` y el README de este
 * componente en el design system.
 */
export function Boton({
  icono,
  iconoFinal,
  loading = false,
  disabled,
  variant = 'contained',
  children,
  ...props
}: BotonProps) {
  return (
    <Button
      variant={variant}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      startIcon={icono ? <Icono nombre={icono} /> : undefined}
      endIcon={iconoFinal ? <Icono nombre={iconoFinal} /> : undefined}
      {...props}
    >
      {children}
    </Button>
  );
}
