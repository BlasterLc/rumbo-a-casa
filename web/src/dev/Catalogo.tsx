import { Stack, Typography } from '@mui/material';
import { Simbolo } from '../components/atoms/Simbolo/Simbolo';
import { Icono, NOMBRES_ICONO } from '../components/atoms/Icono/Icono';
import { Boton } from '../components/atoms/Boton/Boton';

/**
 * Página interna de verificación visual, no es parte del flujo de la persona — sus títulos de
 * sección quedan en español fijo a propósito, fuera del diccionario de idioma.
 * Cada tarea de componente agrega aquí su propia sección, en orden de construcción.
 */
export function Catalogo() {
  return (
    <Stack spacing={6} sx={{ p: 5, maxWidth: 420, mx: 'auto' }}>
      <Typography variant="h2">Catálogo Rumbo a Casa</Typography>

      <section>
        <Typography variant="overline">Simbolo</Typography>
        <Stack direction="row" spacing={4} sx={{ mt: 2, alignItems: 'center' }}>
          <Simbolo tamano={48} />
          <div style={{ background: '#123a6b', padding: 12, borderRadius: 12 }}>
            <Simbolo tamano={48} tono="claro" />
          </div>
          <Simbolo tamano={48} tono="mono" />
        </Stack>
      </section>

      <section>
        <Typography variant="overline">Icono</Typography>
        <Stack direction="row" spacing={3} sx={{ mt: 2, flexWrap: 'wrap' }}>
          {NOMBRES_ICONO.map((nombre) => (
            <Stack key={nombre} alignItems="center" spacing={0.5}>
              <Icono nombre={nombre} />
              <Typography variant="caption">{nombre}</Typography>
            </Stack>
          ))}
        </Stack>
      </section>

      <section>
        <Typography variant="overline">Boton</Typography>
        <Stack spacing={2} sx={{ mt: 2, maxWidth: 320 }}>
          <Boton>Ver mi plan</Boton>
          <Boton variant="outlined">Ver el detalle</Boton>
          <Boton variant="outlined" color="secondary" icono="mic">Contar hablando</Boton>
          <Boton variant="text">Ahora no</Boton>
          <Boton icono="externo">Ir a postulacionenlinea.minvu.cl</Boton>
          <Boton loading>Guardando…</Boton>
        </Stack>
      </section>
    </Stack>
  );
}
