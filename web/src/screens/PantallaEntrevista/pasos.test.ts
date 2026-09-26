import { describe, it, expect } from 'vitest';
import { GRUPOS_ENTREVISTA, pasoActivo } from './pasos';
import { PERFIL_DESCONOCIDO } from '../../types/dominio';

describe('pasoActivo', () => {
  it('cubre los 13 campos del perfil entre los 5 grupos, sin dejar ninguno fuera', () => {
    const todos = GRUPOS_ENTREVISTA.flatMap((g) => g.campos);
    expect(new Set(todos).size).toBe(13);
  });

  it('cada grupo tiene una clave única de las 5 que espera el diccionario', () => {
    const claves = GRUPOS_ENTREVISTA.map((g) => g.clave);
    expect(claves).toEqual(['familia', 'vivienda', 'ahorro', 'ingreso', 'region']);
  });

  it('con el perfil vacío, el paso activo es el primero', () => {
    expect(pasoActivo(PERFIL_DESCONOCIDO)).toBe(0);
  });

  it('cuando el primer grupo está completo, avanza al segundo', () => {
    const perfil = {
      ...PERFIL_DESCONOCIDO,
      postulanteEdad: 29,
      integrantesGrupoFamiliar: [],
      excepcionPostulacionIndividualDS49: false as const,
    };
    expect(pasoActivo(perfil)).toBe(1);
  });

  it('con todos los campos conocidos, se queda en el último paso', () => {
    const perfil = {
      postulanteEdad: 29,
      region: 'Metropolitana' as const,
      zonaEspecial: 'ninguna' as const,
      tramoRSH: 30,
      tienePropiedad: false as const,
      ahorroUF: 15,
      antiguedadCuentaAhorroMeses: 14,
      ingresoFamiliarMensualUF: 12.69,
      ingresoFamiliarMensualCLP: 520000,
      integrantesGrupoFamiliar: [],
      excepcionPostulacionIndividualDS49: false as const,
      subsidioPrevio: 'ninguno' as const,
      objetivo: 'comprar' as const,
    };
    expect(pasoActivo(perfil)).toBe(4);
  });
});
