import { List, ListItem, ListItemText, Checkbox, FormControlLabel, Typography, LinearProgress, Stack } from '@mui/material';
import { type as typeTokens, spacePx } from '../../../theme/tokens';
import { useT } from '../../../i18n/LocaleContext';

export interface DocumentoChecklist {
  nombre: string;
  oficial?: string;
  donde?: string;
  vence?: string;
  listo?: boolean;
}

export interface ChecklistDocumentosProps {
  programa?: string;
  items: DocumentoChecklist[];
  onToggle?: (indice: number) => void;
}

/**
 * La lista de papeles que la persona debe juntar. Cada fila responde tres cosas: qué papel es,
 * dónde se consigue y si ya lo tiene. La app no guarda los documentos — la casilla es un
 * recordatorio de la persona.
 */
export function ChecklistDocumentos({ programa, items, onToggle }: ChecklistDocumentosProps) {
  const t = useT();
  const listos = items.filter((i) => i.listo).length;
  return (
    <Stack spacing={1.5}>
      {programa && (
        <Typography
          sx={{
            fontFamily: typeTokens.label.fontFamily,
            fontSize: typeTokens.label.fontSize,
            fontWeight: typeTokens.label.fontWeight,
            letterSpacing: typeTokens.label.letterSpacing,
            textTransform: 'uppercase',
            color: 'var(--ink-muted)',
          }}
        >
          {programa}
        </Typography>
      )}
      <Stack direction="row" alignItems="center" spacing={1.5}>
        <Typography sx={{ fontFamily: 'var(--font-mono)', fontSize: '15px', color: 'var(--ink-muted)', whiteSpace: 'nowrap' }}>
          {t.organisms.checklistDocumentos.deListos(listos, items.length)}
        </Typography>
        <LinearProgress
          variant="determinate"
          value={items.length ? (listos / items.length) * 100 : 0}
          sx={{
            flex: 1,
            height: spacePx['space-2'],
            borderRadius: 'var(--radius-pill)',
            backgroundColor: 'var(--surface-sunken)',
            '& .MuiLinearProgress-bar': { backgroundColor: 'var(--accent)' },
          }}
        />
      </Stack>
      <Typography sx={{ fontSize: '14px', color: 'var(--ink-muted)' }}>{t.organisms.checklistDocumentos.ayuda}</Typography>
      <List sx={{ backgroundColor: 'var(--surface-sunken)', borderRadius: 'var(--radius-md)', p: 0.5 }}>
        {items.map((item, indice) => {
          const vencePronto = !item.listo && Boolean(item.vence);
          return (
            <ListItem key={item.nombre} sx={{ alignItems: 'flex-start' }}>
              <ListItemText
                primary={item.nombre}
                primaryTypographyProps={{
                  sx: { fontFamily: typeTokens['body-strong'].fontFamily, fontWeight: typeTokens['body-strong'].fontWeight, fontSize: typeTokens['body-strong'].fontSize, color: 'var(--ink-strong)' },
                }}
                secondaryTypographyProps={{ component: 'div' }}
                secondary={
                  <>
                    {item.oficial && (
                      <Typography component="span" display="block" sx={{ fontSize: '14px', color: 'var(--ink-muted)' }}>
                        {item.oficial}
                      </Typography>
                    )}
                    {item.donde && (
                      <Typography component="span" display="block" sx={{ fontSize: '14px', color: 'var(--ink-muted)' }}>
                        {item.donde}
                      </Typography>
                    )}
                    {vencePronto && (
                      <Typography
                        component="span"
                        display="block"
                        sx={{ fontSize: '14px', color: 'var(--ink-warning)', fontWeight: 600 }}
                      >
                        {t.organisms.checklistDocumentos.vence(item.vence!)}
                      </Typography>
                    )}
                    <FormControlLabel
                      sx={{ display: 'flex', mx: 0, mt: 0.5, minHeight: 'var(--size-touch)', alignItems: 'center' }}
                      control={
                        <Checkbox
                          checked={Boolean(item.listo)}
                          onChange={() => onToggle?.(indice)}
                          inputProps={{ 'aria-label': `${t.organisms.checklistDocumentos.yaLoTengo} — ${item.nombre}` }}
                          sx={{ color: 'var(--border-strong)', '&.Mui-checked': { color: 'var(--success)' } }}
                        />
                      }
                      label={
                        <Typography
                          component="span"
                          sx={{ fontSize: '15px', fontWeight: 600, color: item.listo ? 'var(--ink-success)' : 'var(--ink-strong)' }}
                        >
                          {t.organisms.checklistDocumentos.yaLoTengo}
                        </Typography>
                      }
                    />
                  </>
                }
              />
            </ListItem>
          );
        })}
      </List>
      <Typography sx={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--ink-muted)' }}>
        {t.organisms.checklistDocumentos.notaNoGuarda}
      </Typography>
    </Stack>
  );
}
