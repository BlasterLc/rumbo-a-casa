import { Alert, AlertTitle, Typography } from '@mui/material';
import { AppShell } from '../../components/templates/AppShell/AppShell';
import {
  ChecklistDocumentos,
  type DocumentoChecklist,
} from '../../components/organisms/ChecklistDocumentos/ChecklistDocumentos';
import { Icono } from '../../components/atoms/Icono/Icono';
import { Columnas } from '../../components/molecules/Columnas/Columnas';
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
      <Alert severity="info" icon={<Icono nombre="info" />} sx={{ mb: 'var(--space-5)', alignItems: 'flex-start' }}>
        <AlertTitle>{t.pantallas.documentos.explicacionTitulo}</AlertTitle>
        {t.pantallas.documentos.explicacion}
      </Alert>
      <Columnas espacioFila={{ xs: '20px', md: 'var(--space-6)' }} espacioColumna="var(--space-7)">
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
      </Columnas>
    </AppShell>
  );
}
