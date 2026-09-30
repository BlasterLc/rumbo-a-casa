import { useEffect, useRef, useState } from 'react';
import { Stack, Box } from '@mui/material';
import { AppShell } from '../../components/templates/AppShell/AppShell';
import { PasoAPaso } from '../../components/molecules/PasoAPaso/PasoAPaso';
import { BurbujaChat } from '../../components/molecules/BurbujaChat/BurbujaChat';
import { Pensando } from '../../components/molecules/BurbujaChat/Pensando';
import { SelloElegibilidad } from '../../components/molecules/SelloElegibilidad/SelloElegibilidad';
import { Alerta } from '../../components/molecules/Alerta/Alerta';
import { CampoTexto } from '../../components/atoms/CampoTexto/CampoTexto';
import { Boton } from '../../components/atoms/Boton/Boton';
import { TextoConNegritas } from '../../components/atoms/TextoConNegritas/TextoConNegritas';
import { useSesion } from '../../state/SesionContext';
import { useT } from '../../i18n/LocaleContext';
import { useEscritorio } from '../../lib/useEscritorio';
import { mapEstado } from '../../lib/estado';
import { GRUPOS_ENTREVISTA, pasoActivo } from './pasos';

const LIMITE_MENSAJE = 2000;

/**
 * Segunda de las cinco pantallas: la conversación donde se recogen los datos. Bloquea mensajes
 * inválidos antes de llamar al backend y ofrece el modo demo si el asistente falla. En móvil
 * el avance va arriba y el campo de texto queda fijo al pie; en escritorio la conversación
 * tiene su propio scroll, el campo queda anclado bajo ella y el avance vive en un panel lateral.
 */
export function PantallaEntrevista() {
  const { transcript, eventos, perfil, resultados, cargando, error, esDemo, enviarTurno, activarDemo, borrarDatos } =
    useSesion();
  const t = useT();
  const escritorio = useEscritorio();
  const [borrador, setBorrador] = useState('');
  const registroRef = useRef<HTMLDivElement>(null);

  const mensajeValido = borrador.trim().length > 0 && borrador.length <= LIMITE_MENSAJE;

  const enviar = () => {
    if (!mensajeValido || cargando) return;
    const texto = borrador;
    setBorrador('');
    void enviarTurno(texto);
  };

  // En escritorio el registro tiene scroll propio: al llegar un mensaje se baja al último.
  useEffect(() => {
    const registro = registroRef.current;
    if (escritorio && registro) registro.scrollTop = registro.scrollHeight;
  }, [escritorio, transcript.length, eventos.length, cargando]);

  const indicador = (orientacion: 'horizontal' | 'vertical') => (
    <PasoAPaso
      pasos={GRUPOS_ENTREVISTA.map((g) => t.pantallas.entrevista.pasos[g.clave])}
      activo={pasoActivo(perfil, resultados)}
      orientacion={orientacion}
    />
  );

  const conversacion = (
    <>
      {transcript.length === 0 && (
        <BurbujaChat autor="agente" escuchable textoHablado={t.pantallas.entrevista.mensajeBienvenida}>
          <TextoConNegritas texto={t.pantallas.entrevista.mensajeBienvenida} />
        </BurbujaChat>
      )}
      {transcript.map((turno) => (
        <BurbujaChat
          key={turno.id}
          autor={turno.autor}
          escuchable={turno.autor === 'agente'}
          textoHablado={turno.texto}
          dictado={turno.dictado}
        >
          {turno.autor === 'agente' ? <TextoConNegritas texto={turno.texto} /> : turno.texto}
        </BurbujaChat>
      ))}
      {eventos.map((evento) => (
        <SelloElegibilidad key={evento.id} estado={mapEstado(evento.estado)} programa={evento.programa} />
      ))}
      {cargando && <Pensando>{t.pantallas.entrevista.pensando}</Pensando>}
    </>
  );

  const alerta = error && (
    <Alerta
      severity={error.codigo === 'limite_mensajes' ? 'warning' : 'error'}
      accion={error.codigo === 'asistente_no_disponible' ? t.pantallas.entrevista.probarModoDemo : undefined}
      onAccion={() => activarDemo()}
    >
      {error.mensaje ?? t.pantallas.entrevista.errorGenerico}
    </Alerta>
  );

  // En modo demo no hay a quién escribirle: en vez del campo de mensaje se dice dónde se está y se
  // ofrece salir a una conversación real (borrarDatos deja una sesión nueva).
  const avisoDemo = (
    <Alerta
      severity="info"
      titulo={t.pantallas.entrevista.modoDemoTitulo}
      accion={t.pantallas.entrevista.salirModoDemo}
      onAccion={borrarDatos}
    >
      {t.pantallas.entrevista.modoDemoAviso}
    </Alerta>
  );

  const campo = esDemo ? (
    avisoDemo
  ) : (
    <Stack
      component="form"
      onSubmit={(e) => {
        e.preventDefault();
        enviar();
      }}
      direction="row"
      spacing={1}
      alignItems="flex-end"
    >
      <Box sx={{ flex: 1 }}>
        <CampoTexto
          pregunta={t.pantallas.entrevista.preguntaMensaje}
          value={borrador}
          onChange={(e) => setBorrador(e.target.value)}
          error={
            borrador.length > LIMITE_MENSAJE ? t.pantallas.entrevista.limiteCaracteres(LIMITE_MENSAJE) : undefined
          }
        />
      </Box>
      <Boton type="submit" loading={cargando} disabled={!mensajeValido}>
        {t.pantallas.entrevista.enviar}
      </Boton>
    </Stack>
  );

  if (escritorio) {
    return (
      <AppShell titulo={t.pantallas.entrevista.titulo} destino="hablar">
        {/* Entre 900 px (donde arranca el sidebar de escritorio) y 1200 px no hay ancho para un
            aside fijo de 340 px sin ahogar el chat: la columna del avance se apila debajo hasta
            `lg` (1200 px) y recién ahí se separa en dos columnas. */}
        <Box
          sx={{
            display: 'grid',
            width: '100%',
            gridTemplateColumns: { xs: 'minmax(0, 1fr)', lg: 'minmax(0, 1fr) 340px' },
            columnGap: { lg: 'var(--space-7)' },
            rowGap: 'var(--space-5)',
            alignItems: 'start',
          }}
        >
          <Stack spacing={2} sx={{ height: 'max(480px, calc(100dvh - var(--size-header) - 240px))', minHeight: 0 }}>
            <Stack
              ref={registroRef}
              role="log"
              aria-label={t.pantallas.entrevista.etiquetaConversacion}
              spacing={2}
              sx={{ flex: 1, minHeight: 0, overflowY: 'auto', pr: 1, '& > *': { flexShrink: 0 } }}
            >
              {conversacion}
            </Stack>
            {alerta}
            <Box
              sx={{
                flex: 'none',
                p: 1.5,
                backgroundColor: 'var(--surface-raised)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-md)',
              }}
            >
              {campo}
            </Box>
          </Stack>
          <Stack
            component="aside"
            aria-label={t.pantallas.entrevista.etiquetaAvance}
            spacing={3}
            sx={{ position: { lg: 'sticky' }, top: { lg: 'calc(var(--size-header) + var(--space-5))' } }}
          >
            <Box
              sx={{
                p: 'var(--space-5)',
                backgroundColor: 'var(--surface-raised)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              {indicador('vertical')}
            </Box>
          </Stack>
        </Box>
      </AppShell>
    );
  }

  return (
    <AppShell titulo={t.pantallas.entrevista.titulo} destino="hablar">
      <Stack spacing={3}>
        {indicador('horizontal')}
        <Stack spacing={2}>{conversacion}</Stack>
        {alerta}
        <Box sx={{ position: 'sticky', bottom: 'var(--size-touch)', backgroundColor: 'var(--surface-raised)', pt: 2 }}>
          {campo}
        </Box>
      </Stack>
    </AppShell>
  );
}
