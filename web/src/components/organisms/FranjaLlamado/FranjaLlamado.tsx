import type { ReactNode } from 'react';
import { Box, Typography } from '@mui/material';
import { useT } from '../../../i18n/LocaleContext';
import { type as typeTokens, sizePx } from '../../../theme/tokens';

export interface FranjaLlamadoProps {
  /** Los botones, ya pensados para fondo oscuro. */
  children: ReactNode;
}

/** Franja azul al pie de la Bienvenida: repite la invitación a empezar. */
export function FranjaLlamado({ children }: FranjaLlamadoProps) {
  const t = useT();
  const c = t.pantallas.bienvenida.cierre;
  return (
    <Box component="section" aria-labelledby="cierre-titulo" sx={{ backgroundColor: 'var(--surface-brand)', color: 'var(--ink-on-brand)' }}>
      <Box
        sx={{
          maxWidth: sizePx['size-page'],
          mx: 'auto',
          px: { xs: 'var(--space-4)', md: 'var(--space-6)' },
          py: { xs: 'var(--space-6)', md: 'var(--space-7)' },
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'flex-start', md: 'center' },
          justifyContent: 'space-between',
          gap: 'var(--space-4)',
        }}
      >
        <Box>
          <Typography id="cierre-titulo" component="h2" sx={{ ...typeTokens['display-m'], color: 'var(--ink-on-brand)' }}>
            {c.titulo}
          </Typography>
          <Typography sx={{ ...typeTokens.body, color: 'var(--surface-brand-soft)', mt: 'var(--space-1)' }}>{c.detalle}</Typography>
        </Box>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)' }}>{children}</Box>
      </Box>
    </Box>
  );
}
