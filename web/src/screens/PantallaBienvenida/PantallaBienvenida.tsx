import { Box, Stack, Typography, Chip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Logotipo } from '../../components/organisms/Logotipo/Logotipo';
import { Franja } from '../../components/organisms/Franja/Franja';
import { Boton } from '../../components/atoms/Boton/Boton';
import { useSesion } from '../../state/SesionContext';
import { useT } from '../../i18n/LocaleContext';
import { type as typeTokens } from '../../theme/tokens';

const PROGRAMAS = ['DS49', 'DS1', 'DS19', 'DS52'];
const ANCHO_MAXIMO = 480;

/**
 * Primera de las cinco pantallas: la promesa, las dos formas de empezar, y la aclaración de que
 * esto no es un sitio del Estado. No pide nada — no hay registro, correo ni Clave Única.
 */
export function PantallaBienvenida() {
  const navigate = useNavigate();
  const { transcript, borrarDatos } = useSesion();
  const t = useT();
  const tieneSesionPrevia = transcript.length > 0;

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        maxWidth: ANCHO_MAXIMO,
        mx: 'auto',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--surface-base)',
      }}
    >
      <Box sx={{ p: 'var(--space-4)' }}>
        <Logotipo disposicion="horizontal" alto={32} />
      </Box>

      <Stack spacing={5} sx={{ flex: 1, px: 'var(--space-4)', pt: 'var(--space-6)' }}>
        <Stack spacing={2}>
          <Typography
            sx={{
              fontFamily: typeTokens['display-xl'].fontFamily,
              fontWeight: typeTokens['display-xl'].fontWeight,
              fontSize: typeTokens['display-xl'].fontSize,
              lineHeight: typeTokens['display-xl'].lineHeight,
              letterSpacing: typeTokens['display-xl'].letterSpacing,
              color: 'var(--ink-strong)',
            }}
          >
            {t.pantallas.bienvenida.titulo}
          </Typography>
          <Typography
            sx={{
              fontFamily: typeTokens['body-l'].fontFamily,
              fontSize: typeTokens['body-l'].fontSize,
              color: 'var(--ink)',
            }}
          >
            {t.pantallas.bienvenida.bajada}
          </Typography>
        </Stack>

        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
          {PROGRAMAS.map((p) => (
            <Chip
              key={p}
              label={p}
              sx={{ backgroundColor: 'var(--surface-brand-soft)', color: 'var(--ink-brand)', fontWeight: 600 }}
            />
          ))}
        </Stack>

        <Stack spacing={2} sx={{ mt: 'auto', pb: 'var(--space-6)' }}>
          {tieneSesionPrevia ? (
            <>
              <Boton onClick={() => navigate('/hablar')}>{t.pantallas.bienvenida.seguirDondeQuedaste}</Boton>
              <Boton variant="text" onClick={borrarDatos}>
                {t.pantallas.bienvenida.empezarDeNuevo}
              </Boton>
            </>
          ) : (
            <>
              <Boton onClick={() => navigate('/hablar')}>{t.pantallas.bienvenida.empezar}</Boton>
              <Boton variant="outlined" color="secondary" icono="mic" onClick={() => navigate('/hablar')}>
                {t.pantallas.bienvenida.prefieroHablar}
              </Boton>
            </>
          )}
          <Typography
            sx={{
              fontFamily: typeTokens.caption.fontFamily,
              fontSize: typeTokens.caption.fontSize,
              color: 'var(--ink-muted)',
            }}
          >
            {t.pantallas.bienvenida.fraseConfianza}
          </Typography>
        </Stack>
      </Stack>

      <Franja tono="brand" alto={96} borde="abajo" />
    </Box>
  );
}
