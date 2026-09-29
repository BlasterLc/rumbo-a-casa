import type { ReactNode } from 'react';
import { Paper, CircularProgress, Typography } from '@mui/material';
import { type as typeTokens } from '../../../theme/tokens';

export interface PensandoProps {
  children?: ReactNode;
}

/** Estado de espera con texto: nunca tres puntitos solos. Dice en qué está el agente. Sin copy
 * propio — el texto lo pasa quien lo usa. */
export function Pensando({ children }: PensandoProps) {
  return (
    <Paper
      variant="outlined"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 1,
        px: 'var(--space-4)',
        py: 'var(--space-3)',
        borderRadius: 'var(--radius-lg)',
        borderBottomLeftRadius: 'var(--radius-sm)',
        backgroundColor: 'var(--surface-raised)',
        borderColor: 'var(--border)',
        maxWidth: 'var(--size-measure)',
      }}
    >
      <CircularProgress size={16} sx={{ color: 'var(--ink-muted)' }} />
      <Typography sx={{ fontFamily: typeTokens.body.fontFamily, fontSize: typeTokens.body.fontSize, color: 'var(--ink-muted)' }}>
        {children}
      </Typography>
    </Paper>
  );
}
