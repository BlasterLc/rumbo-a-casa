import { describe, it, expect } from 'vitest';
import { MENSAJES } from '../../src/rules-engine/mensajes';

// Argumentos de prueba: las funciones del catálogo ignoran los que no usan.
const ARGUMENTOS = [12, 34, 56, 78, { topeCLP: 1234567, personas: 2 }] as const;

interface Hoja {
  ruta: string;
  valor: string;
}

function hojas(objeto: unknown, ruta = ''): Hoja[] {
  if (typeof objeto === 'string') return [{ ruta, valor: objeto }];
  if (typeof objeto === 'function') {
    return [{ ruta, valor: (objeto as (...args: unknown[]) => string)(...ARGUMENTOS) }];
  }
  if (typeof objeto === 'object' && objeto !== null) {
    return Object.entries(objeto).flatMap(([clave, valor]) =>
      hojas(valor, ruta ? `${ruta}.${clave}` : clave),
    );
  }
  throw new Error(`Tipo inesperado en ${ruta}`);
}

const es = hojas(MENSAJES.es);
const en = hojas(MENSAJES.en);

describe('catálogo de mensajes del motor', () => {
  it('es y en tienen exactamente las mismas claves', () => {
    expect(en.map((h) => h.ruta).sort()).toEqual(es.map((h) => h.ruta).sort());
  });

  it.each(es.map((h) => h.ruta))('%s está traducido, no vacío y sin valores rotos', (ruta) => {
    const textoEs = es.find((h) => h.ruta === ruta)!.valor;
    const textoEn = en.find((h) => h.ruta === ruta)!.valor;
    expect(textoEs.length).toBeGreaterThan(10);
    expect(textoEn.length).toBeGreaterThan(10);
    expect(textoEn).not.toBe(textoEs);
    for (const texto of [textoEs, textoEn]) {
      expect(texto).not.toMatch(/undefined|NaN|\[object|\$\{/);
    }
  });

  it('rshExcede sin ingreso no menciona el tope de ingreso', () => {
    expect(MENSAJES.es.ds1.rshExcede(45, 2, 80, 85)).toBe(
      'Con 45 UF de ahorro te correspondería el Tramo 2 (RSH ≤80%), pero tu tramo RSH es 85%.',
    );
    expect(MENSAJES.en.ds1.rshExcede(45, 2, 80, 85)).toBe(
      'With 45 UF in savings you would fall under Tier 2 (RSH 80% or lower), but your RSH bracket is 85%.',
    );
  });

  it('rshExcede con tope de ingreso usa el separador de miles de cada idioma', () => {
    const ingreso = { topeCLP: 3_386_546, personas: 2 };
    expect(MENSAJES.es.ds1.rshExcede(85, 3, 90, 95, ingreso)).toBe(
      'Con 85 UF de ahorro te correspondería el Tramo 3 (RSH ≤90%), pero tu tramo RSH es 95% y tu ingreso familiar supera el tope de $3.386.546 para 2 personas.',
    );
    expect(MENSAJES.en.ds1.rshExcede(85, 3, 90, 95, ingreso)).toBe(
      'With 85 UF in savings you would fall under Tier 3 (RSH 90% or lower), but your RSH bracket is 95% and your household income is above the limit of CLP 3,386,546 for 2 people.',
    );
  });

  it('un solo integrante se cuenta en singular', () => {
    const ingreso = { topeCLP: 2_589_712, personas: 1 };
    const rshEs = MENSAJES.es.ds1.rshExcede(85, 3, 90, 95, ingreso);
    const rshEn = MENSAJES.en.ds1.rshExcede(85, 3, 90, 95, ingreso);
    expect(rshEs.endsWith('para 1 persona.')).toBe(true);
    expect(rshEs).not.toContain('personas');
    expect(rshEn.endsWith('for 1 person.')).toBe(true);
    expect(rshEn).not.toContain('people');
    expect(MENSAJES.es.ds52.ingresoFueraDeRango(7, 25, 1)).toBe(
      'Tu ingreso familiar mensual debe estar entre 7 y 25 UF para un grupo de 1 persona.',
    );
    expect(MENSAJES.en.ds52.ingresoFueraDeRango(7, 25, 1)).toBe(
      'Your monthly household income must be between 7 and 25 UF for a household of 1 person.',
    );
  });

  it('dos integrantes siguen en plural', () => {
    expect(MENSAJES.es.ds1.rshExcede(85, 3, 90, 95, { topeCLP: 3_386_546, personas: 2 })).toMatch(
      /para 2 personas\.$/,
    );
    expect(MENSAJES.en.ds1.rshExcede(85, 3, 90, 95, { topeCLP: 3_386_546, personas: 2 })).toMatch(
      /for 2 people\.$/,
    );
    expect(MENSAJES.es.ds52.ingresoFueraDeRango(7, 25, 2)).toMatch(/grupo de 2 personas\.$/);
    expect(MENSAJES.en.ds52.ingresoFueraDeRango(7, 25, 2)).toMatch(/household of 2 people\.$/);
  });
});
