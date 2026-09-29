import { useId } from 'react';
import { Accordion, AccordionDetails, AccordionSummary, Box, Typography } from '@mui/material';
import { Icono } from '../../atoms/Icono/Icono';
import { useT } from '../../../i18n/LocaleContext';
import { type as typeTokens } from '../../../theme/tokens';

/** Preguntas frecuentes de la Bienvenida: un acordeón de MUI con las respuestas cortas. */
export function PreguntasFrecuentes() {
  const t = useT();
  const f = t.pantallas.bienvenida.faq;
  const base = useId();
  return (
    <Box component="section" aria-labelledby={`${base}-titulo`}>
      <Typography sx={{ ...typeTokens.label, textTransform: 'uppercase', color: 'var(--ink-brand)' }}>{f.eyebrow}</Typography>
      <Typography id={`${base}-titulo`} component="h2" sx={{ ...typeTokens['display-l'], color: 'var(--ink-strong)', mt: 'var(--space-1)' }}>
        {f.titulo}
      </Typography>
      <Box
        sx={{
          mt: 'var(--space-5)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--surface-raised)',
          overflow: 'hidden',
        }}
      >
        {f.preguntas.map((q, i) => (
          <Accordion
            key={q.pregunta}
            disableGutters
            square
            elevation={0}
            sx={{
              backgroundColor: 'transparent',
              '&:before': { display: 'none' },
              '&:not(:first-of-type)': { borderTop: '1px solid var(--border)' },
            }}
          >
            <AccordionSummary
              id={`${base}-${i}-cabecera`}
              aria-controls={`${base}-${i}-panel`}
              expandIcon={<Icono nombre="abajo" />}
              sx={{ px: 'var(--space-5)', minHeight: 56, '& .MuiAccordionSummary-content': { my: 'var(--space-3)' } }}
            >
              <Typography sx={{ ...typeTokens['body-strong'], fontWeight: 500, color: 'var(--ink-strong)' }}>{q.pregunta}</Typography>
            </AccordionSummary>
            <AccordionDetails id={`${base}-${i}-panel`} sx={{ px: 'var(--space-5)', pt: 0, pb: 'var(--space-4)' }}>
              <Typography sx={{ ...typeTokens.body, fontSize: '15px', color: 'var(--ink-muted)' }}>{q.respuesta}</Typography>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    </Box>
  );
}
