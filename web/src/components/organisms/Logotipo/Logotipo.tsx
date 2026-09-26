import { Stack, Typography } from '@mui/material';
import { type as typeTokens } from '../../../theme/tokens';
import { Simbolo } from '../../atoms/Simbolo/Simbolo';

export interface LogotipoProps {
  disposicion?: 'horizontal' | 'vertical' | 'simbolo';
  alto?: number;
  tono?: 'color' | 'claro' | 'monocromo';
}

const TONO_SIMBOLO = { color: 'color', claro: 'claro', monocromo: 'mono' } as const;

/**
 * El símbolo y el nombre, en las tres disposiciones que el proyecto necesita. El nombre se
 * compone en vivo en la familia `display`, peso 700, interletrado -0,02em — nunca un archivo
 * con el texto convertido a curvas, para que el nombre de marca y el que muestra la app no se
 * puedan separar. "Rumbo a Casa" es un nombre propio: se escribe igual en los dos idiomas.
 */
export function Logotipo({ disposicion = 'horizontal', alto = 40, tono = 'color' }: LogotipoProps) {
  const colorTexto =
    tono === 'claro' ? 'var(--ink-on-brand)' : tono === 'monocromo' ? 'var(--ink)' : 'var(--ink-strong)';

  if (disposicion === 'simbolo') return <Simbolo tamano={alto} tono={TONO_SIMBOLO[tono]} />;

  const nombre = (
    <Typography
      sx={{
        fontFamily: typeTokens['display-xl'].fontFamily,
        fontWeight: typeTokens['display-xl'].fontWeight,
        letterSpacing: typeTokens['display-xl'].letterSpacing,
        color: colorTexto,
        fontSize: alto * 0.5,
        lineHeight: 1.1,
        textAlign: disposicion === 'vertical' ? 'center' : 'left',
      }}
    >
      {disposicion === 'vertical' ? (
        <>
          Rumbo a
          <br />
          Casa
        </>
      ) : (
        'Rumbo a Casa'
      )}
    </Typography>
  );

  return (
    <Stack
      direction={disposicion === 'vertical' ? 'column' : 'row'}
      alignItems="center"
      spacing={`${alto * 0.22}px`}
    >
      <Simbolo tamano={alto} tono={TONO_SIMBOLO[tono]} />
      {nombre}
    </Stack>
  );
}
