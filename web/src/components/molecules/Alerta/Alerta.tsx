import type { ReactNode } from 'react';
import { Alert, AlertTitle, Button } from '@mui/material';
import { color } from '../../../theme/tokens';

export type Severidad = 'info' | 'success' | 'warning' | 'error';

const SUPERFICIE: Record<Severidad, { fondo: string; tinta: string }> = {
  info: { fondo: color['surface-brand-soft'], tinta: color['ink-brand'] },
  success: { fondo: color['surface-success-soft'], tinta: color['ink-success'] },
  warning: { fondo: color['surface-warning-soft'], tinta: color['ink-warning'] },
  error: { fondo: color['surface-danger-soft'], tinta: color['ink-danger'] },
};

export interface AlertaProps {
  severity?: Severidad;
  titulo?: string;
  children?: ReactNode;
  /** Un solo enlace de acción, al final del mensaje. */
  accion?: string;
  /** No forma parte del `index.d.ts` publicado (que solo trae la etiqueta); se agrega porque
   * un botón de acción sin manejador no hace nada. Opcional a propósito. */
  onAccion?: () => void;
  /** La acción va en su propia fila, a todo el ancho, bajo el texto (en vez de a la derecha). Sirve en paneles angostos donde el texto se recortaría. */
  accionAbajo?: boolean;
}

/**
 * Mensaje del sistema sobre el estado del trámite. Máximo una por pantalla — si hay dos cosas
 * urgentes, la segunda va dentro de la tarjeta que le corresponde, no en una segunda alerta.
 */
export function Alerta({ severity = 'info', titulo, children, accion, onAccion, accionAbajo = false }: AlertaProps) {
  const { fondo, tinta } = SUPERFICIE[severity];
  return (
    <Alert
      severity={severity}
      variant="standard"
      sx={{
        backgroundColor: fondo,
        color: tinta,
        borderRadius: 'var(--radius-md)',
        fontFamily: 'var(--font-sans)',
        '& .MuiAlert-icon': { color: tinta },
        '& .MuiAlert-message': accionAbajo ? { flex: 1, minWidth: 0 } : undefined,
      }}
      action={
        accion && !accionAbajo ? (
          <Button color="inherit" size="small" onClick={onAccion} sx={{ fontWeight: 700 }}>
            {accion}
          </Button>
        ) : undefined
      }
    >
      {titulo && <AlertTitle sx={{ fontWeight: 700 }}>{titulo}</AlertTitle>}
      {children}
      {accion && accionAbajo && (
        <Button
          color="inherit"
          size="small"
          onClick={onAccion}
          sx={{ fontWeight: 700, mt: 1.5, width: '100%', backgroundColor: 'rgba(255, 255, 255, 0.6)' }}
        >
          {accion}
        </Button>
      )}
    </Alert>
  );
}
