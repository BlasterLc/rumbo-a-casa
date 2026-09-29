import { describe, it, expect } from 'vitest';
import { PERFIL_DEMO } from './perfilDemo';
import { evaluarTodosLosProgramas } from '../types/dominio';

describe('PERFIL_DEMO', () => {
  it('es un perfil completo: el motor de reglas decide los 4 programas, sin falta_dato', () => {
    const resultados = evaluarTodosLosProgramas(PERFIL_DEMO);
    expect(resultados).toHaveLength(4);
    expect(resultados.every((r) => r.estado !== 'falta_dato')).toBe(true);
  });
});
