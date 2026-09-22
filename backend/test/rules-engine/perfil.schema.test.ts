import { describe, it, expect } from 'vitest';
import { PerfilSchema } from '../../src/rules-engine/perfil.schema';

const perfilCompleto = {
  postulanteEdad: 30,
  region: 'Metropolitana',
  zonaEspecial: 'ninguna',
  tramoRSH: 35,
  tienePropiedad: false,
  ahorroUF: 12,
  antiguedadCuentaAhorroMeses: 12,
  ingresoFamiliarMensualUF: 20,
  ingresoFamiliarMensualCLP: 900000,
  integrantesGrupoFamiliar: [{ edad: 28, discapacidadCertificada: false }],
  excepcionPostulacionIndividualDS49: false,
  subsidioPrevio: 'ninguno',
  objetivo: 'comprar',
};

describe('PerfilSchema', () => {
  it('acepta un perfil completo y válido', () => {
    expect(() => PerfilSchema.parse(perfilCompleto)).not.toThrow();
  });

  it('acepta "desconocido" en cualquier campo', () => {
    const perfilParcial = { ...perfilCompleto, tramoRSH: 'desconocido', ahorroUF: 'desconocido' };
    expect(() => PerfilSchema.parse(perfilParcial)).not.toThrow();
  });

  it('rechaza un tramoRSH fuera de rango', () => {
    expect(() => PerfilSchema.parse({ ...perfilCompleto, tramoRSH: 150 })).toThrow();
  });

  it('rechaza una región inválida', () => {
    expect(() => PerfilSchema.parse({ ...perfilCompleto, region: 'Marte' })).toThrow();
  });
});
