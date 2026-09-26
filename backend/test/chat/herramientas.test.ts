import { describe, it, expect } from 'vitest';
import { HERRAMIENTAS, ejecutarHerramienta } from '../../src/chat/herramientas';
import { PERFIL_VACIO } from '../../src/chat/perfil';
import type { Perfil } from '../../src/rules-engine/index';

const perfilElegibleEnTodo: Perfil = {
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

describe('HERRAMIENTAS', () => {
  it('declara las tres herramientas', () => {
    expect(HERRAMIENTAS.map((h) => h.toolSpec?.name)).toEqual([
      'actualizar_perfil',
      'evaluar_elegibilidad',
      'generar_plan',
    ]);
  });

  it('el esquema de actualizar_perfil trae los campos del perfil y ahorroCLP, sin $schema', () => {
    const esquema = HERRAMIENTAS[0].toolSpec?.inputSchema?.json as Record<string, any>;
    expect(esquema.type).toBe('object');
    expect(Object.keys(esquema.properties)).toEqual(
      expect.arrayContaining(['tramoRSH', 'region', 'ingresoFamiliarMensualCLP', 'ahorroCLP']),
    );
    expect(esquema.$schema).toBeUndefined();
  });

  it('toda herramienta tiene descripción', () => {
    for (const h of HERRAMIENTAS) {
      expect(h.toolSpec?.description?.length).toBeGreaterThan(20);
    }
  });
});

describe('ejecutarHerramienta', () => {
  it('actualizar_perfil aplica cambios y reporta aceptados y rechazados', () => {
    const r = ejecutarHerramienta('actualizar_perfil', { tramoRSH: 40, region: 'Marte' }, PERFIL_VACIO);
    expect(r.error).toBe(false);
    expect(r.perfil.tramoRSH).toBe(40);
    expect(r.salida.aceptados).toEqual(['tramoRSH']);
    expect((r.salida.rechazados as { campo: string }[]).map((x) => x.campo)).toEqual(['region']);
  });

  it('actualizar_perfil con una entrada que no es objeto devuelve error y no cambia el perfil', () => {
    const r = ejecutarHerramienta('actualizar_perfil', 'tramo 40', PERFIL_VACIO);
    expect(r.error).toBe(true);
    expect(r.perfil).toEqual(PERFIL_VACIO);
  });

  it('evaluar_elegibilidad devuelve los 4 programas', () => {
    const r = ejecutarHerramienta('evaluar_elegibilidad', {}, perfilElegibleEnTodo);
    expect(r.error).toBe(false);
    expect(r.salida.resultados).toHaveLength(4);
  });

  it('generar_plan devuelve un plan por programa elegible', () => {
    const r = ejecutarHerramienta('generar_plan', {}, perfilElegibleEnTodo);
    expect((r.salida.plan as unknown[]).length).toBe(4);
  });

  it('generar_plan con el perfil vacío devuelve un plan vacío', () => {
    const r = ejecutarHerramienta('generar_plan', {}, PERFIL_VACIO);
    expect(r.salida.plan).toEqual([]);
  });

  it('una herramienta desconocida devuelve error sin tocar el perfil', () => {
    const r = ejecutarHerramienta('borrar_todo', {}, perfilElegibleEnTodo);
    expect(r.error).toBe(true);
    expect(r.salida.error).toContain('borrar_todo');
    expect(r.perfil).toBe(perfilElegibleEnTodo);
  });
});

describe('ejecutarHerramienta con idioma', () => {
  it('evaluar_elegibilidad devuelve los motivos en el idioma pedido', () => {
    const en = ejecutarHerramienta('evaluar_elegibilidad', {}, perfilElegibleEnTodo, 'en');
    const es = ejecutarHerramienta('evaluar_elegibilidad', {}, perfilElegibleEnTodo);
    const motivoEn = (en.salida.resultados as { motivo: string }[])[0].motivo;
    const motivoEs = (es.salida.resultados as { motivo: string }[])[0].motivo;
    expect(motivoEn).toMatch(/^You meet the DS49 requirements/);
    expect(motivoEs).toMatch(/^Cumples los requisitos de DS49/);
  });

  it('generar_plan devuelve los detalles en el idioma pedido', () => {
    const en = ejecutarHerramienta('generar_plan', {}, perfilElegibleEnTodo, 'en');
    const plan = en.salida.plan as { documentos: { nombre: string; detalle?: string }[] }[];
    expect(plan.length).toBeGreaterThan(0);
    for (const p of plan) for (const d of p.documentos) expect(d.detalle).toBeTruthy();
  });
});
