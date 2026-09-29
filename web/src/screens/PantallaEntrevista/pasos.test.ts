import { describe, it, expect } from 'vitest';
import { GRUPOS_ENTREVISTA, pasoActivo } from './pasos';
import { PERFIL_DESCONOCIDO, evaluarTodosLosProgramas, type Perfil } from '../../types/dominio';

describe('pasoActivo', () => {
  it('cubre los 13 campos del perfil entre los 5 grupos, sin dejar ninguno fuera', () => {
    const todos = GRUPOS_ENTREVISTA.flatMap((g) => g.campos);
    expect(new Set(todos).size).toBe(13);
  });

  it('cada grupo tiene una clave única de las 5 que espera el diccionario', () => {
    const claves = GRUPOS_ENTREVISTA.map((g) => g.clave);
    expect(claves).toEqual(['familia', 'vivienda', 'ahorro', 'ingreso', 'region']);
  });

  it('sin resultados del motor todavía (sesión nueva), el paso activo es el primero', () => {
    expect(pasoActivo(PERFIL_DESCONOCIDO, [])).toBe(0);
  });

  it('con el perfil vacío, el motor pide todo y el paso activo es el primero', () => {
    expect(pasoActivo(PERFIL_DESCONOCIDO, evaluarTodosLosProgramas(PERFIL_DESCONOCIDO, 'es'))).toBe(0);
  });

  it('avanza según lo que el motor todavía necesita, no según todos los campos del perfil', () => {
    const perfil: Perfil = {
      ...PERFIL_DESCONOCIDO,
      postulanteEdad: 34,
      integrantesGrupoFamiliar: [{ edad: 33, discapacidadCertificada: false }],
      tienePropiedad: false,
      objetivo: 'comprar',
      subsidioPrevio: 'ninguno',
    };
    // Falta el ahorro: el motor lo pide, así que el paso activo es "ahorro" (índice 2).
    expect(pasoActivo(perfil, evaluarTodosLosProgramas(perfil, 'es'))).toBe(2);
  });

  it('con el perfil de una corrida real (3 campos sin conocer pero los 4 veredictos dados), llega al último paso', () => {
    // zonaEspecial, ingresoFamiliarMensualCLP y excepcionPostulacionIndividualDS49 siguen en
    // 'desconocido', y aun así el motor decide los cuatro programas: no hay nada más que preguntar.
    const perfil: Perfil = {
      ...PERFIL_DESCONOCIDO,
      postulanteEdad: 34,
      integrantesGrupoFamiliar: [
        { edad: 33, discapacidadCertificada: false },
        { edad: 8, discapacidadCertificada: false },
        { edad: 5, discapacidadCertificada: false },
      ],
      tienePropiedad: false,
      objetivo: 'comprar',
      subsidioPrevio: 'ninguno',
      ahorroUF: 12,
      antiguedadCuentaAhorroMeses: 18,
      ingresoFamiliarMensualUF: 22,
      tramoRSH: 40,
      region: 'Metropolitana',
    };
    const resultados = evaluarTodosLosProgramas(perfil, 'es');
    expect(resultados.every((r) => r.estado !== 'falta_dato')).toBe(true);
    expect(pasoActivo(perfil, resultados)).toBe(4);
  });
});
