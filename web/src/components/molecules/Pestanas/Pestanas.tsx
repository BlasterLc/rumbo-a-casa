import { useState, type SyntheticEvent } from 'react';
import { Tabs, Tab, Box, Typography } from '@mui/material';

export interface PestanaItem {
  valor: string;
  etiqueta: string;
  cuenta?: number;
}

export interface PestanasProps {
  /** La primera es la que la persona quiere ver, no "Todos". */
  pestanas: PestanaItem[];
  value?: string;
  onChange?: (e: SyntheticEvent, v: string) => void;
  etiquetaAria?: string;
}

/**
 * Corta una lista larga dentro de una misma pantalla. Sin `value`, se gobierna sola y arranca
 * en la primera pestaña. Siempre desplazable — en 360 px no se reparten cuatro pestañas a lo
 * ancho sin partir palabras.
 */
export function Pestanas({ pestanas, value, onChange, etiquetaAria }: PestanasProps) {
  const [interno, setInterno] = useState(pestanas[0]?.valor ?? '');
  const actual = value ?? interno;
  const pestanasMostradas = pestanas.slice(0, 4);

  const manejarCambio = (e: SyntheticEvent, v: string) => {
    if (value === undefined) setInterno(v);
    onChange?.(e, v);
  };

  return (
    <Tabs
      value={actual}
      onChange={manejarCambio}
      aria-label={etiquetaAria}
      variant="scrollable"
      scrollButtons="auto"
      sx={{ '& .MuiTabs-indicator': { backgroundColor: 'var(--brand)', height: 3 } }}
    >
      {pestanasMostradas.map((p) => (
        <Tab
          key={p.valor}
          value={p.valor}
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <span>{p.etiqueta}</span>
              {typeof p.cuenta === 'number' && (
                <Typography
                  component="span"
                  sx={{
                    fontSize: '12px',
                    fontWeight: 700,
                    color: 'var(--ink-on-fill)',
                    backgroundColor: 'var(--ink-muted)',
                    borderRadius: 'var(--radius-pill)',
                    px: 0.75,
                    minWidth: 18,
                    textAlign: 'center',
                  }}
                >
                  {p.cuenta}
                </Typography>
              )}
            </Box>
          }
          sx={{
            fontFamily: 'var(--font-sans)',
            color: p.valor === actual ? 'var(--ink-brand)' : 'var(--ink)',
            fontWeight: p.valor === actual ? 700 : 400,
          }}
        />
      ))}
    </Tabs>
  );
}
