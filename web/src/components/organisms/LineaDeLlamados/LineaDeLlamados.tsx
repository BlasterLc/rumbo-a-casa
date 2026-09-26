import { Stack, Typography, Box } from '@mui/material';
import { type as typeTokens } from '../../../theme/tokens';
import { Boton } from '../../atoms/Boton/Boton';
import { useT } from '../../../i18n/LocaleContext';

export interface LlamadoItem {
  programa: string;
  fechas: string;
  serviu: string;
  estado: 'cerrado' | 'abierto' | 'porVenir';
  porConfirmar?: boolean;
  contador?: string;
  accion?: string;
}

export interface LineaDeLlamadosProps {
  titulo?: string;
  llamados: LlamadoItem[];
  /** No está en el `index.d.ts` publicado (que solo trae la etiqueta `accion` en cada ítem); se
   * agrega porque un botón de recordatorio sin manejador no hace nada. */
  onAccion?: (indice: number) => void;
}

const COLOR_ESTADO: Record<LlamadoItem['estado'], string> = {
  cerrado: 'var(--ink-muted)',
  abierto: 'var(--brand)',
  porVenir: 'var(--border-strong)',
};

/**
 * El calendario de llamados de un programa, en una línea de tiempo vertical. Cada llamado
 * muestra apertura, cierre y Serviu regional juntos — un llamado sin región está mal mostrado.
 * El cerrado se muestra atenuado pero legible, nunca se esconde.
 */
export function LineaDeLlamados({ titulo, llamados, onAccion }: LineaDeLlamadosProps) {
  const t = useT();
  return (
    <Stack spacing={2}>
      {titulo && (
        <Typography
          sx={{
            fontFamily: typeTokens.title.fontFamily,
            fontWeight: typeTokens.title.fontWeight,
            fontSize: typeTokens.title.fontSize,
            color: 'var(--ink-strong)',
          }}
        >
          {titulo}
        </Typography>
      )}
      {llamados.map((l, indice) => (
        <Stack key={`${l.programa}-${indice}`} direction="row" spacing={1.5}>
          <Box
            sx={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              backgroundColor: COLOR_ESTADO[l.estado],
              mt: '6px',
              flexShrink: 0,
            }}
          />
          <Stack spacing={0.25} sx={{ flex: 1, opacity: l.estado === 'cerrado' ? 0.7 : 1 }}>
            <Typography
              sx={{
                fontFamily: typeTokens['body-strong'].fontFamily,
                fontWeight: typeTokens['body-strong'].fontWeight,
                fontSize: typeTokens['body-strong'].fontSize,
                color: l.estado === 'cerrado' ? 'var(--ink-muted)' : 'var(--ink-strong)',
              }}
            >
              {l.programa}
            </Typography>
            <Typography sx={{ fontFamily: 'var(--font-mono)', fontSize: '15px', color: 'var(--ink-muted)' }}>
              {l.fechas} · {l.serviu}
            </Typography>
            {l.porConfirmar && (
              <Typography
                sx={{
                  fontFamily: typeTokens.caption.fontFamily,
                  fontSize: typeTokens.caption.fontSize,
                  color: 'var(--ink-muted)',
                  fontStyle: 'italic',
                }}
              >
                {t.organisms.lineaDeLlamados.porConfirmar}
              </Typography>
            )}
            {l.contador && (
              <Typography sx={{ fontFamily: 'var(--font-mono)', fontSize: '15px', color: 'var(--ink-warning)', fontWeight: 600 }}>
                {l.contador}
              </Typography>
            )}
            {l.accion && (
              <Boton variant="text" size="small" sx={{ alignSelf: 'flex-start', px: 0 }} onClick={() => onAccion?.(indice)}>
                {l.accion}
              </Boton>
            )}
          </Stack>
        </Stack>
      ))}
    </Stack>
  );
}
