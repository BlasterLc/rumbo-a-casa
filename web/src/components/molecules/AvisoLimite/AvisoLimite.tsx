import { Paper, Stack, Typography, Link } from '@mui/material';
import { Icono } from '../../atoms/Icono/Icono';
import { useT } from '../../../i18n/LocaleContext';
import { type as typeTokens } from '../../../theme/tokens';

export interface AvisoLimiteProps {
  /** true justo antes del enlace de salida al sitio del MINVU; false la primera vez que se
   * llega a un plan completo. */
  conSalida?: boolean;
}

const DOMINIO = 'postulacionenlinea.minvu.cl';

/**
 * El aviso de lo que la app no hace. Aparece solo dos veces en todo el recorrido. El texto es
 * fijo y no se edita desde la pantalla que lo usa — es la única forma de garantizar que el
 * mensaje sea siempre el mismo.
 */
export function AvisoLimite({ conSalida = false }: AvisoLimiteProps) {
  const t = useT();
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 'var(--space-4)',
        backgroundColor: 'var(--surface-brand-soft)',
        borderColor: 'var(--surface-brand-soft)',
        borderRadius: 'var(--radius-md)',
      }}
    >
      <Stack direction="row" spacing={1.5}>
        <Icono nombre="escudo" tamano={20} sx={{ color: 'var(--ink-brand)', flexShrink: 0, mt: '2px' }} />
        <Stack spacing={1}>
          <Typography sx={{ fontFamily: typeTokens.body.fontFamily, fontSize: typeTokens.body.fontSize, color: 'var(--ink-brand)' }}>
            {t.molecules.avisoLimite.linea1}
          </Typography>
          <Typography sx={{ fontFamily: typeTokens.body.fontFamily, fontSize: typeTokens.body.fontSize, color: 'var(--ink-brand)' }}>
            {t.molecules.avisoLimite.linea2}
          </Typography>
          <Typography sx={{ fontFamily: typeTokens['body-strong'].fontFamily, fontWeight: typeTokens['body-strong'].fontWeight, fontSize: typeTokens['body-strong'].fontSize, color: 'var(--ink-brand)' }}>
            {t.molecules.avisoLimite.linea3(DOMINIO)}
          </Typography>
          {conSalida && (
            <Link
              href={`https://${DOMINIO}`}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ fontFamily: 'var(--font-mono)', fontSize: '15px', color: 'var(--ink-brand)' }}
            >
              {t.molecules.avisoLimite.irA(DOMINIO)}
            </Link>
          )}
        </Stack>
      </Stack>
    </Paper>
  );
}
