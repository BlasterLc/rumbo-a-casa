import { describe, it, expect } from 'vitest';
import { IDIOMAS, IDIOMA_POR_DEFECTO, evaluarTodosLosProgramas } from '../../src/rules-engine/index';
import { generarPlanPapeles } from '../../src/chat/papeles';
import { ejecutarHerramienta } from '../../src/chat/herramientas';
import { PERFIL_VACIO } from '../../src/chat/perfil';
import type { Perfil } from '../../src/rules-engine/index';

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

const base: Perfil = {
  postulanteEdad: 30,
  region: 'Metropolitana',
  zonaEspecial: 'ninguna',
  tramoRSH: 35,
  tienePropiedad: false,
  ahorroUF: 30,
  antiguedadCuentaAhorroMeses: 12,
  ingresoFamiliarMensualUF: 15,
  ingresoFamiliarMensualCLP: 900000,
  integrantesGrupoFamiliar: [{ edad: 28, discapacidadCertificada: false }],
  excepcionPostulacionIndividualDS49: false,
  subsidioPrevio: 'ninguno',
  objetivo: 'comprar',
};

const PERFILES: Record<string, Perfil> = {
  vacío: PERFIL_VACIO,
  'elegible en todo': base,
  propietario: { ...base, tienePropiedad: true },
  'menor de edad': { ...base, postulanteEdad: 17 },
  'RSH alto y mucho ahorro': { ...base, tramoRSH: 95, ahorroUF: 85, ingresoFamiliarMensualCLP: 5_000_000 },
  'poco ahorro': { ...base, tramoRSH: 40, ahorroUF: 12 },
  'adulto mayor': { ...base, postulanteEdad: 65, tramoRSH: 95, ahorroUF: 45 },
  'postula solo sin excepción': { ...base, integrantesGrupoFamiliar: [] },
  'cuenta reciente': { ...base, antiguedadCuentaAhorroMeses: 6 },
  'fuera de la RM': { ...base, region: 'Valparaíso' },
  'con subsidio previo': { ...base, subsidioPrevio: 'DS49' },
  'ingreso fuera de rango': { ...base, ingresoFamiliarMensualUF: 80 },
};

describe.each(Object.entries(PERFILES))('perfil «%s»', (_nombre, perfil) => {
  it.each(IDIOMAS)('[%s] ningún motivo trae valores rotos', (idioma) => {
    for (const r of evaluarTodosLosProgramas(perfil, idioma)) {
      expect(r.motivo.length).toBeGreaterThan(10);
      expect(r.motivo).not.toMatch(/undefined|NaN|\[object|\$\{/);
      if (r.detalle?.nota) expect(String(r.detalle.nota)).not.toMatch(/undefined|NaN|\[object/);
    }
  });

  it('[es] habla de tú: nada de ustedes, usted ni impersonal', () => {
    for (const r of evaluarTodosLosProgramas(perfil, 'es')) {
      expect(r.motivo).not.toMatch(/\b(ustedes?|el postulante|cuenta con|es propietario)\b/i);
    }
  });

  it('en inglés cada motivo difiere del español y el resto del resultado no cambia', () => {
    const es = evaluarTodosLosProgramas(perfil, 'es');
    const en = evaluarTodosLosProgramas(perfil, 'en');
    en.forEach((r, i) => {
      expect(r.motivo).not.toBe(es[i].motivo);
      expect(r.estado).toBe(es[i].estado);
      expect(r.camposFaltantes).toEqual(es[i].camposFaltantes);
      expect(r.regla).toEqual(es[i].regla);
    });
  });
});
