import type { ReactNode } from 'react';
import { Box } from '@mui/material';

export interface ColumnasProps {
  children: ReactNode;
  /** Plantilla de columnas a partir de 900 px. Por defecto, dos iguales. */
  plantilla?: string;
  /** Separación entre columnas a partir de 900 px. */
  espacioColumna?: string;
  /** Separación entre filas. Puede ser distinta en móvil y en escritorio. */
  espacioFila?: string | { xs: string; md: string };
  alinear?: 'start' | 'center' | 'stretch';
}

/**
 * Grilla que en móvil es una sola columna (los hijos se apilan en su orden) y desde 900 px se
 * reparte en columnas. Es solo estilo: no cambia el orden ni el número de elementos del DOM,
 * así que no afecta a las pruebas ni al orden de tabulación.
 */
export function Columnas({
  children,
  plantilla = 'repeat(2, minmax(0, 1fr))',
  espacioColumna = 'var(--space-6)',
  espacioFila = 'var(--space-5)',
  alinear = 'start',
}: ColumnasProps) {
  return (
    <Box
      sx={{
        display: 'grid',
        width: '100%',
        gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: plantilla },
        columnGap: { xs: 0, md: espacioColumna },
        rowGap: espacioFila,
        alignItems: alinear,
      }}
    >
      {children}
    </Box>
  );
}
