import { Accordion, AccordionSummary, AccordionDetails, Alert, AlertTitle, Stack, Typography } from '@mui/material';
import { AppShell } from '../../components/templates/AppShell/AppShell';
import {
  ChecklistDocumentos,
  type DocumentoChecklist,
} from '../../components/organisms/ChecklistDocumentos/ChecklistDocumentos';
import { Icono } from '../../components/atoms/Icono/Icono';
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
      <Alert severity="info" icon={<Icono nombre="info" />} sx={{ mb: 'var(--space-5)', alignItems: 'flex-start', maxWidth: '720px', mx: 'auto' }}>
        <AlertTitle>{t.pantallas.documentos.explicacionTitulo}</AlertTitle>
        {t.pantallas.documentos.explicacion}
      </Alert>
      {/* Un desplegable por programa, en una columna centrada: cerrados muestran solo el nombre y
          el avance, y al tocarlos se abre el checklist. */}
      <Stack spacing={2} sx={{ width: '100%', maxWidth: '720px', mx: 'auto' }}>
        {plan.map((p) => {
          const items: DocumentoChecklist[] = p.documentos.map((d) => ({
            nombre: d.nombre,
            donde: d.detalle,
            listo: Boolean(documentosListos[`${p.programa}:${d.nombre}`]),
          }));
          const listos = items.filter((i) => i.listo).length;
          return (
            <Accordion
              key={p.programa}
              disableGutters
              elevation={0}
              TransitionProps={{ unmountOnExit: true }}
              sx={{
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg) !important',
                backgroundColor: 'var(--surface-raised)',
                '&::before': { display: 'none' },
              }}
            >
              <AccordionSummary
                expandIcon={<Icono nombre="abajo" />}
                sx={{ minHeight: 'var(--size-touch)', px: 'var(--space-4)', '& .MuiAccordionSummary-content': { alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-3)', flexWrap: 'wrap' } }}
              >
                <Typography sx={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '17px', color: 'var(--ink-strong)' }}>
                  {`${p.programa} — ${t.organisms.nombrePrograma[p.programa]}`}
                </Typography>
                <Typography sx={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'var(--ink-muted)' }}>
                  {t.organisms.checklistDocumentos.deListos(listos, items.length)}
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 'var(--space-4)', pb: 'var(--space-4)' }}>
                <ChecklistDocumentos
                  items={items}
                  onToggle={(indice) => marcarDocumento(`${p.programa}:${items[indice].nombre}`, !items[indice].listo)}
                />
              </AccordionDetails>
            </Accordion>
          );
        })}
      </Stack>
    </AppShell>
  );
}
