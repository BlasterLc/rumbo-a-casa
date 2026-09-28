import { Box, ButtonBase, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Icono, type NombreIcono } from '../../atoms/Icono/Icono';
import { Boton } from '../../atoms/Boton/Boton';
import { useT } from '../../../i18n/LocaleContext';
import { useSesion } from '../../../state/SesionContext';
import { sizePx } from '../../../theme/tokens';
import type { DestinoBarraInferior } from '../BarraInferior/BarraInferior';

const DESTINOS: ReadonlyArray<{ valor: DestinoBarraInferior; icono: NombreIcono }> = [
  { valor: 'hablar', icono: 'chat' },
  { valor: 'plan', icono: 'casa' },
  { valor: 'documentos', icono: 'papel' },
  { valor: 'avisos', icono: 'campana' },
];

/** Clave de `t.organisms.barraInferior` de cada destino: las etiquetas son las mismas que en móvil. */
const ETIQUETA = { hablar: 'hablar', plan: 'miPlan', documentos: 'documentos', avisos: 'avisos' } as const;

export interface SidebarEscritorioProps {
  destino?: DestinoBarraInferior;
  avisos?: number;
  onNavegar?: (destino: DestinoBarraInferior) => void;
}

/**
 * Navegación de escritorio: los mismos cuatro destinos de `BarraInferior`, en una columna fija a
 * la izquierda del contenido (lo decide `AppShell`). Al pie, "Borrar mis datos" — antes solo
 * alcanzable desde la Bienvenida — queda accesible desde cualquier pantalla, como ya lo está en
 * el mockup aprobado. Llama a `useSesion`/`useNavigate` directamente, igual que `BotonesBienvenida`
 * en `PantallaBienvenida.tsx`: quien lo monte necesita `SesionProvider` y un Router alrededor.
 */
export function SidebarEscritorio({ destino, avisos = 0, onNavegar }: SidebarEscritorioProps) {
  const t = useT();
  const { borrarDatos } = useSesion();
  const navigate = useNavigate();

  return (
    <Box
      component="nav"
      aria-label={t.organisms.sidebarEscritorio.etiqueta}
      sx={{
        width: sizePx['size-sidebar'],
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 0.5,
        p: 'var(--space-5) var(--space-4)',
        borderRight: '1px solid var(--border)',
        backgroundColor: 'var(--surface-raised)',
        position: 'sticky',
        top: 'var(--size-header)',
        height: 'calc(100dvh - var(--size-header))',
        overflowY: 'auto',
      }}
    >
      {DESTINOS.map(({ valor, icono }) => {
        const activo = valor === destino;
        return (
          <ButtonBase
            key={valor}
            aria-current={activo ? 'page' : undefined}
            onClick={() => onNavegar?.(valor)}
            sx={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              minHeight: 52,
              px: 'var(--space-3)',
              borderRadius: 'var(--radius-md)',
              fontFamily: 'var(--font-sans)',
              fontSize: '16px',
              fontWeight: activo ? 700 : 600,
              color: activo ? 'var(--ink-brand)' : 'var(--ink)',
              backgroundColor: activo ? 'var(--surface-brand-soft)' : 'transparent',
              '&:hover': { backgroundColor: activo ? 'var(--surface-brand-soft)' : 'var(--surface-sunken)' },
              // `ButtonBase` fija `outline: 0` en su propio estilo, que gana al `:focus-visible`
              // global de `MuiCssBaseline`: hay que declarar el anillo completo aquí.
              '&:focus-visible': { outline: '3px solid var(--focus-ring)', outlineOffset: '2px' },
              '&::before': activo
                ? {
                    content: '""',
                    position: 'absolute',
                    left: 0,
                    top: 14,
                    width: 3,
                    height: 24,
                    borderRadius: 'var(--radius-pill)',
                    backgroundColor: 'var(--brand)',
                  }
                : undefined,
            }}
          >
            <Icono nombre={icono} />
            {t.organisms.barraInferior[ETIQUETA[valor]]}
            {valor === 'avisos' && avisos > 0 && (
              <Box
                component="span"
                sx={{
                  ml: 'auto',
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

      <Box sx={{ mt: 'auto', display: 'flex', flexDirection: 'column', gap: 1.5, pt: 'var(--space-4)' }}>
        <Box sx={{ height: '1px', backgroundColor: 'var(--border)' }} />
        <Boton
          variant="text"
          onClick={() => {
            borrarDatos();
            navigate('/');
          }}
          sx={{
            justifyContent: 'flex-start',
            px: 'var(--space-3)',
            minHeight: 'var(--size-touch)',
            '&:focus-visible': { outline: '3px solid var(--focus-ring)', outlineOffset: '2px' },
          }}
        >
          {t.organisms.sidebarEscritorio.borrarDatos}
        </Boton>
        <Typography sx={{ fontFamily: 'var(--font-sans)', fontSize: '13px', lineHeight: '18px', color: 'var(--ink-muted)', px: 'var(--space-3)' }}>
          {t.organisms.sidebarEscritorio.notaPrivacidad}
        </Typography>
      </Box>
    </Box>
  );
}
