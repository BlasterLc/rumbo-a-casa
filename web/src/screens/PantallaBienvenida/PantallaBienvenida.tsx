import { Box, Stack, Typography, Chip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Logotipo } from '../../components/organisms/Logotipo/Logotipo';
import { Franja } from '../../components/organisms/Franja/Franja';
import { PanelProgramas } from '../../components/organisms/PanelProgramas/PanelProgramas';
import { PasosComoFunciona } from '../../components/organisms/PasosComoFunciona/PasosComoFunciona';
import { Columnas } from '../../components/molecules/Columnas/Columnas';
import { Boton } from '../../components/atoms/Boton/Boton';
import { SelectorIdioma } from '../../components/atoms/SelectorIdioma/SelectorIdioma';
import { useSesion } from '../../state/SesionContext';
import { useT } from '../../i18n/LocaleContext';
import { useEscritorio } from '../../lib/useEscritorio';
import { type as typeTokens, sizePx } from '../../theme/tokens';

const PROGRAMAS = ['DS49', 'DS1', 'DS19', 'DS52'];
const ANCHO_MAXIMO_MOVIL = 480;
const ALTO_FILA_SUPERIOR = 88;

/** Los botones de la Bienvenida: empezar o seguir donde quedó la persona. */
function BotonesBienvenida() {
  const navigate = useNavigate();
  const { transcript, borrarDatos } = useSesion();
  const t = useT();
  const tieneSesionPrevia = transcript.length > 0;
  return tieneSesionPrevia ? (
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
  );
}

function FraseConfianza() {
  const t = useT();
  return (
    <Typography
      sx={{
        fontFamily: typeTokens.caption.fontFamily,
        fontSize: typeTokens.caption.fontSize,
        color: 'var(--ink-muted)',
        maxWidth: { md: '52ch' },
      }}
    >
      {t.pantallas.bienvenida.fraseConfianza}
    </Typography>
  );
}

/** Bienvenida de escritorio: promesa y botones a la izquierda, panel de programas a la derecha. */
function BienvenidaEscritorio() {
  const t = useT();
  return (
    <Box sx={{ minHeight: '100dvh', backgroundColor: 'var(--surface-base)' }}>
      <Box sx={{ maxWidth: sizePx['size-page'], mx: 'auto', px: 'var(--space-6)' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ height: ALTO_FILA_SUPERIOR }}>
          <Logotipo disposicion="horizontal" alto={36} />
          <SelectorIdioma tono="claro" />
        </Stack>
        <Box sx={{ pt: 'var(--space-8)', pb: 'var(--space-7)' }}>
          <Columnas plantilla="minmax(0, 1.05fr) minmax(0, 0.95fr)" espacioColumna="var(--space-8)" alinear="center">
            <Stack spacing={3}>
              <Stack spacing={2}>
                <Typography
                  component="h1"
                  sx={{
                    fontFamily: typeTokens['display-2xl'].fontFamily,
                    fontWeight: typeTokens['display-2xl'].fontWeight,
                    fontSize: typeTokens['display-2xl'].fontSize,
                    lineHeight: typeTokens['display-2xl'].lineHeight,
                    letterSpacing: typeTokens['display-2xl'].letterSpacing,
                    color: 'var(--ink-strong)',
                  }}
                >
                  {t.pantallas.bienvenida.titulo}
                </Typography>
                <Typography
                  sx={{ fontFamily: typeTokens['body-l'].fontFamily, fontSize: '20px', lineHeight: '30px', color: 'var(--ink)', maxWidth: '40ch' }}
                >
                  {t.pantallas.bienvenida.bajada}
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap', rowGap: 1.5 }}>
                <BotonesBienvenida />
              </Stack>
              <FraseConfianza />
            </Stack>
            <PanelProgramas />
          </Columnas>
        </Box>
        <Box sx={{ pb: 'var(--space-8)' }}>
          <PasosComoFunciona />
        </Box>
      </Box>
    </Box>
  );
}

/**
 * Primera de las cinco pantallas: la promesa, las dos formas de empezar, y la aclaración de que
 * esto no es un sitio del Estado. No pide nada — no hay registro, correo ni Clave Única.
 * En escritorio (≥ 900 px) es una composición de dos columnas con el panel de los cuatro programas.
 */
export function PantallaBienvenida() {
  const t = useT();
  const escritorio = useEscritorio();

  if (escritorio) return <BienvenidaEscritorio />;

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        maxWidth: ANCHO_MAXIMO_MOVIL,
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
          <BotonesBienvenida />
          <FraseConfianza />
        </Stack>
      </Stack>

      <Franja tono="brand" alto={96} borde="abajo" />
    </Box>
  );
}
