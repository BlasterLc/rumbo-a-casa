import { describe, it, expect } from 'vitest';
import { IDIOMAS, IDIOMA_POR_DEFECTO, evaluarTodosLosProgramas } from '../../src/rules-engine/index';
import { generarPlanPapeles } from '../../src/chat/papeles';
import { ejecutarHerramienta } from '../../src/chat/herramientas';
import { PERFIL_VACIO } from '../../src/chat/perfil';

describe('idioma', () => {
  it('los idiomas admitidos son es y en, y el español es el de por defecto', () => {
    expect(IDIOMAS).toEqual(['es', 'en']);
    expect(IDIOMA_POR_DEFECTO).toBe('es');
  });

  it('evaluarTodosLosProgramas acepta el idioma como segundo argumento opcional', () => {
    const sin = evaluarTodosLosProgramas(PERFIL_VACIO).map((r) => r.estado);
    const en = evaluarTodosLosProgramas(PERFIL_VACIO, 'en').map((r) => r.estado);
    expect(en).toEqual(sin);
  });

  it('generarPlanPapeles acepta el idioma como segundo argumento opcional', () => {
    const resultados = evaluarTodosLosProgramas(PERFIL_VACIO);
    expect(generarPlanPapeles(resultados, 'en').map((p) => p.programa)).toEqual(
      generarPlanPapeles(resultados).map((p) => p.programa),
    );
  });

  it('ejecutarHerramienta acepta el idioma como cuarto argumento opcional', () => {
    const r = ejecutarHerramienta('evaluar_elegibilidad', {}, PERFIL_VACIO, 'en');
    expect(r.error).toBe(false);
    expect((r.salida.resultados as unknown[]).length).toBe(4);
  });
});
