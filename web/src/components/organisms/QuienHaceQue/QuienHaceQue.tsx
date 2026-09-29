import { Box, List, ListItem, Paper, Typography } from '@mui/material';
import { Icono, type NombreIcono } from '../../atoms/Icono/Icono';
import { useT } from '../../../i18n/LocaleContext';
import { type as typeTokens } from '../../../theme/tokens';

type Acento = 'brand' | 'accent';

const COLOR: Record<Acento, { fondo: string; tinta: string }> = {
  brand: { fondo: 'var(--surface-brand-soft)', tinta: 'var(--ink-brand)' },
  accent: { fondo: 'var(--surface-accent-soft)', tinta: 'var(--ink-accent)' },
};

interface ColumnaProps {
  acento: Acento;
  icono: NombreIcono;
  etiqueta: string;
  nombre: string;
  items: string[];
  aviso?: string;
}

function Columna({ acento, icono, etiqueta, nombre, items, aviso }: ColumnaProps) {
  const { fondo, tinta } = COLOR[acento];
  return (
    <Box sx={{ p: { xs: 'var(--space-5)', md: 'var(--space-6)' } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        <Box
          aria-hidden
          sx={{
            width: 44,
            height: 44,
            flexShrink: 0,
            borderRadius: 'var(--radius-md)',
            backgroundColor: fondo,
            color: tinta,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icono nombre={icono} />
        </Box>
        <Box>
          <Typography sx={{ ...typeTokens.label, textTransform: 'uppercase', color: tinta }}>{etiqueta}</Typography>
          <Typography component="h3" sx={{ ...typeTokens.title, color: 'var(--ink-strong)' }}>
            {nombre}
          </Typography>
        </Box>
      </Box>
      <List disablePadding sx={{ mt: 'var(--space-4)' }}>
        {items.map((item) => (
          <ListItem key={item} disableGutters sx={{ alignItems: 'flex-start', gap: 'var(--space-3)', py: 'var(--space-2)' }}>
            <Box
              aria-hidden
              sx={{
                width: 24,
                height: 24,
                flexShrink: 0,
                mt: '1px',
                borderRadius: 'var(--radius-pill)',
                backgroundColor: fondo,
                color: tinta,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icono nombre="check" tamano={16} />
            </Box>
            <Typography sx={{ ...typeTokens.body, fontSize: '15px', color: 'var(--ink)' }}>{item}</Typography>
          </ListItem>
        ))}
      </List>
      {aviso && (
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-2)', mt: 'var(--space-4)', color: 'var(--ink-accent)' }}>
          <Icono nombre="candado" tamano={18} sx={{ mt: '2px' }} />
          <Typography sx={{ ...typeTokens.caption, color: 'var(--ink-accent)' }}>{aviso}</Typography>
        </Box>
      )}
    </Box>
  );
}

/** "Cómo trabajamos contigo": qué hace Rumbo a Casa y qué queda en manos de la persona. */
export function QuienHaceQue() {
  const t = useT();
  const r = t.pantallas.bienvenida.roles;
  return (
    <Box component="section" aria-labelledby="roles-titulo">
      <Typography sx={{ ...typeTokens.label, textTransform: 'uppercase', color: 'var(--ink-brand)' }}>{r.eyebrow}</Typography>
      <Typography id="roles-titulo" component="h2" sx={{ ...typeTokens['display-l'], color: 'var(--ink-strong)', mt: 'var(--space-1)' }}>
        {r.titulo}
      </Typography>
      <Typography sx={{ ...typeTokens.body, color: 'var(--ink-muted)', maxWidth: '62ch', mt: 'var(--space-2)' }}>{r.bajada}</Typography>
      <Paper
        variant="outlined"
        sx={{
          mt: 'var(--space-5)',
          borderRadius: 'var(--radius-lg)',
          borderColor: 'var(--border)',
          display: 'grid',
          gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'repeat(2, minmax(0, 1fr))' },
          '& > * + *': {
            borderTop: { xs: '1px solid var(--border)', md: 'none' },
            borderLeft: { xs: 'none', md: '1px solid var(--border)' },
          },
        }}
      >
        <Columna acento="brand" icono="casa" etiqueta={r.hace.etiqueta} nombre={r.hace.nombre} items={r.hace.items} />
        <Columna acento="accent" icono="persona" etiqueta={r.tu.etiqueta} nombre={r.tu.nombre} items={r.tu.items} aviso={r.tu.aviso} />
      </Paper>
    </Box>
  );
}
