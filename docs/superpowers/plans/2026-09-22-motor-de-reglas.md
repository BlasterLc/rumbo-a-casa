# Motor de reglas (rules-engine) — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Un módulo TypeScript puro (`backend/src/rules-engine/`) que, dado el perfil de una familia, devuelve `elegible | no_elegible | falta_dato` para cada uno de los 4 programas (DS49, DS1, DS19, DS52), con la regla citada (decreto, fuente, fecha de consulta).

**Architecture:** Un esquema de perfil validado con Zod (`Perfil`), una función `evaluar<Programa>(perfil): ResultadoPrograma` por programa (sin dependencias de AWS ni efectos secundarios), y un `evaluarTodosLosProgramas(perfil)` que las junta. `chat-handler` (plan futuro) importa esto desde `backend/src/rules-engine/index.ts`.

**Tech Stack:** TypeScript, Zod, Vitest. Cero dependencias de AWS (regla de diseño explícita del spec).

**Spec:** `docs/programas-subsidio.md` (reglas citadas de los 4 programas) y `docs/superpowers/specs/2026-09-20-rumbo-a-casa-design.md`.

## Global Constraints

- `backend/src/rules-engine/` no importa nada de `aws-lambda`, AWS SDK, ni nada con efectos secundarios (spec: "TypeScript puro... nada de AWS").
- Cuando falta un dato del perfil necesario para evaluar un programa, la función devuelve `falta_dato` con la lista de campos — nunca asume ni adivina un valor.
- Toda decisión `elegible`/`no_elegible` viene con `regla: { decreto, fuente, fechaConsulta }` citando `docs/programas-subsidio.md`.
- Los montos de subsidio en UF son informativos (`detalle`), nunca condicionan el `estado`.
- Mensajes de commit sin atribución a Claude (sin `Co-Authored-By`, sin "Generated with Claude Code").
- Al escribir en español, sin voseo.

---

## Estructura de archivos

```
backend/
├── src/
│   └── rules-engine/
│       ├── tipos.ts           # ResultadoPrograma, Regla, helpers de resultado
│       ├── perfil.schema.ts   # Perfil (Zod)
│       ├── zonas.ts           # obtenerZonaDS1
│       ├── ds49.ts
│       ├── ds1.ts
│       ├── ds19.ts
│       ├── ds52.ts
│       └── index.ts           # evaluarTodosLosProgramas + re-exports
└── test/
    └── rules-engine/
        ├── perfil.schema.test.ts
        ├── zonas.test.ts
        ├── ds49.test.ts
        ├── ds1.test.ts
        ├── ds19.test.ts
        ├── ds52.test.ts
        └── index.test.ts
```

---

### Task 1: Tipos y esquema del perfil

**Files:**
- Create: `backend/src/rules-engine/tipos.ts`
- Create: `backend/src/rules-engine/perfil.schema.ts`
- Test: `backend/test/rules-engine/perfil.schema.test.ts`

**Interfaces:**
- Produces: `type Perfil` (desde `perfil.schema.ts`), `type ResultadoPrograma`, `type Regla`, `type EstadoElegibilidad`, `resultadoFaltaDato(programa, camposFaltantes, regla): ResultadoPrograma`, `resultadoDecision(programa, elegible, motivo, regla): ResultadoPrograma` (desde `tipos.ts`). Todas las tareas siguientes los importan.

- [ ] **Step 1: Instalar Zod en el workspace backend**

Run: `npm install zod -w backend`
Expected: se agrega `zod` a `backend/package.json` bajo `dependencies` (no `devDependencies`, se usa en runtime).

- [ ] **Step 2: Escribir la prueba que falla**

`backend/test/rules-engine/perfil.schema.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { PerfilSchema } from '../../src/rules-engine/perfil.schema';

const perfilCompleto = {
  postulanteEdad: 30,
  region: 'Metropolitana',
  zonaEspecial: 'ninguna',
  tramoRSH: 35,
  tienePropiedad: false,
  ahorroUF: 12,
  antiguedadCuentaAhorroMeses: 12,
  ingresoFamiliarMensualUF: 20,
  ingresoFamiliarMensualCLP: 900000,
  integrantesGrupoFamiliar: [{ edad: 28, discapacidadCertificada: false }],
  excepcionPostulacionIndividualDS49: false,
  subsidioPrevio: 'ninguno',
  objetivo: 'comprar',
};

describe('PerfilSchema', () => {
  it('acepta un perfil completo y válido', () => {
    expect(() => PerfilSchema.parse(perfilCompleto)).not.toThrow();
  });

  it('acepta "desconocido" en cualquier campo', () => {
    const perfilParcial = { ...perfilCompleto, tramoRSH: 'desconocido', ahorroUF: 'desconocido' };
    expect(() => PerfilSchema.parse(perfilParcial)).not.toThrow();
  });

  it('rechaza un tramoRSH fuera de rango', () => {
    expect(() => PerfilSchema.parse({ ...perfilCompleto, tramoRSH: 150 })).toThrow();
  });

  it('rechaza una región inválida', () => {
    expect(() => PerfilSchema.parse({ ...perfilCompleto, region: 'Marte' })).toThrow();
  });
});
```

- [ ] **Step 3: Ejecutar y ver que falla**

Run: `npm test -w backend`
Expected: FAIL, no se puede resolver `../../src/rules-engine/perfil.schema`.

- [ ] **Step 4: Implementar `tipos.ts`**

```ts
export type ConDesconocido<T> = T | 'desconocido';

export type EstadoElegibilidad = 'elegible' | 'no_elegible' | 'falta_dato';

export interface Regla {
  decreto: string;
  fuente: string;
  fechaConsulta: string;
}

export type Programa = 'DS49' | 'DS1' | 'DS19' | 'DS52';

export interface ResultadoPrograma {
  programa: Programa;
  estado: EstadoElegibilidad;
  motivo: string;
  camposFaltantes?: string[];
  regla: Regla;
  detalle?: Record<string, unknown>;
}

export function resultadoFaltaDato(
  programa: Programa,
  camposFaltantes: string[],
  regla: Regla,
): ResultadoPrograma {
  return {
    programa,
    estado: 'falta_dato',
    motivo: `Faltan datos para evaluar ${programa}.`,
    camposFaltantes,
    regla,
  };
}

export function resultadoDecision(
  programa: Programa,
  elegible: boolean,
  motivo: string,
  regla: Regla,
  detalle?: Record<string, unknown>,
): ResultadoPrograma {
  return { programa, estado: elegible ? 'elegible' : 'no_elegible', motivo, regla, detalle };
}
```

- [ ] **Step 5: Implementar `perfil.schema.ts`**

```ts
import { z } from 'zod';

export const REGIONES = [
  'Arica y Parinacota', 'Tarapacá', 'Antofagasta', 'Atacama', 'Coquimbo',
  'Valparaíso', 'Metropolitana', "O'Higgins", 'Maule', 'Ñuble', 'Biobío',
  'La Araucanía', 'Los Ríos', 'Los Lagos', 'Aysén', 'Magallanes',
] as const;

export const ZONAS_ESPECIALES = [
  'chiloe', 'palena', 'isla_de_pascua', 'juan_fernandez', 'ninguna',
] as const;

const conDesconocido = <T extends z.ZodTypeAny>(schema: T) =>
  z.union([schema, z.literal('desconocido')]);

export const IntegranteSchema = z.object({
  edad: z.number().int().min(0).max(120),
  discapacidadCertificada: z.boolean(),
});

export const PerfilSchema = z.object({
  postulanteEdad: conDesconocido(z.number().int().min(0).max(120)),
  region: conDesconocido(z.enum(REGIONES)),
  zonaEspecial: conDesconocido(z.enum(ZONAS_ESPECIALES)),
  tramoRSH: conDesconocido(z.number().min(0).max(100)),
  tienePropiedad: conDesconocido(z.boolean()),
  ahorroUF: conDesconocido(z.number().min(0)),
  antiguedadCuentaAhorroMeses: conDesconocido(z.number().min(0)),
  ingresoFamiliarMensualUF: conDesconocido(z.number().min(0)),
  ingresoFamiliarMensualCLP: conDesconocido(z.number().min(0)),
  integrantesGrupoFamiliar: conDesconocido(z.array(IntegranteSchema)),
  excepcionPostulacionIndividualDS49: conDesconocido(z.boolean()),
  subsidioPrevio: conDesconocido(
    z.enum(['DS49', 'DS1_T1', 'damnificado_2014', 'ninguno']),
  ),
  objetivo: conDesconocido(z.enum(['comprar', 'construir', 'arrendar'])),
});

export type Perfil = z.infer<typeof PerfilSchema>;
```

- [ ] **Step 6: Ejecutar y ver que pasa**

Run: `npm test -w backend`
Expected: 4 pruebas PASS.

- [ ] **Step 7: Commit**

```bash
git add backend/package.json backend/package-lock.json backend/src/rules-engine backend/test/rules-engine
git commit -m "feat: tipos y esquema de perfil del rules-engine"
```

---

### Task 2: Mapeo de zonas geográficas de DS1

**Files:**
- Create: `backend/src/rules-engine/zonas.ts`
- Test: `backend/test/rules-engine/zonas.test.ts`

**Interfaces:**
- Consumes: `Perfil` (Task 1).
- Produces: `type ZonaDS1 = 'extremo_norte' | 'regular' | 'extremo_sur_insular'`, `obtenerZonaDS1(perfil): ZonaDS1 | 'desconocido'`. Lo usa Task 4 (DS1).

- [ ] **Step 1: Escribir la prueba que falla**

`backend/test/rules-engine/zonas.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { obtenerZonaDS1 } from '../../src/rules-engine/zonas';

describe('obtenerZonaDS1', () => {
  it('Antofagasta es zona extremo norte', () => {
    expect(obtenerZonaDS1({ region: 'Antofagasta', zonaEspecial: 'ninguna' })).toBe('extremo_norte');
  });

  it('Metropolitana es zona regular', () => {
    expect(obtenerZonaDS1({ region: 'Metropolitana', zonaEspecial: 'ninguna' })).toBe('regular');
  });

  it('Magallanes es zona extremo sur e insular', () => {
    expect(obtenerZonaDS1({ region: 'Magallanes', zonaEspecial: 'ninguna' })).toBe('extremo_sur_insular');
  });

  it('la provincia de Chiloé cuenta como extremo norte aunque la región sea Los Lagos', () => {
    expect(obtenerZonaDS1({ region: 'Los Lagos', zonaEspecial: 'chiloe' })).toBe('extremo_norte');
  });

  it('Isla de Pascua cuenta como extremo sur e insular', () => {
    expect(obtenerZonaDS1({ region: 'Valparaíso', zonaEspecial: 'isla_de_pascua' })).toBe('extremo_sur_insular');
  });

  it('devuelve "desconocido" si falta la región', () => {
    expect(obtenerZonaDS1({ region: 'desconocido', zonaEspecial: 'ninguna' })).toBe('desconocido');
  });
});
```

- [ ] **Step 2: Ejecutar y ver que falla**

Run: `npm test -w backend`
Expected: FAIL, no se puede resolver `../../src/rules-engine/zonas`.

- [ ] **Step 3: Implementar `zonas.ts`**

```ts
import type { Perfil } from './perfil.schema';

export type ZonaDS1 = 'extremo_norte' | 'regular' | 'extremo_sur_insular';

const REGIONES_EXTREMO_NORTE = ['Arica y Parinacota', 'Tarapacá', 'Antofagasta', 'Atacama'];
const REGIONES_EXTREMO_SUR = ['Aysén', 'Magallanes'];

export function obtenerZonaDS1(
  perfil: Pick<Perfil, 'region' | 'zonaEspecial'>,
): ZonaDS1 | 'desconocido' {
  if (perfil.region === 'desconocido' || perfil.zonaEspecial === 'desconocido') {
    return 'desconocido';
  }
  if (perfil.zonaEspecial === 'chiloe') return 'extremo_norte';
  if (perfil.zonaEspecial === 'palena' || perfil.zonaEspecial === 'isla_de_pascua' || perfil.zonaEspecial === 'juan_fernandez') {
    return 'extremo_sur_insular';
  }
  if (REGIONES_EXTREMO_NORTE.includes(perfil.region)) return 'extremo_norte';
  if (REGIONES_EXTREMO_SUR.includes(perfil.region)) return 'extremo_sur_insular';
  return 'regular';
}
```

- [ ] **Step 4: Ejecutar y ver que pasa**

Run: `npm test -w backend`
Expected: 6 pruebas PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/src/rules-engine/zonas.ts backend/test/rules-engine/zonas.test.ts
git commit -m "feat: mapeo de zonas geográficas para DS1"
```

---

### Task 3: DS49

**Files:**
- Create: `backend/src/rules-engine/ds49.ts`
- Test: `backend/test/rules-engine/ds49.test.ts`

**Interfaces:**
- Consumes: `Perfil`, `ResultadoPrograma`, `resultadoFaltaDato`, `resultadoDecision` (Task 1).
- Produces: `evaluarDS49(perfil: Perfil): ResultadoPrograma`. Lo usa Task 7.

- [ ] **Step 1: Escribir la prueba que falla**

`backend/test/rules-engine/ds49.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { evaluarDS49 } from '../../src/rules-engine/ds49';
import type { Perfil } from '../../src/rules-engine/perfil.schema';

const base: Perfil = {
  postulanteEdad: 30,
  region: 'Metropolitana',
  zonaEspecial: 'ninguna',
  tramoRSH: 35,
  tienePropiedad: false,
  ahorroUF: 12,
  antiguedadCuentaAhorroMeses: 12,
  ingresoFamiliarMensualUF: 20,
  ingresoFamiliarMensualCLP: 900000,
  integrantesGrupoFamiliar: [{ edad: 28, discapacidadCertificada: false }],
  excepcionPostulacionIndividualDS49: false,
  subsidioPrevio: 'ninguno',
  objetivo: 'comprar',
};

describe('evaluarDS49', () => {
  it('elegible cuando cumple RSH ≤40%, ahorro ≥10 UF, no propietario y tiene grupo familiar', () => {
    expect(evaluarDS49(base).estado).toBe('elegible');
  });

  it('no_elegible si el tramo RSH supera 40%', () => {
    const r = evaluarDS49({ ...base, tramoRSH: 45 });
    expect(r.estado).toBe('no_elegible');
    expect(r.motivo).toMatch(/RSH/);
  });

  it('no_elegible si ya es propietario', () => {
    expect(evaluarDS49({ ...base, tienePropiedad: true }).estado).toBe('no_elegible');
  });

  it('no_elegible si el ahorro es menor a 10 UF', () => {
    expect(evaluarDS49({ ...base, ahorroUF: 5 }).estado).toBe('no_elegible');
  });

  it('no_elegible si el postulante es menor de edad', () => {
    expect(evaluarDS49({ ...base, postulanteEdad: 17 }).estado).toBe('no_elegible');
  });

  it('no_elegible si postula solo sin excepción', () => {
    const r = evaluarDS49({ ...base, integrantesGrupoFamiliar: [], excepcionPostulacionIndividualDS49: false });
    expect(r.estado).toBe('no_elegible');
  });

  it('elegible si postula solo pero con excepción (adulto mayor, viudez, discapacidad, indígena o Informe Valech)', () => {
    const r = evaluarDS49({ ...base, integrantesGrupoFamiliar: [], excepcionPostulacionIndividualDS49: true });
    expect(r.estado).toBe('elegible');
  });

  it('falta_dato si no se conoce el tramo RSH', () => {
    const r = evaluarDS49({ ...base, tramoRSH: 'desconocido' });
    expect(r.estado).toBe('falta_dato');
    expect(r.camposFaltantes).toContain('tramoRSH');
  });

  it('cita el decreto D.S. N°49 de 2011', () => {
    expect(evaluarDS49(base).regla.decreto).toBe('D.S. N°49 (V. y U.) de 2011');
  });
});
```

- [ ] **Step 2: Ejecutar y ver que falla**

Run: `npm test -w backend`
Expected: FAIL, no se puede resolver `../../src/rules-engine/ds49`.

- [ ] **Step 3: Implementar `ds49.ts`**

```ts
import type { Perfil } from './perfil.schema';
import { resultadoDecision, resultadoFaltaDato, type ResultadoPrograma } from './tipos';

const REGLA_DS49 = {
  decreto: 'D.S. N°49 (V. y U.) de 2011',
  fuente: 'docs/programas-subsidio.md, sección DS49',
  fechaConsulta: '2026-09-22',
};

const CAMPOS_REQUERIDOS = [
  'tramoRSH', 'tienePropiedad', 'ahorroUF', 'postulanteEdad', 'integrantesGrupoFamiliar',
] as const;

export function evaluarDS49(perfil: Perfil): ResultadoPrograma {
  const faltantes = CAMPOS_REQUERIDOS.filter((campo) => perfil[campo] === 'desconocido');
  if (faltantes.length > 0) {
    return resultadoFaltaDato('DS49', faltantes, REGLA_DS49);
  }

  const tramoRSH = perfil.tramoRSH as number;
  const ahorroUF = perfil.ahorroUF as number;
  const postulanteEdad = perfil.postulanteEdad as number;
  const integrantes = perfil.integrantesGrupoFamiliar as { edad: number; discapacidadCertificada: boolean }[];

  if (perfil.tienePropiedad === true) {
    return resultadoDecision('DS49', false, 'Ya es propietario de una vivienda.', REGLA_DS49);
  }
  if (postulanteEdad < 18) {
    return resultadoDecision('DS49', false, 'El postulante debe ser mayor de 18 años.', REGLA_DS49);
  }
  if (tramoRSH > 40) {
    return resultadoDecision('DS49', false, 'El tramo RSH debe ser 40% o menos.', REGLA_DS49);
  }
  if (ahorroUF < 10) {
    return resultadoDecision('DS49', false, 'Se requiere un ahorro mínimo de 10 UF.', REGLA_DS49);
  }
  if (integrantes.length === 0 && perfil.excepcionPostulacionIndividualDS49 !== true) {
    return resultadoDecision(
      'DS49',
      false,
      'Las postulaciones individuales requieren una excepción: adulto mayor, viudez, discapacidad certificada, indígena reconocido, o incluido en el Informe Valech.',
      REGLA_DS49,
    );
  }

  return resultadoDecision(
    'DS49',
    true,
    'Cumple los requisitos de DS49: RSH ≤40%, ahorro ≥10 UF, no propietario, grupo familiar acreditado (o excepción de postulación individual).',
    REGLA_DS49,
  );
}
```

- [ ] **Step 4: Ejecutar y ver que pasa**

Run: `npm test -w backend`
Expected: 9 pruebas PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/src/rules-engine/ds49.ts backend/test/rules-engine/ds49.test.ts
git commit -m "feat: evaluarDS49"
```

---

### Task 4: DS1

**Files:**
- Create: `backend/src/rules-engine/ds1.ts`
- Test: `backend/test/rules-engine/ds1.test.ts`

**Interfaces:**
- Consumes: `Perfil`, `ResultadoPrograma`, `resultadoFaltaDato`, `resultadoDecision` (Task 1); `obtenerZonaDS1` (Task 2).
- Produces: `evaluarDS1(perfil: Perfil): ResultadoPrograma` con `detalle: { tramo: 1|2|3, zona }` cuando es elegible. Lo usa Task 7.

- [ ] **Step 1: Escribir la prueba que falla**

`backend/test/rules-engine/ds1.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { evaluarDS1 } from '../../src/rules-engine/ds1';
import type { Perfil } from '../../src/rules-engine/perfil.schema';

const base: Perfil = {
  postulanteEdad: 30,
  region: 'Metropolitana',
  zonaEspecial: 'ninguna',
  tramoRSH: 50,
  tienePropiedad: false,
  ahorroUF: 35,
  antiguedadCuentaAhorroMeses: 14,
  ingresoFamiliarMensualUF: 20,
  ingresoFamiliarMensualCLP: 900000,
  integrantesGrupoFamiliar: [{ edad: 28, discapacidadCertificada: false }],
  excepcionPostulacionIndividualDS49: false,
  subsidioPrevio: 'ninguno',
  objetivo: 'comprar',
};

describe('evaluarDS1', () => {
  it('elegible Tramo 1 con RSH 50% y ahorro 35 UF', () => {
    const r = evaluarDS1(base);
    expect(r.estado).toBe('elegible');
    expect(r.detalle?.tramo).toBe(1);
  });

  it('elegible Tramo 2 cuando el RSH supera el 60% del Tramo 1', () => {
    const r = evaluarDS1({ ...base, tramoRSH: 75, ahorroUF: 45 });
    expect(r.estado).toBe('elegible');
    expect(r.detalle?.tramo).toBe(2);
  });

  it('elegible Tramo 3 por RSH ≤90% con ahorro de 80 UF', () => {
    const r = evaluarDS1({ ...base, tramoRSH: 88, ahorroUF: 85 });
    expect(r.estado).toBe('elegible');
    expect(r.detalle?.tramo).toBe(3);
  });

  it('elegible Tramo 3 por tope de ingreso familiar aunque el RSH supere 90%', () => {
    const r = evaluarDS1({
      ...base,
      tramoRSH: 95,
      ahorroUF: 85,
      integrantesGrupoFamiliar: [{ edad: 28, discapacidadCertificada: false }],
      ingresoFamiliarMensualCLP: 3_000_000, // bajo el tope de 2 integrantes ($3.386.546)
    });
    expect(r.estado).toBe('elegible');
    expect(r.detalle?.tramo).toBe(3);
  });

  it('adulto mayor (60+) accede a Tramo 1 con RSH hasta 90%', () => {
    const r = evaluarDS1({ ...base, postulanteEdad: 65, tramoRSH: 85, ahorroUF: 30 });
    expect(r.estado).toBe('elegible');
    expect(r.detalle?.tramo).toBe(1);
  });

  it('no_elegible si ya es propietario', () => {
    expect(evaluarDS1({ ...base, tienePropiedad: true }).estado).toBe('no_elegible');
  });

  it('no_elegible si la cuenta de ahorro tiene menos de 12 meses', () => {
    expect(evaluarDS1({ ...base, antiguedadCuentaAhorroMeses: 6 }).estado).toBe('no_elegible');
  });

  it('no_elegible si no alcanza el ahorro mínimo de ningún tramo', () => {
    expect(evaluarDS1({ ...base, ahorroUF: 10 }).estado).toBe('no_elegible');
  });

  it('falta_dato si no se conoce el tramo RSH', () => {
    const r = evaluarDS1({ ...base, tramoRSH: 'desconocido' });
    expect(r.estado).toBe('falta_dato');
    expect(r.camposFaltantes).toContain('tramoRSH');
  });

  it('cita el decreto D.S. N°1 de 2011', () => {
    expect(evaluarDS1(base).regla.decreto).toBe('D.S. N°1 de 2011, Res. Ex. N°669/2026');
  });
});
```

- [ ] **Step 2: Ejecutar y ver que falla**

Run: `npm test -w backend`
Expected: FAIL, no se puede resolver `../../src/rules-engine/ds1`.

- [ ] **Step 3: Implementar `ds1.ts`**

```ts
import type { Perfil } from './perfil.schema';
import { resultadoDecision, resultadoFaltaDato, type ResultadoPrograma } from './tipos';
import { obtenerZonaDS1 } from './zonas';

const REGLA_DS1 = {
  decreto: 'D.S. N°1 de 2011, Res. Ex. N°669/2026',
  fuente: 'docs/programas-subsidio.md, sección DS1',
  fechaConsulta: '2026-09-22',
};

const CAMPOS_REQUERIDOS = [
  'tramoRSH', 'tienePropiedad', 'ahorroUF', 'antiguedadCuentaAhorroMeses', 'postulanteEdad',
] as const;

interface TramoDS1 {
  tramo: 1 | 2 | 3;
  ahorroMinUF: number;
  rshMax: number;
}

const TRAMOS: TramoDS1[] = [
  { tramo: 1, ahorroMinUF: 30, rshMax: 60 },
  { tramo: 2, ahorroMinUF: 40, rshMax: 80 },
  { tramo: 3, ahorroMinUF: 80, rshMax: 90 },
];

const TOPES_INGRESO_TRAMO3_CLP: Record<number, number> = {
  1: 2_589_712,
  2: 3_386_546,
  3: 3_705_280,
};
const TOPE_INGRESO_TRAMO3_4_MAS_CLP = 4_024_014;

function topeIngresoPorTamano(tamanoGrupo: number): number {
  return TOPES_INGRESO_TRAMO3_CLP[tamanoGrupo] ?? TOPE_INGRESO_TRAMO3_4_MAS_CLP;
}

export function evaluarDS1(perfil: Perfil): ResultadoPrograma {
  const faltantes = CAMPOS_REQUERIDOS.filter((campo) => perfil[campo] === 'desconocido');
  if (faltantes.length > 0) {
    return resultadoFaltaDato('DS1', faltantes, REGLA_DS1);
  }

  const tramoRSH = perfil.tramoRSH as number;
  const ahorroUF = perfil.ahorroUF as number;
  const antiguedadMeses = perfil.antiguedadCuentaAhorroMeses as number;
  const postulanteEdad = perfil.postulanteEdad as number;
  const esAdultoMayor = postulanteEdad >= 60;

  if (perfil.tienePropiedad === true) {
    return resultadoDecision('DS1', false, 'Ya es propietario de una vivienda o de un sitio con destino habitacional.', REGLA_DS1);
  }
  if (postulanteEdad < 18) {
    return resultadoDecision('DS1', false, 'El postulante debe ser mayor de 18 años.', REGLA_DS1);
  }
  if (antiguedadMeses < 12) {
    return resultadoDecision('DS1', false, 'La cuenta de ahorro debe tener al menos 12 meses de antigüedad.', REGLA_DS1);
  }

  const tamanoGrupo =
    perfil.integrantesGrupoFamiliar === 'desconocido'
      ? undefined
      : perfil.integrantesGrupoFamiliar.length + 1;

  const cumpleTramo3PorIngreso =
    perfil.ingresoFamiliarMensualCLP !== 'desconocido' &&
    tamanoGrupo !== undefined &&
    perfil.ingresoFamiliarMensualCLP <= topeIngresoPorTamano(tamanoGrupo);

  for (const tramo of TRAMOS) {
    if (ahorroUF < tramo.ahorroMinUF) continue;
    const rshMaxEfectivo = esAdultoMayor ? 90 : tramo.rshMax;
    const califica = tramoRSH <= rshMaxEfectivo || (tramo.tramo === 3 && cumpleTramo3PorIngreso);
    if (califica) {
      const zona = obtenerZonaDS1(perfil);
      return resultadoDecision(
        'DS1',
        true,
        `Califica para el Tramo ${tramo.tramo} de DS1 (ahorro ≥${tramo.ahorroMinUF} UF, RSH ≤${rshMaxEfectivo}%).`,
        REGLA_DS1,
        { tramo: tramo.tramo, zona },
      );
    }
  }

  return resultadoDecision(
    'DS1',
    false,
    'No cumple el ahorro mínimo ni el tramo RSH (o el tope de ingreso familiar) de ningún tramo de DS1.',
    REGLA_DS1,
  );
}
```

- [ ] **Step 4: Ejecutar y ver que pasa**

Run: `npm test -w backend`
Expected: 10 pruebas PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/src/rules-engine/ds1.ts backend/test/rules-engine/ds1.test.ts
git commit -m "feat: evaluarDS1 (3 tramos, zonas y tope de ingreso)"
```

---

### Task 5: DS19

**Files:**
- Create: `backend/src/rules-engine/ds19.ts`
- Test: `backend/test/rules-engine/ds19.test.ts`

**Interfaces:**
- Consumes: `Perfil`, `ResultadoPrograma`, `resultadoFaltaDato`, `resultadoDecision` (Task 1).
- Produces: `evaluarDS19(perfil: Perfil): ResultadoPrograma` con `detalle: { ruta: 'A' | 'B' }` cuando es elegible. Lo usa Task 7.

- [ ] **Step 1: Escribir la prueba que falla**

`backend/test/rules-engine/ds19.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { evaluarDS19 } from '../../src/rules-engine/ds19';
import type { Perfil } from '../../src/rules-engine/perfil.schema';

const base: Perfil = {
  postulanteEdad: 30,
  region: 'Metropolitana',
  zonaEspecial: 'ninguna',
  tramoRSH: 85,
  tienePropiedad: false,
  ahorroUF: 35,
  antiguedadCuentaAhorroMeses: 14,
  ingresoFamiliarMensualUF: 20,
  ingresoFamiliarMensualCLP: 900000,
  integrantesGrupoFamiliar: [{ edad: 28, discapacidadCertificada: false }],
  excepcionPostulacionIndividualDS49: false,
  subsidioPrevio: 'ninguno',
  objetivo: 'comprar',
};

describe('evaluarDS19', () => {
  it('Ruta A: elegible con subsidio previo DS49', () => {
    const r = evaluarDS19({ ...base, subsidioPrevio: 'DS49' });
    expect(r.estado).toBe('elegible');
    expect(r.detalle?.ruta).toBe('A');
  });

  it('Ruta A: elegible con subsidio previo DS1 Tramo 1', () => {
    const r = evaluarDS19({ ...base, subsidioPrevio: 'DS1_T1' });
    expect(r.estado).toBe('elegible');
    expect(r.detalle?.ruta).toBe('A');
  });

  it('Ruta A: elegible con subsidio de damnificado 2014+', () => {
    const r = evaluarDS19({ ...base, subsidioPrevio: 'damnificado_2014' });
    expect(r.estado).toBe('elegible');
    expect(r.detalle?.ruta).toBe('A');
  });

  it('Ruta B: elegible sin subsidio previo con RSH ≤90%', () => {
    const r = evaluarDS19({ ...base, subsidioPrevio: 'ninguno', tramoRSH: 85 });
    expect(r.estado).toBe('elegible');
    expect(r.detalle?.ruta).toBe('B');
  });

  it('no_elegible si ya es propietario', () => {
    expect(evaluarDS19({ ...base, tienePropiedad: true }).estado).toBe('no_elegible');
  });

  it('no_elegible sin subsidio previo y RSH sobre 90%', () => {
    const r = evaluarDS19({ ...base, subsidioPrevio: 'ninguno', tramoRSH: 95 });
    expect(r.estado).toBe('no_elegible');
  });

  it('falta_dato si no se conoce si tiene subsidio previo', () => {
    const r = evaluarDS19({ ...base, subsidioPrevio: 'desconocido' });
    expect(r.estado).toBe('falta_dato');
    expect(r.camposFaltantes).toContain('subsidioPrevio');
  });

  it('cita el decreto D.S. N°19 de 2016', () => {
    expect(evaluarDS19({ ...base, subsidioPrevio: 'DS49' }).regla.decreto).toBe(
      'D.S. N°19 (V. y U.) de 2016, mod. D.S. N°16 (V. y U.) de 2020',
    );
  });
});
```

- [ ] **Step 2: Ejecutar y ver que falla**

Run: `npm test -w backend`
Expected: FAIL, no se puede resolver `../../src/rules-engine/ds19`.

- [ ] **Step 3: Implementar `ds19.ts`**

```ts
import type { Perfil } from './perfil.schema';
import { resultadoDecision, resultadoFaltaDato, type ResultadoPrograma } from './tipos';

const REGLA_DS19 = {
  decreto: 'D.S. N°19 (V. y U.) de 2016, mod. D.S. N°16 (V. y U.) de 2020',
  fuente: 'docs/programas-subsidio.md, sección DS19',
  fechaConsulta: '2026-09-22',
};

const CAMPOS_REQUERIDOS = ['tienePropiedad', 'subsidioPrevio', 'tramoRSH'] as const;

const SUBSIDIOS_RUTA_A = ['DS49', 'DS1_T1', 'damnificado_2014'];

export function evaluarDS19(perfil: Perfil): ResultadoPrograma {
  const faltantes = CAMPOS_REQUERIDOS.filter((campo) => perfil[campo] === 'desconocido');
  if (faltantes.length > 0) {
    return resultadoFaltaDato('DS19', faltantes, REGLA_DS19);
  }

  if (perfil.tienePropiedad === true) {
    return resultadoDecision('DS19', false, 'Ya es propietario de una vivienda.', REGLA_DS19);
  }

  if (SUBSIDIOS_RUTA_A.includes(perfil.subsidioPrevio as string)) {
    return resultadoDecision(
      'DS19',
      true,
      'Ruta A: ya cuenta con un subsidio previo (DS49, DS1 Tramo 1 o damnificado desde 2014), puede acceder a una vivienda de 1.200-1.400 UF pagada en su totalidad, sin crédito hipotecario.',
      REGLA_DS19,
      { ruta: 'A' },
    );
  }

  const tramoRSH = perfil.tramoRSH as number;
  if (tramoRSH <= 90) {
    return resultadoDecision(
      'DS19',
      true,
      'Ruta B: sin subsidio previo, RSH ≤90% y no propietario. El ahorro mínimo depende del proyecto específico al que postule.',
      REGLA_DS19,
      { ruta: 'B' },
    );
  }

  return resultadoDecision(
    'DS19',
    false,
    'No tiene un subsidio previo habilitante (Ruta A) y su tramo RSH supera el 90% exigido para la Ruta B.',
    REGLA_DS19,
  );
}
```

- [ ] **Step 4: Ejecutar y ver que pasa**

Run: `npm test -w backend`
Expected: 8 pruebas PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/src/rules-engine/ds19.ts backend/test/rules-engine/ds19.test.ts
git commit -m "feat: evaluarDS19 (ruta A/B)"
```

---

### Task 6: DS52

**Files:**
- Create: `backend/src/rules-engine/ds52.ts`
- Test: `backend/test/rules-engine/ds52.test.ts`

**Interfaces:**
- Consumes: `Perfil`, `ResultadoPrograma`, `resultadoFaltaDato`, `resultadoDecision` (Task 1).
- Produces: `evaluarDS52(perfil: Perfil): ResultadoPrograma`. Lo usa Task 7.

- [ ] **Step 1: Escribir la prueba que falla**

`backend/test/rules-engine/ds52.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { evaluarDS52 } from '../../src/rules-engine/ds52';
import type { Perfil } from '../../src/rules-engine/perfil.schema';

const base: Perfil = {
  postulanteEdad: 30,
  region: 'Metropolitana',
  zonaEspecial: 'ninguna',
  tramoRSH: 60,
  tienePropiedad: false,
  ahorroUF: 6,
  antiguedadCuentaAhorroMeses: 12,
  ingresoFamiliarMensualUF: 15,
  ingresoFamiliarMensualCLP: 900000,
  integrantesGrupoFamiliar: [{ edad: 28, discapacidadCertificada: false }],
  excepcionPostulacionIndividualDS49: false,
  subsidioPrevio: 'ninguno',
  objetivo: 'arrendar',
};

describe('evaluarDS52', () => {
  it('elegible con RSH ≤70%, ahorro ≥4 UF, ingreso dentro de rango y núcleo familiar', () => {
    expect(evaluarDS52(base).estado).toBe('elegible');
  });

  it('no_elegible si ya cuenta con vivienda propia', () => {
    expect(evaluarDS52({ ...base, tienePropiedad: true }).estado).toBe('no_elegible');
  });

  it('no_elegible si ya tiene un subsidio habitacional previo', () => {
    expect(evaluarDS52({ ...base, subsidioPrevio: 'DS49' }).estado).toBe('no_elegible');
  });

  it('no_elegible si el postulante es menor de edad', () => {
    expect(evaluarDS52({ ...base, postulanteEdad: 17 }).estado).toBe('no_elegible');
  });

  it('no_elegible si postula solo y no es adulto mayor', () => {
    expect(evaluarDS52({ ...base, integrantesGrupoFamiliar: [] }).estado).toBe('no_elegible');
  });

  it('elegible si postula solo pero es adulto mayor (60+)', () => {
    const r = evaluarDS52({ ...base, postulanteEdad: 65, integrantesGrupoFamiliar: [] });
    expect(r.estado).toBe('elegible');
  });

  it('no_elegible si el tramo RSH supera 70%', () => {
    expect(evaluarDS52({ ...base, tramoRSH: 75 }).estado).toBe('no_elegible');
  });

  it('no_elegible si el ahorro es menor a 4 UF', () => {
    expect(evaluarDS52({ ...base, ahorroUF: 2 }).estado).toBe('no_elegible');
  });

  it('no_elegible si el ingreso familiar es menor a 7 UF', () => {
    expect(evaluarDS52({ ...base, ingresoFamiliarMensualUF: 5 }).estado).toBe('no_elegible');
  });

  it('no_elegible si el ingreso familiar supera el tope de 25 UF para un grupo de 2', () => {
    expect(evaluarDS52({ ...base, ingresoFamiliarMensualUF: 30 }).estado).toBe('no_elegible');
  });

  it('elegible con ingreso alto si el grupo familiar es grande (tope sube 8 UF desde el 4° integrante)', () => {
    const familiaGrande = {
      ...base,
      integrantesGrupoFamiliar: [
        { edad: 28, discapacidadCertificada: false },
        { edad: 10, discapacidadCertificada: false },
        { edad: 8, discapacidadCertificada: false },
      ], // tamaño de grupo = 4 (incluye postulante), tope = 25 + 8 = 33 UF
      ingresoFamiliarMensualUF: 30,
    };
    expect(evaluarDS52(familiaGrande).estado).toBe('elegible');
  });

  it('falta_dato si no se conoce el ahorro', () => {
    const r = evaluarDS52({ ...base, ahorroUF: 'desconocido' });
    expect(r.estado).toBe('falta_dato');
    expect(r.camposFaltantes).toContain('ahorroUF');
  });

  it('cita el decreto D.S. N°52 de 2013', () => {
    expect(evaluarDS52(base).regla.decreto).toBe('D.S. N°52 de 2013, Res. Ex. N°809/2026 (Región Metropolitana)');
  });
});
```

- [ ] **Step 2: Ejecutar y ver que falla**

Run: `npm test -w backend`
Expected: FAIL, no se puede resolver `../../src/rules-engine/ds52`.

- [ ] **Step 3: Implementar `ds52.ts`**

```ts
import type { Perfil } from './perfil.schema';
import { resultadoDecision, resultadoFaltaDato, type ResultadoPrograma } from './tipos';

const REGLA_DS52 = {
  decreto: 'D.S. N°52 de 2013, Res. Ex. N°809/2026 (Región Metropolitana)',
  fuente: 'docs/programas-subsidio.md, sección DS52',
  fechaConsulta: '2026-09-22',
};

const CAMPOS_REQUERIDOS = [
  'tienePropiedad', 'subsidioPrevio', 'tramoRSH', 'ahorroUF',
  'ingresoFamiliarMensualUF', 'postulanteEdad', 'integrantesGrupoFamiliar',
] as const;

const INGRESO_MIN_UF = 7;
const INGRESO_MAX_BASE_UF = 25;
const INGRESO_MAX_INCREMENTO_UF = 8;

export function evaluarDS52(perfil: Perfil): ResultadoPrograma {
  const faltantes = CAMPOS_REQUERIDOS.filter((campo) => perfil[campo] === 'desconocido');
  if (faltantes.length > 0) {
    return resultadoFaltaDato('DS52', faltantes, REGLA_DS52);
  }

  if (perfil.tienePropiedad === true) {
    return resultadoDecision('DS52', false, 'Ya cuenta con vivienda propia.', REGLA_DS52);
  }
  if (perfil.subsidioPrevio !== 'ninguno') {
    return resultadoDecision('DS52', false, 'Ya cuenta con un subsidio habitacional anterior.', REGLA_DS52);
  }

  const postulanteEdad = perfil.postulanteEdad as number;
  const esAdultoMayor = postulanteEdad >= 60;
  const integrantes = perfil.integrantesGrupoFamiliar as { edad: number; discapacidadCertificada: boolean }[];

  if (postulanteEdad < 18) {
    return resultadoDecision('DS52', false, 'El postulante debe ser mayor de 18 años.', REGLA_DS52);
  }
  if (!esAdultoMayor && integrantes.length === 0) {
    return resultadoDecision(
      'DS52',
      false,
      'Debe postular al menos con cónyuge, conviviente civil, conviviente o hijo, salvo mayores de 60 años.',
      REGLA_DS52,
    );
  }

  const tramoRSH = perfil.tramoRSH as number;
  if (tramoRSH > 70) {
    return resultadoDecision('DS52', false, 'El tramo RSH debe ser 70% o menos.', REGLA_DS52);
  }

  const ahorroUF = perfil.ahorroUF as number;
  if (ahorroUF < 4) {
    return resultadoDecision('DS52', false, 'Se requiere un ahorro mínimo de 4 UF.', REGLA_DS52);
  }

  const tamanoGrupo = integrantes.length + 1;
  const ingresoMaxUF = INGRESO_MAX_BASE_UF + Math.max(0, tamanoGrupo - 3) * INGRESO_MAX_INCREMENTO_UF;
  const ingresoUF = perfil.ingresoFamiliarMensualUF as number;
  if (ingresoUF < INGRESO_MIN_UF || ingresoUF > ingresoMaxUF) {
    return resultadoDecision(
      'DS52',
      false,
      `El ingreso familiar mensual debe estar entre ${INGRESO_MIN_UF} y ${ingresoMaxUF} UF para un grupo de ${tamanoGrupo} personas.`,
      REGLA_DS52,
    );
  }

  return resultadoDecision(
    'DS52',
    true,
    'Cumple los requisitos de DS52: RSH ≤70%, ahorro ≥4 UF, ingreso dentro del rango, no propietario ni con subsidio previo.',
    REGLA_DS52,
  );
}
```

- [ ] **Step 4: Ejecutar y ver que pasa**

Run: `npm test -w backend`
Expected: 13 pruebas PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/src/rules-engine/ds52.ts backend/test/rules-engine/ds52.test.ts
git commit -m "feat: evaluarDS52"
```

---

### Task 7: Índice del rules-engine

**Files:**
- Create: `backend/src/rules-engine/index.ts`
- Test: `backend/test/rules-engine/index.test.ts`

**Interfaces:**
- Consumes: `evaluarDS49` (Task 3), `evaluarDS1` (Task 4), `evaluarDS19` (Task 5), `evaluarDS52` (Task 6).
- Produces: `evaluarTodosLosProgramas(perfil: Perfil): ResultadoPrograma[]`. Este es el punto de entrada que va a usar `chat-handler` (plan futuro).

- [ ] **Step 1: Escribir la prueba que falla**

`backend/test/rules-engine/index.test.ts`:

```ts
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
```

- [ ] **Step 2: Ejecutar y ver que falla**

Run: `npm test -w backend`
Expected: FAIL, no se puede resolver `../../src/rules-engine/index`.

- [ ] **Step 3: Implementar `index.ts`**

```ts
import type { Perfil } from './perfil.schema';
import type { ResultadoPrograma } from './tipos';
import { evaluarDS49 } from './ds49';
import { evaluarDS1 } from './ds1';
import { evaluarDS19 } from './ds19';
import { evaluarDS52 } from './ds52';

export function evaluarTodosLosProgramas(perfil: Perfil): ResultadoPrograma[] {
  return [evaluarDS49(perfil), evaluarDS1(perfil), evaluarDS19(perfil), evaluarDS52(perfil)];
}

export * from './tipos';
export * from './perfil.schema';
export { obtenerZonaDS1, type ZonaDS1 } from './zonas';
export { evaluarDS49 } from './ds49';
export { evaluarDS1 } from './ds1';
export { evaluarDS19 } from './ds19';
export { evaluarDS52 } from './ds52';
```

- [ ] **Step 4: Ejecutar y ver que pasa**

Run: `npm test -w backend`
Expected: 3 pruebas PASS. Total acumulado del workspace `backend`: 2 (handler) + 4 (perfil) + 6 (zonas) + 9 (DS49) + 10 (DS1) + 8 (DS19) + 13 (DS52) + 3 (index) = 55 pruebas PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/src/rules-engine/index.ts backend/test/rules-engine/index.test.ts
git commit -m "feat: evaluarTodosLosProgramas, punto de entrada del rules-engine"
```

---

## Self-Review (hecho antes de guardar el plan)

- **Cobertura del spec:** los 4 programas de `docs/programas-subsidio.md` tienen tarea propia; cada regla de elegibilidad (RSH, ahorro, propiedad, edad, ingreso, rutas DS19, zonas DS1) aparece codificada y con al menos un caso de prueba. El monto exacto de subsidio (UF) queda fuera a propósito — es `detalle` informativo, no bloquea `estado`, según lo acordado.
- **Placeholders:** ninguno — cada paso trae el código real, no hay "TODO" ni "similar a la tarea N".
- **Consistencia de tipos:** `ResultadoPrograma`, `Regla`, `resultadoFaltaDato`, `resultadoDecision` se definen una sola vez (Task 1) y se importan igual en las tareas 3-7. `Perfil` se usa con los mismos nombres de campo en las 4 evaluaciones. `evaluarTodosLosProgramas` importa exactamente los 4 nombres de función que producen las tareas 3-6.

## Planes siguientes

1. **`chat-handler`:** Lambda que conduce la conversación con Bedrock Converse, usa `evaluarTodosLosProgramas` como una de sus herramientas.
2. **Interfaz:** tarjetas de resultado por programa a partir de `ResultadoPrograma[]`, plan de papeles, `.ics`.
