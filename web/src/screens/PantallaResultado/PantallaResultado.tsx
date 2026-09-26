import { Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../../components/templates/AppShell/AppShell';
import { BloqueHero } from '../../components/organisms/BloqueHero/BloqueHero';
import { TarjetaPrograma } from '../../components/organisms/TarjetaPrograma/TarjetaPrograma';
import { useSesion } from '../../state/SesionContext';
import { useT, useIdioma } from '../../i18n/LocaleContext';
import { mapEstado } from '../../lib/estado';
import { formatoFechaCorta } from '../../lib/fecha';
import type { EstadoElegibilidad as EstadoBackend } from '../../types/dominio';

const ORDEN_ESTADO: EstadoBackend[] = ['elegible', 'falta_dato', 'no_elegible'];

/**
 * Tercera pantalla: todos los programas evaluados en una lista, cada uno con su sello, su razón
 * y su regla citada. Muestra los cuatro, no solo los que califican — saber por qué algo no
 * aplica es parte de entender el laberinto.
 */
export function PantallaResultado() {
  const navigate = useNavigate();
  const { perfil, resultados } = useSesion();
  const t = useT();
  const { idioma } = useIdioma();

  const ordenados = [...resultados].sort(
    (a, b) => ORDEN_ESTADO.indexOf(a.estado) - ORDEN_ESTADO.indexOf(b.estado),
  );
  const calificaCount = resultados.filter((r) => r.estado === 'elegible').length;
  const personas =
    perfil.integrantesGrupoFamiliar !== 'desconocido' ? perfil.integrantesGrupoFamiliar.length + 1 : undefined;

  return (
    <AppShell titulo={t.pantallas.resultado.titulo} destino="plan" atras>
      <Stack spacing={3}>
        <BloqueHero
          titulo={
            calificaCount > 0
              ? t.pantallas.resultado.calificaPara(calificaCount)
              : t.pantallas.resultado.revisamosCuatro
          }
          bajada={personas ? t.pantallas.resultado.personas(personas) : undefined}
        />

        {resultados.length === 0 && (
          <Typography sx={{ fontFamily: 'var(--font-sans)', color: 'var(--ink-muted)' }}>
            {t.pantallas.resultado.sinDatos}
          </Typography>
        )}

        {ordenados.map((r) => (
          <TarjetaPrograma
            key={r.programa}
            sigla={r.programa}
            nombreComun={t.organisms.nombrePrograma[r.programa]}
            estado={mapEstado(r.estado)}
            razon={r.motivo}
            regla={`${r.regla.decreto} · ${formatoFechaCorta(r.regla.fechaConsulta, idioma)}`}
            accion={
              r.estado === 'elegible'
                ? t.pantallas.resultado.verDocumentos
                : r.estado === 'falta_dato'
                  ? t.pantallas.resultado.verComoAlcanzarlo
                  : undefined
            }
            onAccion={() => navigate(`/plan/${r.programa}`)}
          />
        ))}
      </Stack>
    </AppShell>
  );
}
