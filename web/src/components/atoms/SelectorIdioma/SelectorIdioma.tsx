import { ToggleButtonGroup, ToggleButton } from '@mui/material';
import { useIdioma, type Idioma } from '../../../i18n/LocaleContext';

/**
 * El nombre de un idioma no se traduce: "Español" e "English" van siempre en su propio idioma.
 * Por eso este componente no usa el diccionario — es la única excepción documentada en Global
 * Constraints. Vive de forma fija dentro de CabeceraApp (Task 19), siempre visible.
 */
export function SelectorIdioma() {
  const { idioma, cambiarIdioma } = useIdioma();

  return (
    <ToggleButtonGroup
      value={idioma}
      exclusive
      onChange={(_e, valor: Idioma | null) => valor && cambiarIdioma(valor)}
      size="small"
      sx={{
        '& .MuiToggleButton-root': {
          color: 'var(--ink-on-brand)',
          borderColor: 'var(--ink-on-brand)',
          minWidth: 'var(--size-touch)',
          minHeight: 'var(--size-touch)',
          fontWeight: 700,
          fontSize: '13px',
        },
        '& .Mui-selected': {
          backgroundColor: 'var(--surface-brand-soft) !important',
          color: 'var(--ink-brand) !important',
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
