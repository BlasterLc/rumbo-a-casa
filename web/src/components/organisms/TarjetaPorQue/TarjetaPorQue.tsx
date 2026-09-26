import { Card, Accordion, AccordionSummary, AccordionDetails, Stack, Typography } from '@mui/material';
import { Icono } from '../../atoms/Icono/Icono';
import { useT } from '../../../i18n/LocaleContext';
import { type as typeTokens } from '../../../theme/tokens';

export interface ReglaEvaluada {
  enunciado: string;
  tuDato: string;
  cumple: boolean;
  fuente: string;
  arreglo?: string;
}

export interface TarjetaPorQueProps {
  titulo: string;
  reglas: ReglaEvaluada[];
  /** Con qué versión de reglas se calculó. */
  pie?: string;
}

/**
 * La explicación de un resultado, regla por regla. Arranca cerrada. Todo dato viene del motor
 * determinista — este componente no recibe texto generado por el modelo.
 */
export function TarjetaPorQue({ titulo, reglas, pie }: TarjetaPorQueProps) {
  const t = useT();
  return (
    <Card variant="outlined" sx={{ borderColor: 'var(--border)' }}>
      <Accordion disableGutters sx={{ boxShadow: 'none', '&::before': { display: 'none' } }}>
        <AccordionSummary expandIcon={<Icono nombre="abajo" />}>
          <Typography
            sx={{
              fontFamily: typeTokens['body-strong'].fontFamily,
              fontWeight: typeTokens['body-strong'].fontWeight,
              fontSize: typeTokens['body-strong'].fontSize,
            }}
          >
            {titulo}
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={2}>
            {reglas.map((r, i) => (
              <Stack
                key={i}
                spacing={0.5}
                sx={{ borderTop: i > 0 ? '1px solid var(--border)' : undefined, pt: i > 0 ? 1.5 : 0 }}
              >
                <Stack direction="row" spacing={1} alignItems="flex-start">
                  <Icono
                    nombre={r.cumple ? 'check' : 'cerrar'}
                    tamano={18}
                    sx={{ color: r.cumple ? 'var(--success)' : 'var(--ink-muted)', mt: '2px' }}
                  />
                  <Typography
                    sx={{
                      fontFamily: typeTokens.body.fontFamily,
                      fontSize: typeTokens.body.fontSize,
                      color: 'var(--ink)',
                    }}
                  >
                    {r.enunciado}
                  </Typography>
                </Stack>
                <Typography sx={{ fontFamily: 'var(--font-mono)', fontSize: '15px', color: 'var(--ink-muted)', pl: '26px' }}>
                  {t.organisms.tarjetaPorQue.tuDato(r.tuDato)}
                </Typography>
                <Typography sx={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--ink-muted)', pl: '26px' }}>
                  {t.comun.fuente(r.fuente)}
                </Typography>
                {r.arreglo && (
                  <Typography
                    sx={{
                      fontFamily: typeTokens.caption.fontFamily,
                      fontSize: typeTokens.caption.fontSize,
                      color: 'var(--ink-brand)',
                      pl: '26px',
                    }}
                  >
                    {r.arreglo}
                  </Typography>
                )}
              </Stack>
            ))}
            {pie && (
              <Typography sx={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--ink-muted)' }}>
                {pie}
              </Typography>
            )}
          </Stack>
        </AccordionDetails>
      </Accordion>
    </Card>
  );
}
