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
 * marca al pie, título y bajada en `ink-on-brand`.
 */
export function BloqueHero({ titulo, bajada, chips }: BloqueHeroProps) {
  return (
    <Box sx={{ backgroundColor: 'var(--surface-brand)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
      <Stack spacing={2} sx={{ p: 'var(--space-6)' }}>
        <Typography
          sx={{
            fontFamily: typeTokens['display-l'].fontFamily,
            fontWeight: typeTokens['display-l'].fontWeight,
            fontSize: typeTokens['display-l'].fontSize,
            lineHeight: typeTokens['display-l'].lineHeight,
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
        {chips && chips.length > 0 && (
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
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
