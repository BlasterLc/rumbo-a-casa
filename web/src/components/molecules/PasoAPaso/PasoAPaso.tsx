import type { ReactNode } from 'react';
import { Stepper, Step, StepButton, StepLabel, Typography, Stack, Box } from '@mui/material';
import { Icono } from '../../atoms/Icono/Icono';
import { useT } from '../../../i18n/LocaleContext';
import { type as typeTokens, sizePx } from '../../../theme/tokens';

export interface PasoAPasoProps {
  /** Nombres cortos, de una palabra, del mundo de la persona (Vivienda, Familia, Ahorro…), ya
   * traducidos por quien usa el componente. Máximo seis. */
  pasos: string[];
  activo?: number;
  onActivarPaso?: (indice: number) => void;
  /** Vertical para un panel lateral en escritorio; horizontal en móvil. */
  orientacion?: 'horizontal' | 'vertical';
}

interface IconoPasoProps {
  activo?: boolean;
  completado?: boolean;
  icon: ReactNode;
}

function IconoPaso({ activo, completado, icon }: IconoPasoProps) {
  const color = completado ? 'var(--success)' : activo ? 'var(--brand)' : 'var(--border-strong)';
  return (
    <Box
      sx={{
        width: sizePx['size-icon'],
        height: sizePx['size-icon'],
        borderRadius: '50%',
        backgroundColor: color,
        color: 'var(--ink-on-fill)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 13,
        fontWeight: 700,
      }}
    >
      {completado ? <Icono nombre="check" tamano={14} /> : icon}
    </Box>
  );
}

/**
 * Avance de la entrevista. Responde a las dos preguntas que hacen abandonar: cuánto falta y si
 * se puede volver. Los pasos ya contestados son tocables y se pueden corregir; los pendientes, no.
 */
export function PasoAPaso({ pasos, activo = 0, onActivarPaso, orientacion = 'horizontal' }: PasoAPasoProps) {
  const t = useT();
  const pasosMostrados = pasos.slice(0, 6);
  return (
    <Stack spacing={1}>
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
        {t.molecules.pasoAPaso.pasoDe(Math.min(activo + 1, pasosMostrados.length), pasosMostrados.length)}
      </Typography>
      <Stepper
        activeStep={activo}
        nonLinear
        orientation={orientacion}
        alternativeLabel={orientacion === 'horizontal'}
      >
        {pasosMostrados.map((nombre, indice) => {
          const completado = indice < activo;
          const tocable = indice <= activo && Boolean(onActivarPaso);
          const icono = <IconoPaso activo={indice === activo} completado={completado} icon={indice + 1} />;
          return (
            <Step key={nombre} completed={completado}>
              {tocable ? (
                <StepButton onClick={() => onActivarPaso?.(indice)} icon={icono} sx={{ minHeight: 'var(--size-touch)' }}>
                  {nombre}
                </StepButton>
              ) : (
                <StepLabel StepIconComponent={() => icono}>{nombre}</StepLabel>
              )}
            </Step>
          );
        })}
      </Stepper>
    </Stack>
  );
}
