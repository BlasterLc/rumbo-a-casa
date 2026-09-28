import { Box, Stack, Typography } from '@mui/material';
import { useT } from '../../../i18n/LocaleContext';

/** Los tres pasos fijos del mockup de escritorio: recoger datos, ver el resultado, armar el plan. */
export function PasosComoFunciona() {
  const t = useT();
  const pasos = [
    { titulo: t.pantallas.bienvenida.pasos.paso1Titulo, detalle: t.pantallas.bienvenida.pasos.paso1Detalle, acento: 'brand' as const },
    { titulo: t.pantallas.bienvenida.pasos.paso2Titulo, detalle: t.pantallas.bienvenida.pasos.paso2Detalle, acento: 'brand' as const },
    { titulo: t.pantallas.bienvenida.pasos.paso3Titulo, detalle: t.pantallas.bienvenida.pasos.paso3Detalle, acento: 'accent' as const },
  ];
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 'var(--space-6)' }}>
      {pasos.map((p, i) => (
        <Stack
          key={p.titulo}
          direction="row"
          spacing={2}
          sx={{
            backgroundColor: 'var(--surface-raised)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-sm)',
            p: 'var(--space-5)',
            alignItems: 'flex-start',
          }}
        >
          <Box
            sx={{
              width: 40,
              height: 40,
              flexShrink: 0,
              borderRadius: 'var(--radius-pill)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--font-mono)',
              fontWeight: 500,
              fontSize: '18px',
              backgroundColor: p.acento === 'brand' ? 'var(--surface-brand-soft)' : 'var(--surface-accent-soft)',
              color: p.acento === 'brand' ? 'var(--ink-brand)' : 'var(--ink-accent)',
            }}
          >
            {i + 1}
          </Box>
          <Stack spacing={0.5}>
            <Typography component="h3" sx={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '18px', color: 'var(--ink-strong)' }}>
              {p.titulo}
            </Typography>
            <Typography sx={{ fontFamily: 'var(--font-sans)', fontSize: '15px', lineHeight: '22px', color: 'var(--ink-muted)' }}>
              {p.detalle}
            </Typography>
          </Stack>
        </Stack>
      ))}
    </Box>
  );
}
