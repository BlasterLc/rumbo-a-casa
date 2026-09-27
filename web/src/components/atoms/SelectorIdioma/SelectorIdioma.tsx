import { ToggleButtonGroup, ToggleButton } from '@mui/material';
import { useIdioma, type Idioma } from '../../../i18n/LocaleContext';
import { color, sizePx } from '../../../theme/tokens';

export interface SelectorIdiomaProps {
  /** `sobreMarca`: sobre el azul de la cabecera (blanco). `claro`: sobre `surface-base` (azul de marca). */
  tono?: 'sobreMarca' | 'claro';
}

/**
 * El nombre de un idioma no se traduce: "Español" e "English" van siempre en su propio idioma.
 * Por eso este componente no usa el diccionario — es la única excepción documentada en Global
 * Constraints. Vive de forma fija dentro de CabeceraApp (Task 19), siempre visible, y en la
 * Bienvenida de escritorio, donde no hay cabecera.
 */
export function SelectorIdioma({ tono = 'sobreMarca' }: SelectorIdiomaProps) {
  const { idioma, cambiarIdioma } = useIdioma();
  const sobreMarca = tono === 'sobreMarca';
  const tinta = sobreMarca ? color['ink-on-brand'] : color.brand;
  const fondoSeleccionado = sobreMarca ? color['surface-brand-soft'] : color.brand;
  const tintaSeleccionada = sobreMarca ? color['ink-brand'] : color['ink-on-fill'];

  return (
    <ToggleButtonGroup
      value={idioma}
      exclusive
      onChange={(_e, valor: Idioma | null) => valor && cambiarIdioma(valor)}
      size="small"
      sx={{
        '& .MuiToggleButton-root': {
          color: tinta,
          borderColor: tinta,
          minWidth: sizePx['size-touch'],
          minHeight: sizePx['size-touch'],
          fontWeight: 700,
          fontSize: '13px',
          // Sobre el azul de la cabecera el anillo global (azul) casi no se ve: ahí va blanco.
          '&:focus-visible': { outlineColor: tinta },
        },
        '& .Mui-selected': {
          backgroundColor: `${fondoSeleccionado} !important`,
          color: `${tintaSeleccionada} !important`,
        },
      }}
    >
      <ToggleButton value="es" aria-label="Español">
        ES
      </ToggleButton>
      <ToggleButton value="en" aria-label="English">
        EN
      </ToggleButton>
    </ToggleButtonGroup>
  );
}
