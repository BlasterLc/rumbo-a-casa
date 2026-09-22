import { describe, it, expect } from 'vitest';
import { evaluarTodosLosProgramas } from '../../src/rules-engine/index';
import type { Perfil } from '../../src/rules-engine/perfil.schema';

const perfilElegibleEnTodo: Perfil = {
  postulanteEdad: 30,
  region: 'Metropolitana',
  zonaEspecial: 'ninguna',
  tramoRSH: 35, // ≤40, cubre DS49, DS1-T1, DS19-B
  tienePropiedad: false,
  ahorroUF: 30, // ≥10 (DS49), ≥30 (DS1-T1), ≥4 (DS52)
  antiguedadCuentaAhorroMeses: 12,
  ingresoFamiliarMensualUF: 15, // dentro de 7-25
  ingresoFamiliarMensualCLP: 900000,
  integrantesGrupoFamiliar: [{ edad: 28, discapacidadCertificada: false }],
  excepcionPostulacionIndividualDS49: false,
  subsidioPrevio: 'ninguno',
  objetivo: 'comprar',
};

describe('evaluarTodosLosProgramas', () => {
  it('devuelve un resultado por cada uno de los 4 programas', () => {
    const resultados = evaluarTodosLosProgramas(perfilElegibleEnTodo);
    expect(resultados).toHaveLength(4);
    expect(resultados.map((r) => r.programa).sort()).toEqual(['DS1', 'DS19', 'DS49', 'DS52']);
  });

  it('un perfil que cumple los 4 sale elegible en los 4', () => {
    const resultados = evaluarTodosLosProgramas(perfilElegibleEnTodo);
    expect(resultados.every((r) => r.estado === 'elegible')).toBe(true);
  });

  it('un perfil con datos incompletos devuelve falta_dato donde corresponda', () => {
    const resultados = evaluarTodosLosProgramas({ ...perfilElegibleEnTodo, ahorroUF: 'desconocido' });
    expect(resultados.every((r) => r.estado === 'falta_dato' || r.programa === 'DS19')).toBe(true);
  });
});
