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
      'Con 85 UF de ahorro te correspondería el Tramo 3 (RSH ≤90%), pero tu tramo RSH es 95% y el ingreso familiar supera el tope de $3.386.546 para 2 personas.',
    );
    expect(MENSAJES.en.ds1.rshExcede(85, 3, 90, 95, ingreso)).toBe(
      'With 85 UF in savings you would fall under Tier 3 (RSH 90% or lower), but your RSH bracket is 95% and your household income is above the limit of $3,386,546 for 2 people.',
    );
  });
});
