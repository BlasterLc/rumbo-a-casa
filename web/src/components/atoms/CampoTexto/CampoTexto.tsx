import { TextField, IconButton, InputAdornment, Typography, type TextFieldProps } from '@mui/material';
import { Icono } from '../Icono/Icono';
import { useT } from '../../../i18n/LocaleContext';

export interface CampoTextoProps extends Omit<TextFieldProps, 'label' | 'helperText' | 'error'> {
  /** La pregunta completa en lenguaje natural, no el nombre del campo. */
  pregunta: string;
  /** Para qué sirve el dato. */
  ayuda?: string;
  /** Qué hacer para arreglarlo. Reemplaza a la ayuda. */
  error?: string;
  /** Muestra el botón de micrófono como adorno final (afordancia visual; el reconocimiento de
   * voz lo cablea quien use el campo). */
  dictado?: boolean;
  /** Equivalencia calculada, por ejemplo el monto en UF. */
  equivalencia?: string;
}

/**
 * Entrada de un dato de la entrevista. Tres partes siempre visibles: la pregunta como etiqueta,
 * el campo, y una ayuda que dice para qué sirve el dato — nunca el formato, eso va en `placeholder`.
 */
export function CampoTexto({
  pregunta,
  ayuda,
  error,
  dictado,
  equivalencia,
  InputProps,
  sx,
  ...props
}: CampoTextoProps) {
  const t = useT();
  return (
    <>
      <TextField
        label={pregunta}
        helperText={error ?? ayuda}
        error={Boolean(error)}
        InputProps={{
          ...InputProps,
          endAdornment: dictado ? (
            <InputAdornment position="end">
              <IconButton aria-label={t.atoms.campoTexto.dictarPorVoz} sx={{ color: 'var(--accent)' }}>
                <Icono nombre="mic" />
              </IconButton>
            </InputAdornment>
          ) : InputProps?.endAdornment,
        }}
        sx={{
          '& .MuiFormHelperText-root': { color: error ? 'var(--ink-danger)' : 'var(--ink-muted)' },
          ...sx,
        }}
        {...props}
      />
      {equivalencia && (
        <Typography sx={{ fontFamily: 'var(--font-mono)', fontSize: '15px', color: 'var(--ink-muted)', mt: 0.5 }}>
          {equivalencia}
        </Typography>
      )}
    </>
  );
}
