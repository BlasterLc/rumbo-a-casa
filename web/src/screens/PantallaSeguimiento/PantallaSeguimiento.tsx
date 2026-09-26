import { useState } from 'react';
import { Stack, Typography, Box } from '@mui/material';
import { AppShell } from '../../components/templates/AppShell/AppShell';
import { OpcionTarjeta } from '../../components/molecules/OpcionTarjeta/OpcionTarjeta';
import { CampoTexto } from '../../components/atoms/CampoTexto/CampoTexto';
import { Boton } from '../../components/atoms/Boton/Boton';
import { useSesion } from '../../state/SesionContext';
import { useT, useIdioma } from '../../i18n/LocaleContext';
import { formatoFechaCorta } from '../../lib/fecha';
import { type as typeTokens } from '../../theme/tokens';

/** Claves puras, sin traducir — `PantallaSeguimiento` las traduce vía `t.pantallas.seguimiento.etapas`. */
const CLAVES_ETAPA = ['papeles', 'postule', 'evaluacion', 'resultado'] as const;

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

        <Box sx={{ backgroundColor: 'var(--surface-brand-soft)', borderRadius: 'var(--radius-md)', p: 'var(--space-4)' }}>
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

        <Stack spacing={2}>
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
          <Stack spacing={1.5}>
            <CampoTexto
              pregunta={t.pantallas.seguimiento.preguntaFolio}
              ayuda={t.pantallas.seguimiento.ayudaFolio}
              value={folioBorrador}
              onChange={(e) => setFolioBorrador(e.target.value)}
            />
            <Boton variant="outlined" onClick={() => guardarFolio(folioBorrador)} disabled={!folioBorrador.trim()}>
              {t.pantallas.seguimiento.guardarFolio}
            </Boton>
          </Stack>
        )}

        <Typography sx={{ fontFamily: typeTokens.caption.fontFamily, fontSize: typeTokens.caption.fontSize, color: 'var(--ink-muted)' }}>
          {t.pantallas.seguimiento.notaEstado}
        </Typography>
      </Stack>
    </AppShell>
  );
}
