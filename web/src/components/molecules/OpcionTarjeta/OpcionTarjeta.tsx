import type { ChangeEvent } from 'react';
import { RadioGroup, FormControlLabel, Radio, Paper, Stack, Typography } from '@mui/material';
import { type } from '../../../theme/tokens';

export interface OpcionTarjetaItem {
  value: string;
  titulo: string;
  detalle?: string;
}

export interface OpcionTarjetaProps {
  pregunta?: string;
  /** Máximo cuatro. "No estoy seguro" va siempre al final. */
  opciones: OpcionTarjetaItem[];
  value?: string;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  name?: string;
}

/**
 * Opción única presentada como tarjeta grande. La tarjeta entera es el objetivo tocable, no
 * solo el círculo del radio. La seleccionada se marca con borde `brand` de 2 px y fondo
 * `surface-brand-soft`, nunca solo con el punto del radio.
 */
export function OpcionTarjeta({ pregunta, opciones, value, onChange, name }: OpcionTarjetaProps) {
  return (
    <Stack spacing={2}>
      {pregunta && (
        <Typography sx={{ ...type['body-l'], color: 'var(--ink-strong)' }}>
          {pregunta}
        </Typography>
      )}
      <RadioGroup name={name} value={value ?? ''} onChange={onChange}>
        <Stack spacing={1.5}>
          {opciones.map((o) => {
            const seleccionada = o.value === value;
            return (
              <Paper
                key={o.value}
                variant="outlined"
                sx={{
                  borderRadius: 'var(--radius-md)',
                  borderColor: seleccionada ? 'var(--brand)' : 'var(--border)',
                  borderWidth: seleccionada ? 2 : 1,
                  backgroundColor: seleccionada ? 'var(--surface-brand-soft)' : 'var(--surface-raised)',
                }}
              >
                <FormControlLabel
                  value={o.value}
                  control={<Radio />}
                  sx={{
                    width: '100%',
                    minHeight: 'var(--size-control)',
                    m: 0,
                    p: 'var(--space-4)',
                    alignItems: 'flex-start',
                  }}
                  label={
                    <Stack sx={{ py: 0.5 }}>
                      <Typography sx={{ ...type['body-strong'], color: 'var(--ink-strong)' }}>
                        {o.titulo}
                      </Typography>
                      {o.detalle && (
                        <Typography sx={{ ...type.caption, color: 'var(--ink-muted)' }}>
                          {o.detalle}
                        </Typography>
                      )}
                    </Stack>
                  }
                />
              </Paper>
            );
          })}
        </Stack>
      </RadioGroup>
    </Stack>
  );
}
