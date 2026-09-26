import type { Perfil } from '../types/dominio';

/**
 * Familia ficticia para el modo demo: un perfil completo (ningún campo 'desconocido'), para que
 * los 4 programas queden con una determinación real del motor de reglas — nunca datos de una
 * persona real, y nunca un resultado inventado a mano.
 */
export const PERFIL_DEMO: Perfil = {
  postulanteEdad: 29,
  region: 'Metropolitana',
  zonaEspecial: 'ninguna',
  tramoRSH: 30,
  tienePropiedad: false,
  ahorroUF: 15,
  antiguedadCuentaAhorroMeses: 14,
  ingresoFamiliarMensualUF: 12.69,
  ingresoFamiliarMensualCLP: 520000,
  integrantesGrupoFamiliar: [
    { edad: 31, discapacidadCertificada: false },
    { edad: 4, discapacidadCertificada: false },
  ],
  excepcionPostulacionIndividualDS49: false,
  subsidioPrevio: 'ninguno',
  objetivo: 'comprar',
};
