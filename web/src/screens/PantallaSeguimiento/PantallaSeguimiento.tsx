import { useState } from 'react';
import { Stack, Typography, Box } from '@mui/material';
import { AppShell } from '../../components/templates/AppShell/AppShell';
import { OpcionTarjeta } from '../../components/molecules/OpcionTarjeta/OpcionTarjeta';
import { CampoTexto } from '../../components/atoms/CampoTexto/CampoTexto';
import { Columnas } from '../../components/molecules/Columnas/Columnas';
import { Boton } from '../../components/atoms/Boton/Boton';
import { useSesion } from '../../state/SesionContext';
import { useT, useIdioma } from '../../i18n/LocaleContext';
import { formatoFechaCorta } from '../../lib/fecha';
import { type as typeTokens } from '../../theme/tokens';

/** Claves puras, sin traducir — `PantallaSeguimiento` las traduce vía `t.pantallas.seguimiento.etapas`. */
const CLAVES_ETAPA = ['papeles', 'postule', 'evaluacion', 'resultado'] as const;

/** Colocación en la grilla desde 900 px: la etapa ocupa la derecha en dos filas; lo demás, la izquierda. El orden del DOM (y el móvil) es próximo llamado, etapa, folio. */
const IZQUIERDA_ARRIBA = { gridColumn: { md: 1 }, gridRow: { md: 1 } };
const DERECHA_DOS_FILAS = { gridColumn: { md: 2 }, gridRow: { md: '1 / span 2' } };
const IZQUIERDA_ABAJO = { gridColumn: { md: 1 }, gridRow: { md: 2 } };

/**
 * Quinta pantalla: el próximo llamado y la etapa en que está la persona. No hay consulta
 * automática de estado — la persona marca la etapa y la app se lo recuerda.
 */
export function PantallaSeguimiento() {
  const { resultados, seguimiento, marcarEtapa, guardarFolio } = useSesion();
  const t = useT();
  const { idioma } = useIdioma();
  const [folioBorrador, setFolioBorrador] = useState(seguimiento.folio ?? '');

  const fechaReglas = resultados[0]?.regla.fechaConsulta;
  const opciones = CLAVES_ETAPA.map((clave) => ({
    value: clave,
    titulo: t.pantallas.seguimiento.etapas[clave].titulo,
    detalle: t.pantallas.seguimiento.etapas[clave].detalle,
  }));

  return (
    <AppShell titulo={t.pantallas.seguimiento.titulo} destino="avisos">
      <Stack spacing={4}>
        {fechaReglas && (
          <Typography sx={{ fontFamily: typeTokens.caption.fontFamily, fontSize: typeTokens.caption.fontSize, color: 'var(--ink-muted)' }}>
            {t.pantallas.seguimiento.reglasAl(formatoFechaCorta(fechaReglas, idioma))}
          </Typography>
        )}

        <Columnas espacioFila={{ xs: 'var(--space-4)', md: 'var(--space-5)' }} espacioColumna="var(--space-7)">
          <Box
            sx={{
              ...IZQUIERDA_ARRIBA,
              backgroundColor: 'var(--surface-brand-soft)',
              borderRadius: 'var(--radius-md)',
              p: 'var(--space-4)',
            }}
          >
            <Typography
              sx={{
                fontFamily: typeTokens.label.fontFamily,
                fontSize: typeTokens.label.fontSize,
                fontWeight: typeTokens.label.fontWeight,
                letterSpacing: typeTokens.label.letterSpacing,
                textTransform: 'uppercase',
                color: 'var(--ink-brand)',
              }}
            >
              {t.pantallas.seguimiento.proximoLlamado}
            </Typography>
            <Typography
              sx={{
                fontFamily: 'var(--font-display)',
                fontWeight: 600,
                fontSize: '24px',
                lineHeight: '30px',
                color: 'var(--ink-brand)',
                mt: 0.5,
              }}
            >
              {t.comun.sinFechaPublicada}
            </Typography>
            <Typography sx={{ fontFamily: typeTokens.caption.fontFamily, fontSize: typeTokens.caption.fontSize, color: 'var(--ink-brand)', mt: 0.5 }}>
              {t.pantallas.seguimiento.fechaPrevista}
            </Typography>
          </Box>

          <Stack spacing={2} sx={DERECHA_DOS_FILAS}>
            <Typography sx={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '18px', color: 'var(--ink-strong)' }}>
              {t.pantallas.seguimiento.enQueEtapa}
            </Typography>
            <OpcionTarjeta
              name="etapa-seguimiento"
              value={seguimiento.etapa}
              onChange={(e) => marcarEtapa(e.target.value as typeof seguimiento.etapa)}
              opciones={opciones}
            />
          </Stack>

          {seguimiento.etapa !== 'papeles' && (
            <Stack spacing={1.5} sx={IZQUIERDA_ABAJO}>
              <CampoTexto
                pregunta={t.pantallas.seguimiento.preguntaFolio}
                ayuda={t.pantallas.seguimiento.ayudaFolio}
                value={folioBorrador}
                onChange={(e) => setFolioBorrador(e.target.value)}
              />
              <Boton
                variant="outlined"
                onClick={() => guardarFolio(folioBorrador.trim())}
                disabled={!folioBorrador.trim() || folioBorrador.trim() === (seguimiento.folio ?? '')}
              >
                {t.pantallas.seguimiento.guardarFolio}
              </Boton>
              {/* Sin esta confirmación, guardar no muestra nada y parece que el botón no hace nada. */}
              {seguimiento.folio && seguimiento.folio === folioBorrador.trim() && (
                <Typography role="status" sx={{ fontFamily: 'var(--font-sans)', fontWeight: 600, color: 'var(--ink-success)' }}>
                  {t.pantallas.seguimiento.folioGuardado(seguimiento.folio)}
                </Typography>
              )}
            </Stack>
          )}
        </Columnas>

        <Typography sx={{ fontFamily: typeTokens.caption.fontFamily, fontSize: typeTokens.caption.fontSize, color: 'var(--ink-muted)' }}>
          {t.pantallas.seguimiento.notaEstado}
        </Typography>
      </Stack>
    </AppShell>
  );
}
