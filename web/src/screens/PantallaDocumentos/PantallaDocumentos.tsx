import { Stack, Typography } from '@mui/material';
import { AppShell } from '../../components/templates/AppShell/AppShell';
import {
  ChecklistDocumentos,
  type DocumentoChecklist,
} from '../../components/organisms/ChecklistDocumentos/ChecklistDocumentos';
import { useSesion } from '../../state/SesionContext';
import { useT } from '../../i18n/LocaleContext';

/** Los documentos de todos los programas donde la persona califica, agrupados por programa. */
export function PantallaDocumentos() {
  const { plan, documentosListos, marcarDocumento } = useSesion();
  const t = useT();

  if (plan.length === 0) {
    return (
      <AppShell titulo={t.pantallas.documentos.titulo} destino="documentos">
        <Typography sx={{ fontFamily: 'var(--font-sans)', color: 'var(--ink-muted)' }}>
          {t.pantallas.documentos.sinProgramas}
        </Typography>
      </AppShell>
    );
  }

  return (
    <AppShell titulo={t.pantallas.documentos.titulo} destino="documentos">
      <Stack spacing={5}>
        {plan.map((p) => {
          const items: DocumentoChecklist[] = p.documentos.map((d) => ({
            nombre: d.nombre,
            donde: d.detalle,
            listo: Boolean(documentosListos[`${p.programa}:${d.nombre}`]),
          }));
          return (
            <ChecklistDocumentos
              key={p.programa}
              programa={`${p.programa} — ${t.organisms.nombrePrograma[p.programa]}`}
              items={items}
              onToggle={(indice) => marcarDocumento(`${p.programa}:${items[indice].nombre}`, !items[indice].listo)}
            />
          );
        })}
      </Stack>
    </AppShell>
  );
}
