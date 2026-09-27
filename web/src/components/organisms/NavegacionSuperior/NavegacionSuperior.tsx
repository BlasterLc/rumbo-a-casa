import type { SyntheticEvent } from 'react';
import { Box, ButtonBase, Stack } from '@mui/material';
import { Icono, type NombreIcono } from '../../atoms/Icono/Icono';
import { useT } from '../../../i18n/LocaleContext';
import type { DestinoBarraInferior } from '../BarraInferior/BarraInferior';

const DESTINOS: ReadonlyArray<{ valor: DestinoBarraInferior; icono: NombreIcono }> = [
  { valor: 'hablar', icono: 'chat' },
  { valor: 'plan', icono: 'casa' },
  { valor: 'documentos', icono: 'papel' },
  { valor: 'avisos', icono: 'campana' },
];

/** Clave de `t.organisms.barraInferior` de cada destino: las etiquetas son las mismas que en móvil. */
const ETIQUETA = { hablar: 'hablar', plan: 'miPlan', documentos: 'documentos', avisos: 'avisos' } as const;

export interface NavegacionSuperiorProps {
  value?: DestinoBarraInferior;
  avisos?: number;
  onChange?: (e: SyntheticEvent, v: string) => void;
}

/**
 * Los mismos cuatro destinos que `BarraInferior`, en línea dentro de la cabecera de escritorio.
 * Se renderiza en lugar de la barra inferior, nunca a la vez. El destino activo se marca con
 * `aria-current`, con fondo claro y con peso 700, no solo con color.
 */
export function NavegacionSuperior({ value, avisos = 0, onChange }: NavegacionSuperiorProps) {
  const t = useT();
  return (
    <Stack component="nav" aria-label={t.organisms.navegacionSuperior.etiqueta} direction="row" spacing={0.5}>
      {DESTINOS.map(({ valor, icono }) => {
        const activo = valor === value;
        return (
          <ButtonBase
            key={valor}
            aria-current={activo ? 'page' : undefined}
            onClick={(e) => onChange?.(e, valor)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              minHeight: 'var(--size-touch)',
              px: 2,
              borderRadius: 'var(--radius-md)',
              fontFamily: 'var(--font-sans)',
              fontSize: '16px',
              fontWeight: activo ? 700 : 600,
              color: activo ? 'var(--ink-brand)' : 'var(--ink-on-brand)',
              backgroundColor: activo ? 'var(--surface-brand-soft)' : 'transparent',
              '&:hover': { backgroundColor: activo ? 'var(--surface-brand-soft)' : 'rgba(255, 255, 255, 0.12)' },
              // ButtonBase pone `outline: 0` y gana al foco global: el anillo se declara completo, en blanco.
              '&:focus-visible': { outline: '3px solid var(--ink-on-brand)', outlineOffset: '2px' },
            }}
          >
            <Icono nombre={icono} />
            {t.organisms.barraInferior[ETIQUETA[valor]]}
            {valor === 'avisos' && avisos > 0 && (
              <Box
                component="span"
                sx={{
                  minWidth: 20,
                  height: 20,
                  px: '6px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--warning)',
                  color: 'var(--ink-on-fill)',
                  fontSize: 12,
                  fontWeight: 700,
                  lineHeight: '20px',
                  textAlign: 'center',
                }}
              >
                {avisos > 9 ? '9+' : avisos}
              </Box>
            )}
          </ButtonBase>
        );
      })}
    </Stack>
  );
}
