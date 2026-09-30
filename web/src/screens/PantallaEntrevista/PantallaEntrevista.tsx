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
  const finRef = useRef<HTMLDivElement>(null);
  const [panelAbierto, setPanelAbierto] = useState(true);

  const mensajeValido = borrador.trim().length > 0 && borrador.length <= LIMITE_MENSAJE;

  const enviar = () => {
    if (!mensajeValido || cargando) return;
    const texto = borrador;
    setBorrador('');
    void enviarTurno(texto);
  };

  // En escritorio solo hace scroll la página: al llegar un mensaje se baja hasta el final de la conversación.
  useEffect(() => {
    if (escritorio) finRef.current?.scrollIntoView?.({ block: 'end' });
  }, [escritorio, transcript.length, eventos.length, cargando]);

  const indicador = (orientacion: 'horizontal' | 'vertical') => (
    <PasoAPaso
      pasos={GRUPOS_ENTREVISTA.map((g) => t.pantallas.entrevista.pasos[g.clave])}
      activo={pasoActivo(perfil, resultados)}
      orientacion={orientacion}
    />
  );

  // En escritorio los sellos viven en el panel lateral; en móvil van dentro de la conversación.
  const sellos = eventos.map((evento) => (
    <SelloElegibilidad key={evento.id} estado={mapEstado(evento.estado)} programa={evento.programa} />
  ));

  const conversacion = (conSellos: boolean) => (
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
      {conSellos && sellos}
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
      accionAbajo
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
          error={borrador.length > LIMITE_MENSAJE ? t.pantallas.entrevista.limiteCaracteres(LIMITE_MENSAJE) : undefined}
        />
      </Box>
      <Boton type="submit" loading={cargando} disabled={!mensajeValido}>
        {t.pantallas.entrevista.enviar}
      </Boton>
    </Stack>
  );

  if (escritorio) {
    return (
      <AppShell titulo={t.pantallas.entrevista.titulo} destino="hablar" anchoCompleto tituloVisible={false}>
        {/* Entre 900 px (donde arranca el sidebar de escritorio) y 1200 px no hay ancho para un
            aside fijo de 340 px sin ahogar el chat: la columna del avance se apila debajo hasta
            `lg` (1200 px) y recién ahí se separa en dos columnas. */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
          <Boton variant="text" onClick={() => setPanelAbierto((abierto) => !abierto)} aria-expanded={panelAbierto}>
            {panelAbierto ? t.pantallas.entrevista.ocultarAvance : t.pantallas.entrevista.mostrarAvance}
          </Boton>
        </Box>
        <Box
          sx={{
            display: 'grid',
            width: '100%',
            gridTemplateColumns: {
              xs: 'minmax(0, 1fr)',
              lg: panelAbierto ? 'minmax(0, 1fr) 340px' : 'minmax(0, 1fr)',
            },
            columnGap: { lg: 'var(--space-7)' },
            rowGap: 'var(--space-4)',
            alignItems: 'start',
          }}
        >
          <Stack
            spacing={2}
            sx={{
              width: '100%',
              maxWidth: 760,
              mx: 'auto',
            }}
          >
            <Stack
              role="log"
              aria-label={t.pantallas.entrevista.etiquetaConversacion}
              spacing={2}
              sx={{ pr: 1 }}
            >
              {conversacion(false)}
            </Stack>
            <Box ref={finRef} />
            {alerta}
            {/* En demo no hay campo de mensaje: el aviso se va al panel del avance, debajo de los
                pasos, y la conversación crece libre con el scroll de la página. */}
            {!esDemo && (
              <Box sx={{ position: 'sticky', bottom: 0, pb: 'var(--space-4)', backgroundColor: 'var(--surface-base)' }}>
                <Box
                  sx={{
                    p: 1.5,
                    backgroundColor: 'var(--surface-raised)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-md)',
                  }}
                >
                  {campo}
                </Box>
              </Box>
            )}
          </Stack>
          {panelAbierto && (
            <Stack
              component="aside"
              aria-label={t.pantallas.entrevista.etiquetaAvance}
              spacing={2}
              sx={{
                position: { lg: 'sticky' },
                top: { lg: 'calc(var(--size-header) + var(--space-5))' },
                // Si la ventana es muy baja el panel no cabe: solo entonces tiene su propio scroll.
                maxHeight: { lg: 'calc(100dvh - var(--size-header) - var(--space-5) - var(--space-4))' },
                '@media (max-height: 700px)': { overflowY: 'auto' },
              }}
            >
              <Box
                sx={{
                  p: 'var(--space-3) var(--space-4)',
                  backgroundColor: 'var(--surface-raised)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                {indicador('vertical')}
              </Box>
              {esDemo && avisoDemo}
              {eventos.length > 0 && (
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                    gap: 1,
                    '& .MuiChip-root': { width: '100%' },
                  }}
                >
                  {eventos.map((evento) => (
                    <SelloElegibilidad key={evento.id} estado={mapEstado(evento.estado)} programa={evento.programa} compacto />
                  ))}
                </Box>
              )}
            </Stack>
          )}
        </Box>
      </AppShell>
    );
  }

  return (
    <AppShell titulo={t.pantallas.entrevista.titulo} destino="hablar">
      <Stack spacing={3}>
        {indicador('horizontal')}
        <Stack spacing={2}>{conversacion(true)}</Stack>
        {alerta}
        <Box
          sx={{
            position: 'sticky',
            bottom: 'var(--size-touch)',
            backgroundColor: 'var(--surface-raised)',
            pt: 2,
          }}
        >
          {campo}
        </Box>
      </Stack>
    </AppShell>
  );
}
