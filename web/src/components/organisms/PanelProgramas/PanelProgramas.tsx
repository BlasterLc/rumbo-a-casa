import { Box, Chip, Typography } from '@mui/material';
import { Franja } from '../Franja/Franja';
import { useT } from '../../../i18n/LocaleContext';
import { type as typeTokens } from '../../../theme/tokens';

const PROGRAMAS = ['DS49', 'DS1', 'DS19', 'DS52'] as const;

/**
 * Los cuatro programas que revisa la app, en un panel azul con la Franja al pie. Ocupa el lugar
 * de los chips informativos de la Bienvenida móvil cuando hay espacio para explicarlos.
 */
export function PanelProgramas() {
  const t = useT();
  return (
    <Box
      sx={{
        backgroundColor: 'var(--surface-brand)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-lg)',
      }}
    >
      <Box sx={{ p: 'var(--space-6) var(--space-6) var(--space-2)' }}>
        <Typography component="h2" sx={{ ...typeTokens['display-m'], color: 'var(--ink-on-brand)' }}>
          {t.organisms.panelProgramas.titulo}
        </Typography>
        <Box component="ul" sx={{ listStyle: 'none', m: 0, mt: 'var(--space-4)', p: 0 }}>
          {PROGRAMAS.map((p) => (
            <Box
              component="li"
              key={p}
              sx={{
                display: 'grid',
                gridTemplateColumns: '72px minmax(0, 1fr)',
                columnGap: 'var(--space-4)',
                alignItems: 'start',
                py: 'var(--space-4)',
                borderTop: '1px solid rgba(255, 255, 255, 0.16)',
              }}
            >
              <Chip label={p} sx={{ backgroundColor: 'var(--surface-brand-soft)', color: 'var(--ink-brand)', fontWeight: 700 }} />
              <Box>
                <Typography
                  sx={{ fontFamily: typeTokens.title.fontFamily, fontWeight: typeTokens.title.fontWeight, fontSize: '18px', lineHeight: '26px', color: 'var(--ink-on-brand)' }}
                >
                  {t.organisms.nombrePrograma[p]}
                </Typography>
                <Typography
                  sx={{ fontFamily: typeTokens.body.fontFamily, fontSize: '15px', lineHeight: '22px', color: 'var(--surface-brand-soft)' }}
                >
                  {t.organisms.panelProgramas.descripcion[p]}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
      <Franja tono="brand" alto={96} borde="abajo" />
    </Box>
  );
}
