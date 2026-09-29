import { Box, Typography, Stack, Chip } from '@mui/material';
import { type as typeTokens } from '../../../theme/tokens';
import { Franja } from '../Franja/Franja';

export interface BloqueHeroProps {
  titulo: string;
  bajada?: string;
  chips?: string[];
}

/**
 * Cabecera de pantalla con los bloques de color de la portada: fondo `surface-brand`, franja de
 * marca al pie, título y bajada en `ink-on-brand`. En escritorio el texto va a la izquierda y los chips a la derecha;
 * en móvil, apilados como siempre.
 */
export function BloqueHero({ titulo, bajada, chips }: BloqueHeroProps) {
  return (
    <Box sx={{ backgroundColor: 'var(--surface-brand)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', md: 'flex-end' }}
        spacing={{ xs: 2, md: 'var(--space-6)' }}
        sx={{ p: { xs: 'var(--space-6)', md: 'var(--space-6) var(--space-7) var(--space-4)' } }}
      >
        <Stack spacing={2}>
          <Typography
            component="h1"
            sx={{
              fontFamily: typeTokens['display-l'].fontFamily,
              fontWeight: typeTokens['display-l'].fontWeight,
              fontSize: { xs: typeTokens['display-l'].fontSize, md: typeTokens['display-xl'].fontSize },
              lineHeight: { xs: typeTokens['display-l'].lineHeight, md: typeTokens['display-xl'].lineHeight },
              letterSpacing: typeTokens['display-l'].letterSpacing,
              color: 'var(--ink-on-brand)',
            }}
          >
            {titulo}
          </Typography>
          {bajada && (
            <Typography
              sx={{
                fontFamily: typeTokens['body-l'].fontFamily,
                fontSize: typeTokens['body-l'].fontSize,
                color: 'var(--ink-on-brand)',
                maxWidth: 'var(--size-measure)',
              }}
            >
              {bajada}
            </Typography>
          )}
        </Stack>
        {chips && chips.length > 0 && (
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
            {chips.map((c) => (
              <Chip
                key={c}
                label={c}
                sx={{ backgroundColor: 'var(--surface-brand-soft)', color: 'var(--ink-brand)', fontWeight: 600 }}
              />
            ))}
          </Stack>
        )}
      </Stack>
      <Franja tono="brand" alto={96} borde="abajo" />
    </Box>
  );
}
