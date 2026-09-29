import { Box, Typography } from '@mui/material';
import { Icono } from '../../atoms/Icono/Icono';
import { useT } from '../../../i18n/LocaleContext';
import { type as typeTokens } from '../../../theme/tokens';

const PROGRAMAS = ['DS49', 'DS1', 'DS19', 'DS52'] as const;

/**
 * Panel azul de la Bienvenida: deja claro que la herramienta no es del Estado y que el botón
 * final lo aprieta la persona, y lista los cuatro programas que se revisan.
 */
export function PanelProgramas() {
  const t = useT();
  const p = t.organisms.panelProgramas;
  return (
    <Box
      sx={{
        backgroundColor: 'var(--surface-brand)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-lg)',
        p: { xs: 'var(--space-5)', md: 'var(--space-6)' },
        color: 'var(--ink-on-brand)',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        <Box
          aria-hidden
          sx={{
            width: 44,
            height: 44,
            flexShrink: 0,
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'rgba(255, 255, 255, 0.14)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icono nombre="casa" />
        </Box>
        <Typography component="h2" sx={{ ...typeTokens.title, color: 'var(--ink-on-brand)' }}>
          {p.titulo}
        </Typography>
      </Box>
      <Typography
        sx={{ ...typeTokens.body, fontSize: '15px', lineHeight: '23px', mt: 'var(--space-4)', color: 'var(--surface-brand-soft)' }}
      >
        {p.cuerpo}
      </Typography>
      <Box sx={{ borderTop: '1px solid rgba(255, 255, 255, 0.16)', mt: 'var(--space-4)', pt: 'var(--space-4)' }}>
        <Typography sx={{ ...typeTokens.label, textTransform: 'uppercase', color: 'var(--surface-brand-soft)', opacity: 0.85 }}>
          {p.etiquetaProgramas}
        </Typography>
        <Box component="ul" sx={{ listStyle: 'none', m: 0, mt: 'var(--space-2)', p: 0 }}>
          {PROGRAMAS.map((sigla) => (
            <Typography component="li" key={sigla} sx={{ ...typeTokens.body, fontSize: '15px', lineHeight: '26px' }}>
              <Box component="strong" sx={{ fontWeight: 700 }}>
                {sigla}
              </Box>
              {` — ${p.lineas[sigla]}`}
            </Typography>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
