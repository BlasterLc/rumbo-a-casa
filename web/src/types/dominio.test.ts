import { describe, it, expect } from 'vitest';
import { evaluarTodosLosProgramas, generarPlanPapeles, PERFIL_DESCONOCIDO } from './dominio';

describe('tipos y motor de reglas compartidos con el backend', () => {
  it('evalúa los 4 programas con un perfil vacío y todos quedan en falta_dato', () => {
    const resultados = evaluarTodosLosProgramas(PERFIL_DESCONOCIDO);
    expect(resultados).toHaveLength(4);
    expect(resultados.every((r) => r.estado === 'falta_dato')).toBe(true);
  });

  it('un plan sin programas elegibles queda vacío', () => {
    const resultados = evaluarTodosLosProgramas(PERFIL_DESCONOCIDO);
    expect(generarPlanPapeles(resultados)).toEqual([]);
  });
});
