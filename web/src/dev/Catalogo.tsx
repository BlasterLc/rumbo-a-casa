import { Stack, Typography } from '@mui/material';
import { Simbolo } from '../components/atoms/Simbolo/Simbolo';
import { Icono, NOMBRES_ICONO } from '../components/atoms/Icono/Icono';
import { Boton } from '../components/atoms/Boton/Boton';
import { ChipFiltro, ChipEtiqueta } from '../components/atoms/Chip/Chip';
import { CampoTexto } from '../components/atoms/CampoTexto/CampoTexto';
import { SelloElegibilidad } from '../components/molecules/SelloElegibilidad/SelloElegibilidad';
import { OpcionTarjeta } from '../components/molecules/OpcionTarjeta/OpcionTarjeta';
import { Alerta } from '../components/molecules/Alerta/Alerta';
import { AvisoLimite } from '../components/molecules/AvisoLimite/AvisoLimite';
import { PasoAPaso } from '../components/molecules/PasoAPaso/PasoAPaso';
import { Pestanas } from '../components/molecules/Pestanas/Pestanas';
import { BurbujaChat } from '../components/molecules/BurbujaChat/BurbujaChat';
import { Pensando } from '../components/molecules/BurbujaChat/Pensando';
import { Franja } from '../components/organisms/Franja/Franja';
import { Logotipo } from '../components/organisms/Logotipo/Logotipo';
import { CabeceraApp } from '../components/organisms/CabeceraApp/CabeceraApp';
import { BarraInferior } from '../components/organisms/BarraInferior/BarraInferior';
import { BloqueHero } from '../components/organisms/BloqueHero/BloqueHero';

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

      <section>
        <Typography variant="overline">Chip</Typography>
        <Stack direction="row" spacing={1.5} sx={{ mt: 2, flexWrap: 'wrap' }}>
          <ChipFiltro label="Todos" activo />
          <ChipFiltro label="Arriendo" />
          <ChipFiltro label="Sin crédito" />
          <ChipEtiqueta label="Región del Biobío" />
          <ChipEtiqueta label="Tramo 40%" />
        </Stack>
      </section>

      <section>
        <Typography variant="overline">CampoTexto</Typography>
        <Stack spacing={3} sx={{ mt: 2 }}>
          <CampoTexto
            pregunta="¿Cuántas personas viven contigo?"
            ayuda="Con esto vemos si entras en el 40% del Registro Social de Hogares."
            value=""
            onChange={() => {}}
          />
          <CampoTexto
            pregunta="¿Cuánto tienes ahorrado?"
            equivalencia="12,3 UF"
            value="500000"
            inputMode="numeric"
            onChange={() => {}}
          />
          <CampoTexto pregunta="¿En qué región vives?" dictado value="" onChange={() => {}} />
          <CampoTexto
            pregunta="¿Cuál es tu correo?"
            error="Escribe un correo con arroba, por ejemplo nombre@correo.cl."
            value="no-es-un-correo"
            onChange={() => {}}
          />
        </Stack>
      </section>

      <section>
        <Typography variant="overline">SelloElegibilidad</Typography>
        <Stack direction="row" spacing={1.5} sx={{ mt: 2, flexWrap: 'wrap' }}>
          <SelloElegibilidad estado="califica" programa="DS49" />
          <SelloElegibilidad estado="falta" programa="DS1" />
          <SelloElegibilidad estado="posible" programa="DS19" />
          <SelloElegibilidad estado="noAplica" programa="DS52" />
        </Stack>
        <Stack direction="row" spacing={1.5} sx={{ mt: 2, alignItems: 'center' }}>
          <SelloElegibilidad estado="califica" compacto />
          <SelloElegibilidad estado="falta" compacto />
        </Stack>
      </section>

      <section>
        <Typography variant="overline">OpcionTarjeta</Typography>
        <div style={{ marginTop: 16 }}>
          <OpcionTarjeta
            pregunta="¿Dónde vives hoy?"
            name="vivienda-catalogo"
            value="allegado"
            opciones={[
              { value: 'allegado', titulo: 'Vivo de allegado', detalle: 'En la casa de un familiar, sin contrato.' },
              { value: 'arriendo', titulo: 'Arriendo', detalle: 'Pago arriendo mensual.' },
              { value: 'sitio_propio', titulo: 'Tengo sitio propio', detalle: 'Un terreno a mi nombre, sin construir.' },
              { value: 'no_seguro', titulo: 'No estoy seguro' },
            ]}
          />
        </div>
      </section>

      <section>
        <Typography variant="overline">Alerta</Typography>
        <Stack spacing={2} sx={{ mt: 2 }}>
          <Alerta severity="info" accion="Ver mi plan">Calificas para DS49.</Alerta>
          <Alerta severity="success" titulo="Documento listo">Guardamos tu certificado del RSH.</Alerta>
          <Alerta severity="warning">El llamado del DS1 cierra el 28 de octubre. Te faltan 2 documentos.</Alerta>
          <Alerta severity="error">Este llamado ya cerró.</Alerta>
        </Stack>
      </section>

      <section>
        <Typography variant="overline">AvisoLimite</Typography>
        <Stack spacing={2} sx={{ mt: 2 }}>
          <AvisoLimite />
          <AvisoLimite conSalida />
        </Stack>
      </section>

      <section>
        <Typography variant="overline">PasoAPaso</Typography>
        <div style={{ marginTop: 16 }}>
          <PasoAPaso pasos={['Familia', 'Vivienda', 'Ahorro', 'Ingreso', 'Región']} activo={2} onActivarPaso={() => {}} />
        </div>
      </section>

      <section>
        <Typography variant="overline">Pestanas</Typography>
        <div style={{ marginTop: 16 }}>
          <Pestanas
            etiquetaAria="Filtrar resultados"
            pestanas={[
              { valor: 'califica', etiqueta: 'Calificas', cuenta: 2 },
              { valor: 'falta', etiqueta: 'Te falta', cuenta: 1 },
              { valor: 'no_aplica', etiqueta: 'No aplica', cuenta: 1 },
            ]}
          />
        </div>
      </section>

      <section>
        <Typography variant="overline">BurbujaChat y Pensando</Typography>
        <Stack spacing={2} sx={{ mt: 2 }}>
          <BurbujaChat autor="agente" escuchable porQue>
            ¿Cuántas personas viven contigo, sin contarte a ti?
          </BurbujaChat>
          <BurbujaChat autor="persona" dictado>
            Vivimos mi pareja, mi hijo y yo.
          </BurbujaChat>
          <Pensando>Revisando el llamado de noviembre del DS1</Pensando>
        </Stack>
      </section>

      <section>
        <Typography variant="overline">Logotipo</Typography>
        <Stack spacing={3} sx={{ mt: 2 }}>
          <Logotipo disposicion="horizontal" alto={40} />
          <div style={{ background: '#123a6b', padding: 16, borderRadius: 12, display: 'inline-block' }}>
            <Logotipo disposicion="horizontal" alto={32} tono="claro" />
          </div>
          <Logotipo disposicion="vertical" alto={48} />
        </Stack>
      </section>

      <section>
        <Typography variant="overline">Franja</Typography>
        <Stack spacing={2} sx={{ mt: 2 }}>
          <Franja tono="brand" alto={96} />
          <Franja tono="accent" alto={96} />
          <Franja tono="brand" alto={24} />
        </Stack>
      </section>

      <section>
        <Typography variant="overline">BarraInferior</Typography>
        <div style={{ margin: '16px -20px 0', maxWidth: 360 }}>
          <BarraInferior value="plan" avisos={2} onChange={() => {}} />
        </div>
      </section>

      <section>
        <Typography variant="overline">BloqueHero</Typography>
        <div style={{ marginTop: 16 }}>
          <BloqueHero
            titulo="Averigua a qué subsidio de vivienda puedes postular"
            bajada="Cuéntanos de tu familia en unos 5 minutos."
            chips={['DS49', 'DS1', 'DS19', 'DS52']}
          />
        </div>
      </section>

      <section>
        <Typography variant="overline">CabeceraApp</Typography>
        <div style={{ margin: '16px -20px 0', maxWidth: 360 }}>
          <CabeceraApp titulo="Tu plan para DS49" atras conFranja />
        </div>
      </section>
    </Stack>
  );
}
