import { useState } from 'react';
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
import { mapEstado } from '../../lib/estado';
import { PERFIL_DEMO } from '../../lib/perfilDemo';
import { GRUPOS_ENTREVISTA, pasoActivo } from './pasos';

const LIMITE_MENSAJE = 2000;

/**
 * Segunda de las cinco pantallas: la conversación donde se recogen los datos. Bloquea mensajes
 * inválidos antes de llamar al backend y ofrece el modo demo si el asistente falla.
 */
export function PantallaEntrevista() {
  const { transcript, eventos, perfil, resultados, cargando, error, enviarTurno, activarDemo } = useSesion();
  const t = useT();
  const [borrador, setBorrador] = useState('');

  const mensajeValido = borrador.trim().length > 0 && borrador.length <= LIMITE_MENSAJE;

  const enviar = () => {
    if (!mensajeValido || cargando) return;
    const texto = borrador;
    setBorrador('');
    void enviarTurno(texto);
  };

  return (
    <AppShell titulo={t.pantallas.entrevista.titulo} destino="hablar">
      <Stack spacing={3}>
        <PasoAPaso
          pasos={GRUPOS_ENTREVISTA.map((g) => t.pantallas.entrevista.pasos[g.clave])}
          activo={pasoActivo(perfil, resultados)}
        />

        <Stack spacing={2}>
          {transcript.map((turno) => (
            <BurbujaChat
              key={turno.id}
              autor={turno.autor}
              escuchable={turno.autor === 'agente'}
              dictado={turno.dictado}
            >
              {turno.autor === 'agente' ? <TextoConNegritas texto={turno.texto} /> : turno.texto}
            </BurbujaChat>
          ))}
          {eventos.map((evento) => (
            <SelloElegibilidad key={evento.id} estado={mapEstado(evento.estado)} programa={evento.programa} />
          ))}
          {cargando && <Pensando>{t.pantallas.entrevista.pensando}</Pensando>}
        </Stack>

        {error && (
          <Alerta
            severity={error.codigo === 'limite_mensajes' ? 'warning' : 'error'}
            accion={error.codigo === 'asistente_no_disponible' ? t.pantallas.entrevista.probarModoDemo : undefined}
            onAccion={() => activarDemo(PERFIL_DEMO)}
          >
            {error.mensaje ?? t.pantallas.entrevista.errorGenerico}
          </Alerta>
        )}

        <Box sx={{ position: 'sticky', bottom: 'var(--size-touch)', backgroundColor: 'var(--surface-raised)', pt: 2 }}>
          <Stack direction="row" spacing={1} alignItems="flex-end">
            <Box sx={{ flex: 1 }}>
              <CampoTexto
                pregunta={t.pantallas.entrevista.preguntaMensaje}
                value={borrador}
                onChange={(e) => setBorrador(e.target.value)}
                dictado
                error={
                  borrador.length > LIMITE_MENSAJE
                    ? t.pantallas.entrevista.limiteCaracteres(LIMITE_MENSAJE)
                    : undefined
                }
              />
            </Box>
            <Boton onClick={enviar} loading={cargando} disabled={!mensajeValido}>
              {t.pantallas.entrevista.enviar}
            </Boton>
          </Stack>
        </Box>
      </Stack>
    </AppShell>
  );
}
