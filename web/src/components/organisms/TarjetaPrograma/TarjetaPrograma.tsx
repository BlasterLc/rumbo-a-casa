import { Card, CardContent, CardActions, Stack, Typography } from '@mui/material';
import { SelloElegibilidad, type EstadoElegibilidad } from '../../molecules/SelloElegibilidad/SelloElegibilidad';
import { Boton } from '../../atoms/Boton/Boton';
import { useT } from '../../../i18n/LocaleContext';
import { type as typeTokens } from '../../../theme/tokens';

export interface TarjetaProgramaProps {
  sigla: string;
  nombreComun: string;
  estado: EstadoElegibilidad;
  razon: string;
  regla?: string;
  llamado?: string;
  serviu?: string;
  accion?: string;
  onAccion?: () => void;
  variante?: 'contained' | 'outlined';
}

/**
 * Un programa del MINVU con el resultado de la persona. Cuatro cosas en el mismo orden: qué es
 * el programa, cómo le fue, por qué, y qué sigue. El sello va arriba a la derecha, visible sin
 * desplazar.
 */
export function TarjetaPrograma({
  sigla,
  nombreComun,
  estado,
  razon,
  regla,
  llamado,
  serviu,
  accion,
  onAccion,
  variante = 'contained',
}: TarjetaProgramaProps) {
  const t = useT();
  return (
    <Card variant="outlined" sx={{ borderColor: 'var(--border)' }}>
      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
          <Typography
            sx={{
              fontFamily: typeTokens.title.fontFamily,
              fontWeight: typeTokens.title.fontWeight,
              fontSize: typeTokens.title.fontSize,
              color: 'var(--ink-strong)',
            }}
          >
            {sigla} — {nombreComun}
          </Typography>
          <SelloElegibilidad estado={estado} compacto />
        </Stack>
        <Typography
          sx={{
            fontFamily: typeTokens.body.fontFamily,
            fontSize: typeTokens.body.fontSize,
            color: 'var(--ink)',
          }}
        >
          {razon}
        </Typography>
        {regla && (
          <Typography
            sx={{
              fontFamily: typeTokens.caption.fontFamily,
              fontSize: typeTokens.caption.fontSize,
              color: 'var(--ink-muted)',
              borderLeft: '2px solid var(--border)',
              pl: 1,
            }}
          >
            {t.comun.fuente(regla)}
          </Typography>
        )}
        {(llamado || serviu) && (
          <Typography sx={{ fontFamily: 'var(--font-mono)', fontSize: '15px', color: 'var(--ink-muted)' }}>
            {[llamado, serviu].filter(Boolean).join(' · ')}
          </Typography>
        )}
      </CardContent>
      {accion && (
        <CardActions sx={{ px: 2, pb: 2 }}>
          <Boton variant={variante} onClick={onAccion} fullWidth>
            {accion}
          </Boton>
        </CardActions>
      )}
    </Card>
  );
}
