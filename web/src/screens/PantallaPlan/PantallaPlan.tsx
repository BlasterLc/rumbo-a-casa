import { useParams, useNavigate } from 'react-router-dom';
import { Stack, Typography } from '@mui/material';
import { AppShell } from '../../components/templates/AppShell/AppShell';
import {
  ChecklistDocumentos,
  type DocumentoChecklist,
} from '../../components/organisms/ChecklistDocumentos/ChecklistDocumentos';
import { LineaDeLlamados } from '../../components/organisms/LineaDeLlamados/LineaDeLlamados';
import { AvisoLimite } from '../../components/molecules/AvisoLimite/AvisoLimite';
import { Alerta } from '../../components/molecules/Alerta/Alerta';
import { Boton } from '../../components/atoms/Boton/Boton';
import { useSesion } from '../../state/SesionContext';
import { useT, useIdioma } from '../../i18n/LocaleContext';
import { formatoFechaCorta } from '../../lib/fecha';
import type { Programa } from '../../types/dominio';

const PROGRAMAS_VALIDOS: Programa[] = ['DS49', 'DS1', 'DS19', 'DS52'];
const esPrograma = (p: string | undefined): p is Programa => PROGRAMAS_VALIDOS.includes(p as Programa);

const ESTILO_TITULO_PASO = {
  fontFamily: 'var(--font-display)',
  fontWeight: 700,
  fontSize: '24px',
  lineHeight: '30px',
  color: 'var(--ink-strong)',
} as const;

/**
 * Cuarta pantalla: el plan de un programa en cuatro pasos numerados, siempre los mismos. El
 * cuarto es siempre salir al sitio del MINVU.
 */
export function PantallaPlan() {
  const { programa } = useParams<{ programa: string }>();
  const navigate = useNavigate();
  const { resultados, plan, documentosListos, marcarDocumento } = useSesion();
  const t = useT();
  const { idioma } = useIdioma();

  if (!esPrograma(programa)) {
    return (
      <AppShell titulo={t.pantallas.plan.titulo} destino="plan" atras>
        <Typography sx={{ fontFamily: 'var(--font-sans)', color: 'var(--ink-muted)' }}>
          {t.pantallas.plan.noReconocemos}
        </Typography>
      </AppShell>
    );
  }

  const resultado = resultados.find((r) => r.programa === programa);
  const planPrograma = plan.find((p) => p.programa === programa);
  const nombreComun = t.organisms.nombrePrograma[programa];

  const items: DocumentoChecklist[] = (planPrograma?.documentos ?? []).map((d) => ({
    nombre: d.nombre,
    donde: d.detalle,
    listo: Boolean(documentosListos[`${programa}:${d.nombre}`]),
  }));

  return (
    <AppShell titulo={t.pantallas.plan.tituloPrograma(programa)} destino="plan" atras>
      <Stack spacing={5}>
        <Stack spacing={1}>
          <Typography sx={ESTILO_TITULO_PASO}>{t.pantallas.plan.paso1}</Typography>
          {resultado ? (
            <Alerta severity="success">
              {resultado.motivo} —{' '}
              {t.comun.fuente(
                `${resultado.regla.decreto} · ${formatoFechaCorta(resultado.regla.fechaConsulta, idioma)}`,
              )}
            </Alerta>
          ) : (
            <Typography sx={{ color: 'var(--ink-muted)' }}>{t.pantallas.plan.todaviaNoEvaluamos}</Typography>
          )}
        </Stack>

        <Stack spacing={1}>
          <Typography sx={ESTILO_TITULO_PASO}>{t.pantallas.plan.paso2}</Typography>
          {items.length > 0 ? (
            <ChecklistDocumentos
              programa={`${programa} — ${nombreComun}`}
              items={items}
              onToggle={(indice) => marcarDocumento(`${programa}:${items[indice].nombre}`, !items[indice].listo)}
            />
          ) : (
            <Typography sx={{ color: 'var(--ink-muted)' }}>{t.pantallas.plan.calificaPrimero}</Typography>
          )}
        </Stack>

        <Stack spacing={1}>
          <Typography sx={ESTILO_TITULO_PASO}>{t.pantallas.plan.paso3}</Typography>
          <LineaDeLlamados
            llamados={[
              {
                programa: `${programa} — ${nombreComun}`,
                fechas: t.comun.sinFechaPublicada,
                serviu: t.comun.porConfirmarServiuRegional,
                estado: 'porVenir',
                porConfirmar: true,
              },
            ]}
          />
        </Stack>

        <Stack spacing={2}>
          <Typography sx={ESTILO_TITULO_PASO}>{t.pantallas.plan.paso4}</Typography>
          <AvisoLimite conSalida />
          <Boton variant="outlined" onClick={() => navigate('/avisos')}>
            {t.pantallas.plan.yaPostule}
          </Boton>
        </Stack>
      </Stack>
    </AppShell>
  );
}
