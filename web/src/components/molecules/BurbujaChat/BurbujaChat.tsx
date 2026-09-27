import type { ReactNode } from 'react';
import { Paper, Stack, IconButton, Typography, Link } from '@mui/material';
import { Icono } from '../../atoms/Icono/Icono';
import { useT } from '../../../i18n/LocaleContext';
import { useEscritorio } from '../../../lib/useEscritorio';
import { type as typeTokens } from '../../../theme/tokens';

export interface BurbujaChatProps {
  autor?: 'agente' | 'persona';
  children?: ReactNode;
  /** Muestra el botón «Escuchar». Solo tiene efecto en turnos del agente. */
  escuchable?: boolean;
  /** Marca el turno como dictado y editable. */
  dictado?: boolean;
  /** Añade el enlace «¿Por qué pregunto esto?». */
  porQue?: boolean;
  /** No está en el `index.d.ts` publicado (que solo trae la etiqueta); se agrega porque el
   * enlace necesita un manejador para hacer algo. */
  onPorQue?: () => void;
}

/**
 * El turno de la conversación con el agente. Se distinguen por lado, color y forma, no solo por
 * color. La burbuja no supera `size-measure` de ancho — un párrafo que cruza toda la pantalla
 * se vuelve ilegible.
 */
export function BurbujaChat({ autor = 'agente', children, escuchable, dictado, porQue, onPorQue }: BurbujaChatProps) {
  const t = useT();
  const escritorio = useEscritorio();
  const esPersona = autor === 'persona';

  const botonEscuchar = escuchable && !esPersona && (
    <IconButton
      size="small"
      aria-label={t.molecules.burbujaChat.escuchar}
      sx={{
        alignSelf: escritorio ? 'flex-start' : 'flex-end',
        color: 'var(--ink-brand)',
        borderRadius: 'var(--radius-pill)',
        px: 1,
        gap: 0.5,
      }}
    >
      <Icono nombre="parlante" tamano={18} />
      <Typography component="span" sx={{ fontSize: '13px', fontWeight: 600 }}>
        {t.molecules.burbujaChat.escuchar}
      </Typography>
    </IconButton>
  );

  const enlacePorQue = porQue && !esPersona && (
    <Link
      component="button"
      onClick={onPorQue}
      sx={{ fontFamily: typeTokens.caption.fontFamily, fontSize: typeTokens.caption.fontSize, color: 'var(--ink-brand)' }}
    >
      {t.molecules.burbujaChat.porQuePregunto}
    </Link>
  );

  return (
    <Stack
      alignItems={esPersona ? 'flex-end' : 'flex-start'}
      spacing={0.5}
      sx={{
        maxWidth: { xs: 'var(--size-measure)', md: '62ch' },
        alignSelf: { md: esPersona ? 'flex-end' : 'flex-start' },
      }}
    >
      {!escritorio && botonEscuchar}
      <Paper
        variant={esPersona ? 'elevation' : 'outlined'}
        sx={{
          px: 'var(--space-4)',
          py: 'var(--space-3)',
          borderRadius: 'var(--radius-lg)',
          ...(esPersona
            ? { borderBottomRightRadius: 'var(--radius-sm)', backgroundColor: 'var(--surface-accent-soft)' }
            : {
                borderBottomLeftRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--surface-raised)',
                borderColor: 'var(--border)',
              }),
        }}
      >
        <Typography sx={{ fontFamily: typeTokens['body-l'].fontFamily, fontSize: typeTokens['body-l'].fontSize, color: 'var(--ink)', whiteSpace: 'pre-line' }}>
          {children}
        </Typography>
        {dictado && (
          <Typography
            sx={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--ink-muted)', mt: 0.5, fontStyle: 'italic' }}
          >
            {t.molecules.burbujaChat.dictadoMarca}
          </Typography>
        )}
      </Paper>
      {escritorio
        ? (botonEscuchar || enlacePorQue) && (
            <Stack direction="row" spacing={2} alignItems="center">
              {botonEscuchar}
              {enlacePorQue}
            </Stack>
          )
        : enlacePorQue}
    </Stack>
  );
}
