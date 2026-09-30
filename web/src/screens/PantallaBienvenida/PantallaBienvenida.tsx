import { Box, Chip, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Logotipo } from '../../components/organisms/Logotipo/Logotipo';
import { PanelProgramas } from '../../components/organisms/PanelProgramas/PanelProgramas';
import { PasosComoFunciona } from '../../components/organisms/PasosComoFunciona/PasosComoFunciona';
import { QuienHaceQue } from '../../components/organisms/QuienHaceQue/QuienHaceQue';
import { PreguntasFrecuentes } from '../../components/organisms/PreguntasFrecuentes/PreguntasFrecuentes';
import { FranjaLlamado } from '../../components/organisms/FranjaLlamado/FranjaLlamado';
import { Columnas } from '../../components/molecules/Columnas/Columnas';
import { Boton } from '../../components/atoms/Boton/Boton';
import { SelectorIdioma } from '../../components/atoms/SelectorIdioma/SelectorIdioma';
import { useSesion } from '../../state/SesionContext';
import { useT } from '../../i18n/LocaleContext';
import { type as typeTokens, sizePx } from '../../theme/tokens';

const PROGRAMAS = ['DS49', 'DS1', 'DS19', 'DS52'];
const ALTO_FILA_SUPERIOR = 88;

/** Ancho y márgenes de cada franja de la página: el contenido nunca pasa de `size-page`. */
const contenedor = {
  maxWidth: sizePx['size-page'],
  mx: 'auto',
  px: { xs: 'var(--space-4)', md: 'var(--space-6)' },
} as const;

// Sobre el azul de la franja final los botones se invierten: el principal es blanco y el
// secundario un contorno blanco, para que sigan leyéndose como principal y secundario.
const BOTON_PRINCIPAL_SOBRE_AZUL = {
  backgroundColor: 'var(--surface-raised)',
  color: 'var(--ink-brand)',
  '&:hover': { backgroundColor: 'var(--surface-brand-soft)' },
} as const;
const BOTON_SECUNDARIO_SOBRE_AZUL = {
  color: 'var(--ink-on-brand)',
  borderColor: 'rgba(255, 255, 255, 0.6)',
  '&:hover': { borderColor: 'var(--ink-on-brand)', backgroundColor: 'rgba(255, 255, 255, 0.08)' },
} as const;

/** Los botones de la Bienvenida: empezar o seguir donde quedó la persona. */
function BotonesBienvenida({ sobreAzul = false }: { sobreAzul?: boolean }) {
  const navigate = useNavigate();
  const { transcript, borrarDatos, activarDemo } = useSesion();
  const t = useT();
  const tieneSesionPrevia = transcript.length > 0;
  const principal = sobreAzul ? BOTON_PRINCIPAL_SOBRE_AZUL : undefined;
  const secundario = sobreAzul ? BOTON_SECUNDARIO_SOBRE_AZUL : undefined;
  return tieneSesionPrevia ? (
    <>
      <Boton sx={principal} onClick={() => navigate('/hablar')}>
        {t.pantallas.bienvenida.seguirDondeQuedaste}
      </Boton>
      <Boton variant="outlined" color="secondary" sx={secundario} onClick={borrarDatos}>
        {t.pantallas.bienvenida.empezarDeNuevo}
      </Boton>
    </>
  ) : (
    <>
      <Boton sx={principal} onClick={() => navigate('/hablar')}>
        {t.pantallas.bienvenida.empezar}
      </Boton>
      {/* Para ver la app sin escribir datos propios: familia ficticia, veredictos reales del motor. */}
      <Boton
        variant="outlined"
        color="secondary"
        sx={secundario}
        onClick={() => {
          activarDemo();
          navigate('/resultado');
        }}
      >
        {t.pantallas.entrevista.probarModoDemo}
      </Boton>
    </>
  );
}

/**
 * Primera pantalla: la promesa, las formas de empezar, cómo se reparte el trabajo entre la
 * herramienta y la persona, y las preguntas frecuentes. No pide nada — no hay registro, correo
 * ni Clave Única. Es una sola composición responsive: en móvil las columnas se apilan.
 */
export function PantallaBienvenida() {
  const t = useT();
  const b = t.pantallas.bienvenida;

  return (
    <Box sx={{ minHeight: '100dvh', backgroundColor: 'var(--surface-base)' }}>
      <Box sx={contenedor}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ height: { xs: 72, md: ALTO_FILA_SUPERIOR } }}>
          <Logotipo disposicion="horizontal" alto={40} />
          <SelectorIdioma tono="claro" />
        </Stack>

        <Box sx={{ pt: { xs: 'var(--space-5)', md: 'var(--space-6)' }, pb: { xs: 'var(--space-6)', md: 'var(--space-7)' } }}>
          <Columnas plantilla="minmax(0, 1.05fr) minmax(0, 0.95fr)" espacioColumna="var(--space-8)" espacioFila="var(--space-6)" alinear="center">
            <Stack spacing={3}>
              <Stack spacing={2}>
                <Typography
                  component="h1"
                  sx={{
                    ...typeTokens['display-2xl'],
                    fontSize: { xs: typeTokens['display-xl'].fontSize, md: typeTokens['display-2xl'].fontSize },
                    color: 'var(--ink-strong)',
                  }}
                >
                  {b.titulo}
                </Typography>
                <Typography sx={{ ...typeTokens['body-l'], color: 'var(--ink)', maxWidth: '44ch' }}>{b.bajada}</Typography>
              </Stack>
              <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
                {PROGRAMAS.map((p) => (
                  <Chip key={p} label={p} sx={{ backgroundColor: 'var(--surface-brand-soft)', color: 'var(--ink-brand)', fontWeight: 600 }} />
                ))}
              </Stack>
              <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1.5 }}>
                <BotonesBienvenida />
              </Stack>
              <Typography sx={{ ...typeTokens.caption, color: 'var(--ink-muted)', maxWidth: '52ch' }}>{b.fraseConfianza}</Typography>
            </Stack>
            <PanelProgramas />
          </Columnas>
        </Box>

        <Box sx={{ pb: { xs: 'var(--space-6)', md: 'var(--space-8)' } }}>
          <PasosComoFunciona />
        </Box>
      </Box>

      <Box sx={{ backgroundColor: 'var(--surface-raised)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <Box sx={{ ...contenedor, py: { xs: 'var(--space-6)', md: 'var(--space-8)' } }}>
          <QuienHaceQue />
        </Box>
      </Box>

      <Box sx={{ ...contenedor, maxWidth: 800, py: { xs: 'var(--space-6)', md: 'var(--space-8)' } }}>
        <PreguntasFrecuentes />
      </Box>

      <FranjaLlamado>
        <BotonesBienvenida sobreAzul />
      </FranjaLlamado>
    </Box>
  );
}
