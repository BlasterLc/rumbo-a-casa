# chat-handler — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `POST /api/chat` conversa con la familia usando Bedrock Converse y tres herramientas (`actualizar_perfil`, `evaluar_elegibilidad`, `generar_plan`), guarda perfil e historial en DynamoDB y devuelve texto más datos estructurados (perfil, resultados por programa y plan de papeles) para que la SPA muestre tarjetas.

**Architecture:** Módulos pequeños en `backend/src/chat/`: el perfil y sus cambios, el plan de papeles, las herramientas, el bucle de Converse y el repositorio de sesiones. Cada uno recibe sus dependencias de AWS inyectadas para poder probarlo sin tocar AWS. `backend/src/handler.ts` (la única Lambda, `apiFn`, que ya atiende todo `/api/*` detrás de CloudFront) suma la ruta `/api/chat`. En la infra **no** se agrega una segunda Lambda ni una ruta nueva de CloudFront: solo una tabla DynamoDB, permisos y variables de entorno para `apiFn`.

**Tech Stack:** TypeScript, Zod 4, Vitest, `@aws-sdk/client-bedrock-runtime` (Converse), `@aws-sdk/lib-dynamodb`, AWS CDK. Modelo: `us.anthropic.claude-haiku-4-5-20251001-v1:0` (perfil de inferencia cross-region `us.`).

**Spec:** `docs/superpowers/specs/2026-09-20-rumbo-a-casa-design.md` (secciones "Flujo de conversación", "Datos", "Manejo de errores y límites"). Reglas de negocio en `docs/programas-subsidio.md`.

## Global Constraints

- La elegibilidad la decide `evaluarTodosLosProgramas` (motor determinista). El LLM solo conversa y explica; nunca decide `elegible`/`no_elegible` por su cuenta (spec, "Reglas de diseño").
- Nunca se pide Clave Única. Sin login ni CAPTCHA (spec). El system prompt tampoco pide RUT, nombre completo, dirección ni datos bancarios.
- Si Zod rechaza un valor del modelo, se descarta y se le pide reformular (spec, "Manejo de errores y límites").
- Cuando falta un dato, el motor devuelve `falta_dato`; el código nunca adivina un valor del perfil.
- Tope de mensajes por sesión: `MAX_MENSAJES_POR_SESION = 40`. Tabla de sesiones con TTL de 30 días (spec, "Datos").
- Interfaz en español con opción en inglés: el asistente responde en el idioma del mensaje.
- Todo en `us-east-1`. No se agrega una segunda Lambda ni una segunda ruta de CloudFront.
- `backend/src/rules-engine/` sigue sin importar nada de AWS. Los imports de AWS SDK viven solo en `backend/src/chat/` y `backend/src/handler.ts`.
- No se publican IDs de cuenta AWS en el repo.
- Mensajes de commit sin atribución a Claude (sin `Co-Authored-By`, sin "Generated with Claude Code").
- Al escribir en español, sin voseo.

## Review Focus

- **El modelo manda un valor inválido junto a otros válidos** (p. ej. `tramoRSH: 150` y `region: 'Valparaíso'` en la misma llamada): se guarda la región, se rechaza solo el tramo y el modelo recibe el motivo para volver a preguntar. Test en Task 1.
- **El modelo no deja de pedir herramientas:** el bucle corta a las `MAX_VUELTAS_HERRAMIENTAS` vueltas, responde con un texto de respaldo y el historial guardado queda válido (no termina en un `toolUse` sin su `toolResult`). Test en Task 6.
- **Cuerpo de la petición en base64, JSON roto, sin `sessionId` o mensaje vacío:** CloudFront y la Function URL pueden mandar el cuerpo en base64. Debe responder 200 si viene bien y 400 (no 500) si viene mal. Tests en Task 7.
- **Bedrock falla** (throttling, o la cuenta todavía en verificación como pasó el 2026-09-22): responde 503 con un mensaje claro y **no** guarda la sesión, para que el mensaje del usuario no quede a medias en el historial. Test en Task 7.
- **La sesión llegó al tope de mensajes:** responde 429 sin llamar a Bedrock (control de gasto). Test en Task 7.

---

## Estructura de archivos

```
backend/
├── src/
│   ├── handler.ts                 # MODIFICAR: ruta /api/chat + crearHandler(deps)
│   ├── rules-engine/
│   │   └── ds52.ts                # MODIFICAR: nota en detalle cuando la región no es RM
│   └── chat/
│       ├── perfil.ts              # PERFIL_VACIO, VALOR_UF, aplicarCambios
│       ├── papeles.ts             # generarPlanPapeles
│       ├── herramientas.ts        # HERRAMIENTAS (tool specs) + ejecutarHerramienta
│       ├── sesion-repositorio.ts  # Sesion, RepositorioEnMemoria, RepositorioDynamo
│       └── conversar.ts           # SYSTEM_PROMPT + bucle de Converse
└── test/
    ├── handler.test.ts            # MODIFICAR
    ├── rules-engine/ds52.test.ts  # MODIFICAR
    └── chat/
        ├── fakes.ts               # respuestas falsas de Converse (compartidas)
        ├── perfil.test.ts
        ├── papeles.test.ts
        ├── herramientas.test.ts
        ├── sesion-repositorio.test.ts
        └── conversar.test.ts
infra/
├── lib/rumbo-stack.ts             # MODIFICAR: tabla, permisos, env, timeout
└── test/rumbo-stack.test.ts       # MODIFICAR
```

Nota sobre el diseño previo: en el diseño de módulos anotado el 2026-09-22 el primer archivo se llamaba `perfil-vacio.ts`. Aquí se llama `perfil.ts` porque también contiene `aplicarCambios` (la validación campo por campo y la conversión pesos → UF), que cambia junto con `PERFIL_VACIO`.

## Contrato de API para la SPA (compartir con Augusto)

`POST /api/chat`, `content-type: application/json`

```json
{ "sessionId": "<UUID v4 generado por la SPA y guardado en localStorage>", "mensaje": "texto, 1 a 2000 caracteres" }
```

Respuestas:

| Código | Cuerpo | Cuándo |
|---|---|---|
| 200 | `{ respuesta: string, perfil: Perfil, resultados: ResultadoPrograma[], plan: PlanPrograma[] }` | OK. `resultados` siempre trae los 4 programas; `plan` solo los `elegible`. |
| 400 | `{ error: 'solicitud_invalida' }` | JSON roto, `sessionId` que no es UUID, mensaje vacío o de más de 2000 caracteres. |
| 405 | `{ error: 'metodo_no_permitido' }` | Algo distinto de POST. |
| 429 | `{ error: 'limite_mensajes', mensaje: string }` | La sesión llegó a 40 mensajes. |
| 503 | `{ error: 'asistente_no_disponible', mensaje: string }` | Bedrock falló. La SPA debería ofrecer el modo demo. |
| 500 | `{ error: 'error_interno' }` | Falla de DynamoDB u otra inesperada. |

`Perfil` y `ResultadoPrograma` son los tipos de `backend/src/rules-engine/`; `PlanPrograma` se define en Task 3.

---

### Task 1: Perfil vacío y cambios validados campo por campo

**Files:**
- Create: `backend/src/chat/perfil.ts`
- Test: `backend/test/chat/perfil.test.ts`

**Interfaces:**
- Consumes: `PerfilSchema`, `type Perfil`, `evaluarTodosLosProgramas` desde `backend/src/rules-engine/index.ts`.
- Produces:
  - `const VALOR_UF: { clp: number; fecha: string; fuente: string }`
  - `const PERFIL_VACIO: Perfil` (los 13 campos en `'desconocido'`)
  - `interface CampoRechazado { campo: string; error: string }`
  - `interface ResultadoCambios { perfil: Perfil; aceptados: string[]; rechazados: CampoRechazado[] }`
  - `function aplicarCambios(perfil: Perfil, cambios: Record<string, unknown>): ResultadoCambios`

Reglas de `aplicarCambios`:
- Cada campo se valida por separado con `PerfilSchema.shape[campo]`. Los válidos se aplican y los inválidos van a `rechazados` con el mensaje de Zod. Un campo inválido no bloquea a los demás.
- Un campo que no existe en `Perfil` va a `rechazados` con `'Campo desconocido.'`.
- `ahorroCLP` (pesos) se convierte a `ahorroUF`, salvo que la misma llamada traiga `ahorroUF` explícito (en ese caso gana el explícito).
- Si solo llega `ingresoFamiliarMensualCLP`, se deriva `ingresoFamiliarMensualUF`, y al revés. DS52 usa UF y DS1 usa CLP; así ambos quedan con dato.
- UF redondeada a 2 decimales y CLP a entero. No muta el perfil de entrada.

El valor de la UF es una constante con fecha y fuente (40.991,75 CLP al 2026-09-22, según `mindicador.cl/api/uf`). La UF sube ~0,02 % al día; para los cortes de elegibilidad la diferencia en un mes es despreciable. Al ejecutar el plan se puede actualizar con `curl -s https://mindicador.cl/api/uf | head -c 200`, cambiando el número y la fecha (el test usa `VALOR_UF.clp`, no el número literal).

- [ ] **Step 1: Escribir la prueba que falla**

`backend/test/chat/perfil.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { PERFIL_VACIO, VALOR_UF, aplicarCambios } from '../../src/chat/perfil';
import { PerfilSchema, evaluarTodosLosProgramas } from '../../src/rules-engine/index';

describe('PERFIL_VACIO', () => {
  it('es un Perfil válido con los 13 campos en "desconocido"', () => {
    expect(() => PerfilSchema.parse(PERFIL_VACIO)).not.toThrow();
    const valores = Object.values(PERFIL_VACIO);
    expect(valores).toHaveLength(13);
    expect(valores.every((v) => v === 'desconocido')).toBe(true);
  });

  it('con el perfil vacío los 4 programas piden datos', () => {
    const resultados = evaluarTodosLosProgramas(PERFIL_VACIO);
    expect(resultados.every((r) => r.estado === 'falta_dato')).toBe(true);
  });
});

describe('aplicarCambios', () => {
  it('aplica campos válidos y los lista en aceptados', () => {
    const r = aplicarCambios(PERFIL_VACIO, { tramoRSH: 40, region: 'Biobío', tienePropiedad: false });
    expect(r.perfil.tramoRSH).toBe(40);
    expect(r.perfil.region).toBe('Biobío');
    expect(r.perfil.tienePropiedad).toBe(false);
    expect(r.aceptados.sort()).toEqual(['region', 'tienePropiedad', 'tramoRSH']);
    expect(r.rechazados).toEqual([]);
  });

  it('rechaza solo el campo inválido y aplica los demás de la misma llamada', () => {
    const r = aplicarCambios(PERFIL_VACIO, { tramoRSH: 150, region: 'Valparaíso' });
    expect(r.perfil.region).toBe('Valparaíso');
    expect(r.perfil.tramoRSH).toBe('desconocido');
    expect(r.aceptados).toEqual(['region']);
    expect(r.rechazados).toHaveLength(1);
    expect(r.rechazados[0].campo).toBe('tramoRSH');
    expect(r.rechazados[0].error.length).toBeGreaterThan(0);
  });

  it('rechaza una región que no es una de las 16', () => {
    const r = aplicarCambios(PERFIL_VACIO, { region: 'Santiago' });
    expect(r.perfil.region).toBe('desconocido');
    expect(r.rechazados.map((x) => x.campo)).toEqual(['region']);
  });

  it('rechaza campos que no existen en el perfil', () => {
    const r = aplicarCambios(PERFIL_VACIO, { rut: '11.111.111-1' });
    expect(r.rechazados).toEqual([{ campo: 'rut', error: 'Campo desconocido.' }]);
    expect(r.perfil).toEqual(PERFIL_VACIO);
  });

  it('convierte ahorroCLP a ahorroUF', () => {
    const r = aplicarCambios(PERFIL_VACIO, { ahorroCLP: VALOR_UF.clp * 10 });
    expect(r.perfil.ahorroUF).toBe(10);
    expect(r.aceptados).toEqual(['ahorroUF']);
  });

  it('rechaza un ahorroCLP negativo', () => {
    const r = aplicarCambios(PERFIL_VACIO, { ahorroCLP: -5 });
    expect(r.perfil.ahorroUF).toBe('desconocido');
    expect(r.rechazados.map((x) => x.campo)).toEqual(['ahorroCLP']);
  });

  it('si llegan ahorroUF y ahorroCLP, gana ahorroUF', () => {
    const r = aplicarCambios(PERFIL_VACIO, { ahorroUF: 12, ahorroCLP: 1 });
    expect(r.perfil.ahorroUF).toBe(12);
    expect(r.aceptados).toEqual(['ahorroUF']);
  });

  it('deriva el ingreso en UF cuando llega en pesos', () => {
    const r = aplicarCambios(PERFIL_VACIO, { ingresoFamiliarMensualCLP: VALOR_UF.clp * 20 });
    expect(r.perfil.ingresoFamiliarMensualCLP).toBe(VALOR_UF.clp * 20);
    expect(r.perfil.ingresoFamiliarMensualUF).toBe(20);
  });

  it('deriva el ingreso en pesos cuando llega en UF', () => {
    const r = aplicarCambios(PERFIL_VACIO, { ingresoFamiliarMensualUF: 20 });
    expect(r.perfil.ingresoFamiliarMensualCLP).toBe(Math.round(VALOR_UF.clp * 20));
  });

  it('no muta el perfil de entrada', () => {
    const original = { ...PERFIL_VACIO };
    aplicarCambios(PERFIL_VACIO, { tramoRSH: 40 });
    expect(PERFIL_VACIO).toEqual(original);
  });
});
```

- [ ] **Step 2: Ejecutar y ver que falla**

Run: `npm test -w backend -- test/chat/perfil.test.ts`
Expected: FAIL, no se puede resolver `../../src/chat/perfil`.

- [ ] **Step 3: Implementar `backend/src/chat/perfil.ts`**

```ts
import type { z } from 'zod';
import { PerfilSchema, type Perfil } from '../rules-engine/index';

export const VALOR_UF = {
  clp: 40_991.75,
  fecha: '2026-09-22',
  fuente: 'mindicador.cl/api/uf',
} as const;

export const PERFIL_VACIO: Perfil = {
  postulanteEdad: 'desconocido',
  region: 'desconocido',
  zonaEspecial: 'desconocido',
  tramoRSH: 'desconocido',
  tienePropiedad: 'desconocido',
  ahorroUF: 'desconocido',
  antiguedadCuentaAhorroMeses: 'desconocido',
  ingresoFamiliarMensualUF: 'desconocido',
  ingresoFamiliarMensualCLP: 'desconocido',
  integrantesGrupoFamiliar: 'desconocido',
  excepcionPostulacionIndividualDS49: 'desconocido',
  subsidioPrevio: 'desconocido',
  objetivo: 'desconocido',
};

export interface CampoRechazado {
  campo: string;
  error: string;
}

export interface ResultadoCambios {
  perfil: Perfil;
  aceptados: string[];
  rechazados: CampoRechazado[];
}

const aUF = (clp: number) => Math.round((clp / VALOR_UF.clp) * 100) / 100;
const aCLP = (uf: number) => Math.round(uf * VALOR_UF.clp);

const esCampoPerfil = (campo: string): campo is keyof Perfil => campo in PerfilSchema.shape;

export function aplicarCambios(perfil: Perfil, cambios: Record<string, unknown>): ResultadoCambios {
  const nuevo: Record<string, unknown> = { ...perfil };
  const aceptados: string[] = [];
  const rechazados: CampoRechazado[] = [];

  for (const [campo, valor] of Object.entries(cambios)) {
    if (campo === 'ahorroCLP') {
      if ('ahorroUF' in cambios) continue;
      if (typeof valor === 'number' && Number.isFinite(valor) && valor >= 0) {
        nuevo.ahorroUF = aUF(valor);
        aceptados.push('ahorroUF');
      } else {
        rechazados.push({ campo, error: 'Debe ser un número mayor o igual a 0, en pesos chilenos.' });
      }
      continue;
    }
    if (!esCampoPerfil(campo)) {
      rechazados.push({ campo, error: 'Campo desconocido.' });
      continue;
    }
    const esquema: z.ZodType = PerfilSchema.shape[campo];
    const resultado = esquema.safeParse(valor);
    if (resultado.success) {
      nuevo[campo] = resultado.data;
      aceptados.push(campo);
    } else {
      rechazados.push({ campo, error: resultado.error.issues.map((i) => i.message).join('; ') });
    }
  }

  // DS52 evalúa el ingreso en UF y DS1 en pesos: si llega uno solo, se deriva el otro.
  const llegoCLP = aceptados.includes('ingresoFamiliarMensualCLP');
  const llegoUF = aceptados.includes('ingresoFamiliarMensualUF');
  if (llegoCLP && !llegoUF) {
    const clp = nuevo.ingresoFamiliarMensualCLP;
    nuevo.ingresoFamiliarMensualUF = typeof clp === 'number' ? aUF(clp) : 'desconocido';
  }
  if (llegoUF && !llegoCLP) {
    const uf = nuevo.ingresoFamiliarMensualUF;
    nuevo.ingresoFamiliarMensualCLP = typeof uf === 'number' ? aCLP(uf) : 'desconocido';
  }

  return { perfil: nuevo as Perfil, aceptados, rechazados };
}
```

- [ ] **Step 4: Ejecutar y ver que pasa**

Run: `npm test -w backend -- test/chat/perfil.test.ts && npx tsc --noEmit -p backend`
Expected: PASS y typecheck sin errores.

- [ ] **Step 5: Commit**

```bash
git add backend/src/chat/perfil.ts backend/test/chat/perfil.test.ts
git commit -m "feat: perfil vacío y cambios de perfil validados campo por campo"
```

---

### Task 2: Nota de DS52 fuera de la Región Metropolitana

Las cifras de ingreso y montos de DS52 son las del llamado de Serviu Metropolitano (`docs/programas-subsidio.md`, sección DS52, y "Notas para la implementación": fuera de RM, toda cifra va con "puede variar según tu región/comuna, verifica en minvu.gob.cl"). Cuando la región no es `'Metropolitana'` (incluye `'desconocido'`, porque no está confirmada), toda decisión de DS52 (`elegible` o `no_elegible`) lleva esa nota en `detalle.nota`. `falta_dato` no cambia.

Esto toca `rules-engine`: sigue siendo TypeScript puro, sin imports nuevos.

**Files:**
- Modify: `backend/src/rules-engine/ds52.ts`
- Test: `backend/test/rules-engine/ds52.test.ts` (agregar un `describe` al final)

**Interfaces:**
- Produces: `evaluarDS52(perfil)` sin cambios de firma. Fuera de RM, `resultado.detalle = { nota: string }`. En RM, `detalle` queda `undefined` como hoy.

- [ ] **Step 1: Escribir la prueba que falla**

Agregar al final de `backend/test/rules-engine/ds52.test.ts` (reusa la constante `base`, que ya está en ese archivo con `region: 'Metropolitana'` y sale elegible):

```ts
describe('evaluarDS52: nota fuera de la Región Metropolitana', () => {
  it('en RM no agrega nota', () => {
    expect(evaluarDS52(base).detalle).toBeUndefined();
  });

  it('elegible fuera de RM lleva la nota de verificar en minvu.gob.cl', () => {
    const r = evaluarDS52({ ...base, region: 'Valparaíso' });
    expect(r.estado).toBe('elegible');
    expect(String(r.detalle?.nota)).toContain('minvu.gob.cl');
  });

  it('no_elegible fuera de RM también lleva la nota', () => {
    const r = evaluarDS52({ ...base, region: 'Biobío', tramoRSH: 80 });
    expect(r.estado).toBe('no_elegible');
    expect(String(r.detalle?.nota)).toContain('minvu.gob.cl');
  });

  it('con región desconocida lleva la nota (no está confirmada RM)', () => {
    const r = evaluarDS52({ ...base, region: 'desconocido' });
    expect(String(r.detalle?.nota)).toContain('minvu.gob.cl');
  });

  it('falta_dato no lleva detalle', () => {
    const r = evaluarDS52({ ...base, region: 'Maule', ahorroUF: 'desconocido' });
    expect(r.estado).toBe('falta_dato');
    expect(r.detalle).toBeUndefined();
  });
});
```

- [ ] **Step 2: Ejecutar y ver que falla**

Run: `npm test -w backend -- test/rules-engine/ds52.test.ts`
Expected: FAIL en los 3 tests que esperan la nota (`detalle` es `undefined`).

- [ ] **Step 3: Implementar**

En `backend/src/rules-engine/ds52.ts`, debajo de las constantes `INGRESO_*`, agregar:

```ts
const NOTA_FUERA_DE_RM =
  'Los requisitos de ingreso y los montos corresponden al llamado de la Región Metropolitana; pueden variar según tu región o comuna, verifica en minvu.gob.cl.';

function decidir(perfil: Perfil, elegible: boolean, motivo: string): ResultadoPrograma {
  const detalle = perfil.region === 'Metropolitana' ? undefined : { nota: NOTA_FUERA_DE_RM };
  return resultadoDecision('DS52', elegible, motivo, REGLA_DS52, detalle);
}
```

Luego reemplazar **cada** llamada `resultadoDecision('DS52', <elegible>, <motivo>, REGLA_DS52)` dentro de `evaluarDS52` por `decidir(perfil, <elegible>, <motivo>)`. Son 8 llamadas: vivienda propia, subsidio previo, menor de 18, sin núcleo familiar, RSH > 70, ahorro < 4, ingreso fuera de rango y la final elegible. Por ejemplo:

```ts
  if (perfil.tienePropiedad === true) {
    return decidir(perfil, false, 'Ya cuenta con vivienda propia.');
  }
```

Al terminar, `grep -c "resultadoDecision('DS52'" backend/src/rules-engine/ds52.ts` debe devolver `1` (solo la de `decidir`).

- [ ] **Step 4: Ejecutar y ver que pasa**

Run: `npm test -w backend && npx tsc --noEmit -p backend`
Expected: PASS en todo el backend (los tests previos de DS52 siguen pasando porque en `base` la región es RM).

- [ ] **Step 5: Commit**

```bash
git add backend/src/rules-engine/ds52.ts backend/test/rules-engine/ds52.test.ts
git commit -m "feat: DS52 avisa que las cifras son de RM cuando la región es otra"
```

---

### Task 3: Plan de papeles por programa elegible

La lista sale de los documentos oficiales en `dsDocs/` (carpeta local, no versionada):
- DS49: `DJ49-1-DECLARACION-DE-NUCLEO-DSN49-.pdf`, `DJ49-2-DECLARACION-JURADA-DE-POSTULACION-DSN49.pdf`, `DJ49-3-MANDATO-AHORRO-DSN49-1.pdf`, `FORMULARIO-DE-POSTULACION-INDIVIDUAL-FSEV-2019-f.pdf`.
- DS19: `DECLARAC-JURADA-DE-POSTULACION-DS-19_2023.doc`, `DECLARAC-NuCLEO-FAMILIAR-Y-NO-PROPIEDAD-DS-19-17.doc`, y el díptico `DS19-diptico.pdf` (comprobante de inscripción o reserva en el proyecto; con subsidio previo, el certificado de subsidio).
- DS52: díptico `Diptico-Subsidio-de-Arriendo.pdf` de Serviu Metropolitano (formularios A-01, A-02 y A-03, documentos de ingresos según la circular N°22, certificado de mantención de cuenta).
- DS1: **no hay formularios en `dsDocs/`**. Se listan solo los requisitos generales de `docs/programas-subsidio.md` y se remite a los formularios del llamado (Res. Ex. N°669/2026) en Serviu. La `fuente` lo dice explícitamente.

**Files:**
- Create: `backend/src/chat/papeles.ts`
- Test: `backend/test/chat/papeles.test.ts`

**Interfaces:**
- Consumes: `type Programa`, `type ResultadoPrograma` desde `backend/src/rules-engine/index.ts`.
- Produces:
  - `interface Documento { nombre: string; detalle?: string }`
  - `interface PlanPrograma { programa: Programa; documentos: Documento[]; fuente: string }`
  - `function generarPlanPapeles(resultados: ResultadoPrograma[]): PlanPrograma[]`: un `PlanPrograma` por cada resultado con `estado === 'elegible'`, en el mismo orden; los demás se omiten. DS19 con `detalle.ruta === 'A'` agrega el certificado de subsidio.

- [ ] **Step 1: Escribir la prueba que falla**

`backend/test/chat/papeles.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { generarPlanPapeles } from '../../src/chat/papeles';
import type { EstadoElegibilidad, Programa, ResultadoPrograma } from '../../src/rules-engine/index';

const resultado = (
  programa: Programa,
  estado: EstadoElegibilidad,
  detalle?: Record<string, unknown>,
): ResultadoPrograma => ({
  programa,
  estado,
  motivo: 'x',
  regla: { decreto: 'x', fuente: 'x', fechaConsulta: '2026-09-22' },
  detalle,
});

const nombres = (plan: ReturnType<typeof generarPlanPapeles>[number]) =>
  plan.documentos.map((d) => d.nombre).join(' | ');

describe('generarPlanPapeles', () => {
  it('sin programas elegibles devuelve un plan vacío', () => {
    expect(
      generarPlanPapeles([resultado('DS49', 'no_elegible'), resultado('DS52', 'falta_dato')]),
    ).toEqual([]);
  });

  it('solo arma plan para los programas elegibles, en orden', () => {
    const plan = generarPlanPapeles([
      resultado('DS49', 'elegible'),
      resultado('DS1', 'no_elegible'),
      resultado('DS52', 'elegible'),
    ]);
    expect(plan.map((p) => p.programa)).toEqual(['DS49', 'DS52']);
  });

  it('todo plan incluye cédula y Cartola Hogar del RSH', () => {
    const plan = generarPlanPapeles(
      (['DS49', 'DS1', 'DS19', 'DS52'] as const).map((p) => resultado(p, 'elegible')),
    );
    for (const p of plan) {
      expect(nombres(p)).toContain('Cédula de identidad vigente');
      expect(nombres(p)).toContain('Cartola Hogar');
      expect(p.fuente.length).toBeGreaterThan(0);
    }
  });

  it('DS49 incluye las tres declaraciones y el formulario de postulación', () => {
    const [ds49] = generarPlanPapeles([resultado('DS49', 'elegible')]);
    expect(nombres(ds49)).toContain('Declaración de Núcleo Familiar');
    expect(nombres(ds49)).toContain('Declaración Jurada de Postulación');
    expect(nombres(ds49)).toContain('Mandato de Ahorro');
    expect(nombres(ds49)).toContain('Formulario de Postulación');
  });

  it('DS52 incluye los formularios A-01, A-02 y A-03', () => {
    const [ds52] = generarPlanPapeles([resultado('DS52', 'elegible')]);
    expect(nombres(ds52)).toContain('A-01');
    expect(nombres(ds52)).toContain('A-02');
    expect(nombres(ds52)).toContain('A-03');
  });

  it('DS19 ruta A agrega el certificado de subsidio; ruta B no', () => {
    const [rutaA] = generarPlanPapeles([resultado('DS19', 'elegible', { ruta: 'A' })]);
    const [rutaB] = generarPlanPapeles([resultado('DS19', 'elegible', { ruta: 'B' })]);
    expect(nombres(rutaA)).toContain('Certificado de subsidio');
    expect(nombres(rutaB)).not.toContain('Certificado de subsidio');
  });

  it('DS1 avisa en la fuente que los formularios son los del llamado vigente', () => {
    const [ds1] = generarPlanPapeles([resultado('DS1', 'elegible')]);
    expect(ds1.fuente).toContain('669/2026');
  });
});
```

- [ ] **Step 2: Ejecutar y ver que falla**

Run: `npm test -w backend -- test/chat/papeles.test.ts`
Expected: FAIL, no se puede resolver `../../src/chat/papeles`.

- [ ] **Step 3: Implementar `backend/src/chat/papeles.ts`**

```ts
import type { Programa, ResultadoPrograma } from '../rules-engine/index';

export interface Documento {
  nombre: string;
  detalle?: string;
}

export interface PlanPrograma {
  programa: Programa;
  documentos: Documento[];
  fuente: string;
}

const COMUNES: Documento[] = [
  {
    nombre: 'Cédula de identidad vigente',
    detalle: 'De quien postula y de cada integrante del grupo familiar mayor de 18 años.',
  },
  {
    nombre: 'Cartola Hogar del Registro Social de Hogares',
    detalle: 'Se obtiene en registrosocial.gob.cl o en tu municipalidad.',
  },
];

const POR_PROGRAMA: Record<Programa, { documentos: Documento[]; fuente: string }> = {
  DS49: {
    documentos: [
      { nombre: 'Formulario de Postulación Individual (FSEV)' },
      { nombre: 'Declaración de Núcleo Familiar (DJ49-1)' },
      { nombre: 'Declaración Jurada de Postulación (DJ49-2)' },
      { nombre: 'Mandato de Ahorro (DJ49-3)' },
      {
        nombre: 'Certificado de la cuenta de ahorro para la vivienda',
        detalle: 'Con al menos 10 UF de ahorro.',
      },
    ],
    fuente: 'Formularios oficiales DS49 del MINVU (DJ49-1, DJ49-2, DJ49-3 y formulario FSEV 2019).',
  },
  DS1: {
    documentos: [
      {
        nombre: 'Certificado de la cuenta de ahorro para la vivienda',
        detalle: 'Con al menos 12 meses de antigüedad y el ahorro mínimo de tu tramo.',
      },
      {
        nombre: 'Formularios de postulación del llamado vigente',
        detalle: 'Los entrega Serviu o están en minvu.gob.cl.',
      },
    ],
    fuente:
      'Requisitos generales de DS1 (Res. Ex. N°669/2026). Los formularios específicos del llamado no se revisaron; confírmalos en Serviu.',
  },
  DS19: {
    documentos: [
      { nombre: 'Declaración Jurada de Postulación DS19' },
      { nombre: 'Declaración de Núcleo Familiar y No Propiedad DS19' },
      {
        nombre: 'Comprobante de inscripción o reserva en el proyecto',
        detalle: 'Lo entrega la inmobiliaria o constructora del proyecto que elijas.',
      },
    ],
    fuente: 'Declaraciones oficiales DS19 del MINVU y díptico DS19 (v/diciembre 2022).',
  },
  DS52: {
    documentos: [
      { nombre: 'Formulario A-01: Declaración de ahorro' },
      {
        nombre: 'Formulario A-02: Declaración de Núcleo Familiar',
        detalle: 'Firmado por todos los mayores de 18 años, o con huella digital si alguien no puede firmar.',
      },
      { nombre: 'Formulario A-03: Declaración jurada de postulación' },
      {
        nombre: 'Documentos para acreditar ingresos',
        detalle:
          'Por ejemplo, las 6 últimas liquidaciones de sueldo, certificado de cotizaciones AFP y salud, o carpeta tributaria del SII.',
      },
      {
        nombre: 'Certificado de mantención de la cuenta de ahorro',
        detalle: 'Solo si tu banco no tiene conexión en línea con Serviu. Con no más de 30 días de antigüedad.',
      },
    ],
    fuente: 'Díptico "Subsidio de Arriendo Regular" de Serviu Metropolitano (Región Metropolitana).',
  },
};

const CERTIFICADO_SUBSIDIO: Documento = {
  nombre: 'Certificado de subsidio vigente',
  detalle: 'El certificado de tu subsidio DS49, DS1 Tramo 1 o de damnificado.',
};

export function generarPlanPapeles(resultados: ResultadoPrograma[]): PlanPrograma[] {
  return resultados
    .filter((r) => r.estado === 'elegible')
    .map((r) => {
      const { documentos, fuente } = POR_PROGRAMA[r.programa];
      const extra = r.programa === 'DS19' && r.detalle?.ruta === 'A' ? [CERTIFICADO_SUBSIDIO] : [];
      return { programa: r.programa, documentos: [...COMUNES, ...documentos, ...extra], fuente };
    });
}
```

- [ ] **Step 4: Ejecutar y ver que pasa**

Run: `npm test -w backend -- test/chat/papeles.test.ts && npx tsc --noEmit -p backend`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/src/chat/papeles.ts backend/test/chat/papeles.test.ts
git commit -m "feat: plan de papeles por programa elegible"
```

---

### Task 4: Herramientas para Bedrock

**Files:**
- Modify: `backend/package.json` (dependencia nueva, vía npm)
- Create: `backend/src/chat/herramientas.ts`
- Test: `backend/test/chat/herramientas.test.ts`

**Interfaces:**
- Consumes: `aplicarCambios` (Task 1), `generarPlanPapeles` (Task 3), `evaluarTodosLosProgramas`, `PerfilSchema`, `type Perfil` (rules-engine).
- Produces:
  - `const HERRAMIENTAS: Tool[]` (tipo `Tool` de `@aws-sdk/client-bedrock-runtime`), con los nombres `actualizar_perfil`, `evaluar_elegibilidad` y `generar_plan`.
  - `interface ResultadoHerramienta { perfil: Perfil; salida: Record<string, unknown>; error: boolean }`
  - `function ejecutarHerramienta(nombre: string, input: unknown, perfil: Perfil): ResultadoHerramienta`
    - `actualizar_perfil` → `salida: { aceptados, rechazados }`. Si `input` no es un objeto: `error: true`.
    - `evaluar_elegibilidad` → `salida: { resultados: ResultadoPrograma[] }`
    - `generar_plan` → `salida: { plan: PlanPrograma[] }`
    - cualquier otro nombre → `error: true`, `salida: { error: 'Herramienta desconocida: <nombre>' }`, perfil sin cambios.

El JSON Schema de `actualizar_perfil` se genera desde `PerfilSchema` con `z.toJSONSchema` (Zod 4), así no se duplica la definición del perfil. Se le quita la clave `$schema` y se hace un paso por `JSON.parse(JSON.stringify(...))` para que el tipo sea JSON plano, como espera `inputSchema.json` del SDK.

- [ ] **Step 1: Instalar el cliente de Bedrock Runtime**

Run: `npm install @aws-sdk/client-bedrock-runtime -w backend`
Expected: aparece en `dependencies` de `backend/package.json`.

- [ ] **Step 2: Escribir la prueba que falla**

`backend/test/chat/herramientas.test.ts`:

```ts
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
```

- [ ] **Step 3: Ejecutar y ver que falla**

Run: `npm test -w backend -- test/chat/herramientas.test.ts`
Expected: FAIL, no se puede resolver `../../src/chat/herramientas`.

- [ ] **Step 4: Implementar `backend/src/chat/herramientas.ts`**

```ts
import { z } from 'zod';
import type { Tool } from '@aws-sdk/client-bedrock-runtime';
import { PerfilSchema, evaluarTodosLosProgramas, type Perfil } from '../rules-engine/index';
import { aplicarCambios } from './perfil';
import { generarPlanPapeles } from './papeles';

const CambiosPerfilSchema = PerfilSchema.partial().extend({
  ahorroCLP: z.number().min(0).optional(),
});

// inputSchema.json espera JSON plano: se quita $schema y se normaliza con un paso por JSON.
const esquemaJson = (esquema: z.ZodType) => {
  const { $schema: _omitido, ...resto } = z.toJSONSchema(esquema) as Record<string, unknown>;
  return JSON.parse(JSON.stringify(resto));
};

const SIN_PARAMETROS = { type: 'object', properties: {} };

export const HERRAMIENTAS: Tool[] = [
  {
    toolSpec: {
      name: 'actualizar_perfil',
      description:
        'Guarda uno o más datos del perfil de la familia apenas los menciona. Envía solo los campos que conoces. Devuelve los campos aceptados y los rechazados con el motivo.',
      inputSchema: { json: esquemaJson(CambiosPerfilSchema) },
    },
  },
  {
    toolSpec: {
      name: 'evaluar_elegibilidad',
      description:
        'Evalúa los 4 programas (DS49, DS1, DS19, DS52) con el perfil guardado. Devuelve, por programa, estado (elegible, no_elegible o falta_dato), motivo, campos faltantes y la regla citada.',
      inputSchema: { json: SIN_PARAMETROS },
    },
  },
  {
    toolSpec: {
      name: 'generar_plan',
      description:
        'Devuelve la lista de papeles a reunir para cada programa en que la familia sale elegible, con la fuente de cada lista.',
      inputSchema: { json: SIN_PARAMETROS },
    },
  },
];

export interface ResultadoHerramienta {
  perfil: Perfil;
  salida: Record<string, unknown>;
  error: boolean;
}

export function ejecutarHerramienta(nombre: string, input: unknown, perfil: Perfil): ResultadoHerramienta {
  switch (nombre) {
    case 'actualizar_perfil': {
      if (typeof input !== 'object' || input === null || Array.isArray(input)) {
        return {
          perfil,
          salida: { error: 'La entrada debe ser un objeto con campos del perfil.' },
          error: true,
        };
      }
      const { perfil: nuevo, aceptados, rechazados } = aplicarCambios(perfil, input as Record<string, unknown>);
      return { perfil: nuevo, salida: { aceptados, rechazados }, error: false };
    }
    case 'evaluar_elegibilidad':
      return { perfil, salida: { resultados: evaluarTodosLosProgramas(perfil) }, error: false };
    case 'generar_plan':
      return {
        perfil,
        salida: { plan: generarPlanPapeles(evaluarTodosLosProgramas(perfil)) },
        error: false,
      };
    default:
      return { perfil, salida: { error: `Herramienta desconocida: ${nombre}` }, error: true };
  }
}
```

- [ ] **Step 5: Ejecutar y ver que pasa**

Run: `npm test -w backend -- test/chat/herramientas.test.ts && npx tsc --noEmit -p backend`
Expected: PASS. Si `tsc` reclama por `_omitido` sin usar, no es error (`noUnusedLocals` no está activo en `tsconfig.base.json`).

- [ ] **Step 6: Commit**

```bash
git add backend/package.json package-lock.json backend/src/chat/herramientas.ts backend/test/chat/herramientas.test.ts
git commit -m "feat: herramientas de Bedrock sobre el motor de reglas"
```

---

### Task 5: Repositorio de sesiones (memoria y DynamoDB)

**Files:**
- Modify: `backend/package.json` (dependencias nuevas, vía npm)
- Create: `backend/src/chat/sesion-repositorio.ts`
- Test: `backend/test/chat/sesion-repositorio.test.ts`

**Interfaces:**
- Consumes: `PERFIL_VACIO` (Task 1), `PerfilSchema`, `type Perfil` (rules-engine), `type Message` (`@aws-sdk/client-bedrock-runtime`).
- Produces:
  - `const TTL_SEGUNDOS = 2_592_000` (30 días)
  - `interface Sesion { sessionId: string; perfil: Perfil; historial: Message[]; mensajes: number }`
  - `interface RepositorioSesiones { obtener(sessionId: string): Promise<Sesion>; guardar(sesion: Sesion): Promise<void> }`
  - `function sesionNueva(sessionId: string): Sesion`
  - `class RepositorioEnMemoria implements RepositorioSesiones` (para tests; devuelve copias)
  - `class RepositorioDynamo implements RepositorioSesiones`, `constructor(cliente: Pick<DynamoDBDocumentClient, 'send'>, tabla: string, ahoraMs: () => number = Date.now)`. Clave de partición `sessionId`; atributo TTL `expiraEn` (segundos epoch).

`obtener` nunca falla por una sesión inexistente: devuelve `sesionNueva`. Si el perfil guardado ya no pasa `PerfilSchema` (porque el esquema cambió entre deploys), reinicia perfil e historial pero **conserva** `mensajes`, para que el tope no se pueda saltar.

- [ ] **Step 1: Instalar los clientes de DynamoDB**

Run: `npm install @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb -w backend`
Expected: ambos en `dependencies` de `backend/package.json`.

- [ ] **Step 2: Escribir la prueba que falla**

`backend/test/chat/sesion-repositorio.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest';
import { GetCommand, PutCommand, type DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import {
  RepositorioDynamo,
  RepositorioEnMemoria,
  TTL_SEGUNDOS,
  sesionNueva,
  type Sesion,
} from '../../src/chat/sesion-repositorio';
import { PERFIL_VACIO } from '../../src/chat/perfil';

const clienteFalso = (respuesta: unknown = {}) => {
  const send = vi.fn().mockResolvedValue(respuesta);
  return { send, cliente: { send } as unknown as Pick<DynamoDBDocumentClient, 'send'> };
};

const sesionConDatos: Sesion = {
  sessionId: 's-1',
  perfil: { ...PERFIL_VACIO, tramoRSH: 40 },
  historial: [{ role: 'user', content: [{ text: 'hola' }] }],
  mensajes: 3,
};

describe('sesionNueva', () => {
  it('parte con el perfil vacío, sin historial y en 0 mensajes', () => {
    expect(sesionNueva('abc')).toEqual({ sessionId: 'abc', perfil: PERFIL_VACIO, historial: [], mensajes: 0 });
  });
});

describe('RepositorioEnMemoria', () => {
  it('devuelve una sesión nueva si no existe', async () => {
    const repo = new RepositorioEnMemoria();
    expect(await repo.obtener('nuevo')).toEqual(sesionNueva('nuevo'));
  });

  it('guarda y recupera una copia (no la misma referencia)', async () => {
    const repo = new RepositorioEnMemoria();
    await repo.guardar(sesionConDatos);
    const leida = await repo.obtener('s-1');
    expect(leida).toEqual(sesionConDatos);
    expect(leida).not.toBe(sesionConDatos);
  });
});

describe('RepositorioDynamo', () => {
  it('obtener pide el item por sessionId a la tabla configurada', async () => {
    const { send, cliente } = clienteFalso({ Item: sesionConDatos });
    const repo = new RepositorioDynamo(cliente, 'TablaSesiones');
    const leida = await repo.obtener('s-1');
    const comando = send.mock.calls[0][0];
    expect(comando).toBeInstanceOf(GetCommand);
    expect(comando.input).toEqual({ TableName: 'TablaSesiones', Key: { sessionId: 's-1' } });
    expect(leida).toEqual(sesionConDatos);
  });

  it('obtener devuelve una sesión nueva si no hay item', async () => {
    const { cliente } = clienteFalso({});
    const repo = new RepositorioDynamo(cliente, 'T');
    expect(await repo.obtener('nada')).toEqual(sesionNueva('nada'));
  });

  it('si el perfil guardado ya no es válido, reinicia perfil e historial pero conserva mensajes', async () => {
    const { cliente } = clienteFalso({
      Item: { ...sesionConDatos, perfil: { tramoRSH: 'cuarenta' } },
    });
    const repo = new RepositorioDynamo(cliente, 'T');
    const leida = await repo.obtener('s-1');
    expect(leida.perfil).toEqual(PERFIL_VACIO);
    expect(leida.historial).toEqual([]);
    expect(leida.mensajes).toBe(3);
  });

  it('guardar escribe el item con expiraEn a 30 días', async () => {
    const { send, cliente } = clienteFalso();
    const repo = new RepositorioDynamo(cliente, 'T', () => 1_000_000_000);
    await repo.guardar(sesionConDatos);
    const comando = send.mock.calls[0][0];
    expect(comando).toBeInstanceOf(PutCommand);
    expect(comando.input).toEqual({
      TableName: 'T',
      Item: { ...sesionConDatos, expiraEn: 1_000_000 + TTL_SEGUNDOS },
    });
  });
});
```

- [ ] **Step 3: Ejecutar y ver que falla**

Run: `npm test -w backend -- test/chat/sesion-repositorio.test.ts`
Expected: FAIL, no se puede resolver `../../src/chat/sesion-repositorio`.

- [ ] **Step 4: Implementar `backend/src/chat/sesion-repositorio.ts`**

```ts
import { GetCommand, PutCommand, type DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import type { Message } from '@aws-sdk/client-bedrock-runtime';
import { PerfilSchema, type Perfil } from '../rules-engine/index';
import { PERFIL_VACIO } from './perfil';

export const TTL_SEGUNDOS = 30 * 24 * 60 * 60;

export interface Sesion {
  sessionId: string;
  perfil: Perfil;
  historial: Message[];
  mensajes: number;
}

export interface RepositorioSesiones {
  obtener(sessionId: string): Promise<Sesion>;
  guardar(sesion: Sesion): Promise<void>;
}

export const sesionNueva = (sessionId: string): Sesion => ({
  sessionId,
  perfil: { ...PERFIL_VACIO },
  historial: [],
  mensajes: 0,
});

export class RepositorioEnMemoria implements RepositorioSesiones {
  private readonly sesiones = new Map<string, Sesion>();

  async obtener(sessionId: string): Promise<Sesion> {
    return structuredClone(this.sesiones.get(sessionId) ?? sesionNueva(sessionId));
  }

  async guardar(sesion: Sesion): Promise<void> {
    this.sesiones.set(sesion.sessionId, structuredClone(sesion));
  }
}

export class RepositorioDynamo implements RepositorioSesiones {
  constructor(
    private readonly cliente: Pick<DynamoDBDocumentClient, 'send'>,
    private readonly tabla: string,
    private readonly ahoraMs: () => number = Date.now,
  ) {}

  async obtener(sessionId: string): Promise<Sesion> {
    const { Item } = await this.cliente.send(
      new GetCommand({ TableName: this.tabla, Key: { sessionId } }),
    );
    if (!Item) return sesionNueva(sessionId);

    const mensajes = typeof Item.mensajes === 'number' ? Item.mensajes : 0;
    const perfil = PerfilSchema.safeParse(Item.perfil);
    if (!perfil.success) return { ...sesionNueva(sessionId), mensajes };

    return {
      sessionId,
      perfil: perfil.data,
      historial: Array.isArray(Item.historial) ? (Item.historial as Message[]) : [],
      mensajes,
    };
  }

  async guardar(sesion: Sesion): Promise<void> {
    const expiraEn = Math.floor(this.ahoraMs() / 1000) + TTL_SEGUNDOS;
    await this.cliente.send(new PutCommand({ TableName: this.tabla, Item: { ...sesion, expiraEn } }));
  }
}
```

- [ ] **Step 5: Ejecutar y ver que pasa**

Run: `npm test -w backend -- test/chat/sesion-repositorio.test.ts && npx tsc --noEmit -p backend`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add backend/package.json package-lock.json backend/src/chat/sesion-repositorio.ts backend/test/chat/sesion-repositorio.test.ts
git commit -m "feat: repositorio de sesiones en memoria y DynamoDB"
```

---

### Task 6: Bucle de conversación con Bedrock Converse

**Files:**
- Create: `backend/src/chat/conversar.ts`
- Create: `backend/test/chat/fakes.ts`
- Test: `backend/test/chat/conversar.test.ts`

**Interfaces:**
- Consumes: `HERRAMIENTAS`, `ejecutarHerramienta` (Task 4), `type Perfil`, tipos `ContentBlock`, `ConverseCommandInput`, `ConverseCommandOutput`, `Message` de `@aws-sdk/client-bedrock-runtime`.
- Produces:
  - `type InvocarConverse = (input: ConverseCommandInput) => Promise<ConverseCommandOutput>`: el handler lo arma con `(input) => cliente.send(new ConverseCommand(input))`; los tests pasan una función falsa.
  - `const SYSTEM_PROMPT: string`
  - `const MAX_VUELTAS_HERRAMIENTAS = 6`
  - `const RESPUESTA_RESPALDO: string`
  - `interface EntradaConversar { perfil: Perfil; historial: Message[]; mensaje: string }`
  - `interface SalidaConversar { perfil: Perfil; historial: Message[]; respuesta: string }`
  - `function conversar(invocar: InvocarConverse, modelId: string, entrada: EntradaConversar): Promise<SalidaConversar>`. Si `invocar` lanza un error, `conversar` lo propaga (el handler lo convierte en 503).
- En `test/chat/fakes.ts`: `respuestaTexto(texto: string): ConverseCommandOutput` y `respuestaHerramienta(nombre: string, input: unknown, toolUseId?: string): ConverseCommandOutput` (Task 7 también las usa).

Comportamiento:
1. Agrega el mensaje del usuario al historial y llama a `invocar` con `system`, `messages`, `toolConfig: { tools: HERRAMIENTAS }` y `inferenceConfig: { maxTokens: 1024, temperature: 0.3 }`.
2. Si `stopReason === 'tool_use'` y hay bloques `toolUse`: agrega el mensaje del asistente tal cual, ejecuta cada herramienta en orden sobre el perfil (se va actualizando) y agrega **un** mensaje `user` con todos los `toolResult` (`status: 'error'` si la herramienta falló). Vuelve a 1.
3. Si no: junta los bloques de texto. Si queda vacío, usa `RESPUESTA_RESPALDO`. Guarda en el historial un mensaje `assistant` **solo con ese texto**, para que el historial nunca termine en un `toolUse` sin respuesta.
4. Si se llega a `MAX_VUELTAS_HERRAMIENTAS` sin texto: responde `RESPUESTA_RESPALDO`, y el historial devuelto es el previo + el mensaje del usuario + la respuesta de respaldo (se descartan las vueltas de herramientas a medias). Los cambios de perfil ya aplicados se conservan.

- [ ] **Step 1: Escribir los fakes compartidos**

`backend/test/chat/fakes.ts`:

```ts
import type { ConverseCommandOutput } from '@aws-sdk/client-bedrock-runtime';

export const respuestaTexto = (texto: string) =>
  ({
    stopReason: 'end_turn',
    output: { message: { role: 'assistant', content: [{ text: texto }] } },
  }) as unknown as ConverseCommandOutput;

export const respuestaHerramienta = (nombre: string, input: unknown, toolUseId = 'tu-1') =>
  ({
    stopReason: 'tool_use',
    output: {
      message: {
        role: 'assistant',
        content: [{ text: 'Déjame anotarlo.' }, { toolUse: { toolUseId, name: nombre, input } }],
      },
    },
  }) as unknown as ConverseCommandOutput;
```

- [ ] **Step 2: Escribir la prueba que falla**

`backend/test/chat/conversar.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest';
import type { Message } from '@aws-sdk/client-bedrock-runtime';
import {
  MAX_VUELTAS_HERRAMIENTAS,
  RESPUESTA_RESPALDO,
  SYSTEM_PROMPT,
  conversar,
} from '../../src/chat/conversar';
import { HERRAMIENTAS } from '../../src/chat/herramientas';
import { PERFIL_VACIO } from '../../src/chat/perfil';
import { respuestaHerramienta, respuestaTexto } from './fakes';

const MODELO = 'modelo-de-prueba';
const entrada = (mensaje: string, historial: Message[] = []) => ({
  perfil: PERFIL_VACIO,
  historial,
  mensaje,
});

describe('SYSTEM_PROMPT', () => {
  it('prohíbe pedir la Clave Única y obliga a usar el motor para decidir', () => {
    expect(SYSTEM_PROMPT).toContain('Clave Única');
    expect(SYSTEM_PROMPT).toContain('evaluar_elegibilidad');
  });
});

describe('conversar', () => {
  it('con una respuesta de texto devuelve el texto y el historial de un turno', async () => {
    const invocar = vi.fn().mockResolvedValueOnce(respuestaTexto('¡Hola! ¿En qué región vives?'));
    const salida = await conversar(invocar, MODELO, entrada('Hola'));

    expect(salida.respuesta).toBe('¡Hola! ¿En qué región vives?');
    expect(salida.perfil).toEqual(PERFIL_VACIO);
    expect(salida.historial).toEqual([
      { role: 'user', content: [{ text: 'Hola' }] },
      { role: 'assistant', content: [{ text: '¡Hola! ¿En qué región vives?' }] },
    ]);

    const llamada = invocar.mock.calls[0][0];
    expect(llamada.modelId).toBe(MODELO);
    expect(llamada.system).toEqual([{ text: SYSTEM_PROMPT }]);
    expect(llamada.toolConfig.tools).toBe(HERRAMIENTAS);
    expect(llamada.messages).toEqual([{ role: 'user', content: [{ text: 'Hola' }] }]);
  });

  it('conserva el historial previo y le agrega el turno nuevo', async () => {
    const previo: Message[] = [
      { role: 'user', content: [{ text: 'Hola' }] },
      { role: 'assistant', content: [{ text: 'Hola, ¿región?' }] },
    ];
    const invocar = vi.fn().mockResolvedValueOnce(respuestaTexto('Anotado.'));
    const salida = await conversar(invocar, MODELO, entrada('Biobío', previo));
    expect(salida.historial.slice(0, 2)).toEqual(previo);
    expect(salida.historial).toHaveLength(4);
    expect(invocar.mock.calls[0][0].messages).toHaveLength(3);
  });

  it('ejecuta la herramienta pedida, devuelve su resultado al modelo y actualiza el perfil', async () => {
    const invocar = vi
      .fn()
      .mockResolvedValueOnce(respuestaHerramienta('actualizar_perfil', { tramoRSH: 40 }, 'tu-7'))
      .mockResolvedValueOnce(respuestaTexto('Listo, tramo 40%.'));
    const salida = await conversar(invocar, MODELO, entrada('Estoy en el tramo 40'));

    expect(salida.perfil.tramoRSH).toBe(40);
    expect(salida.respuesta).toBe('Listo, tramo 40%.');
    expect(invocar).toHaveBeenCalledTimes(2);

    const segunda = invocar.mock.calls[1][0].messages as Message[];
    const ultimo = segunda[segunda.length - 1];
    expect(ultimo.role).toBe('user');
    const resultado = ultimo.content?.[0].toolResult;
    expect(resultado?.toolUseId).toBe('tu-7');
    expect(resultado?.status).toBe('success');
    expect(resultado?.content?.[0].json).toEqual({ aceptados: ['tramoRSH'], rechazados: [] });

    // user, assistant(toolUse), user(toolResult), assistant(texto)
    expect(salida.historial).toHaveLength(4);
  });

  it('una herramienta desconocida vuelve al modelo con status error y la conversación sigue', async () => {
    const invocar = vi
      .fn()
      .mockResolvedValueOnce(respuestaHerramienta('borrar_todo', {}))
      .mockResolvedValueOnce(respuestaTexto('Perdón, sigamos.'));
    const salida = await conversar(invocar, MODELO, entrada('hola'));

    const segunda = invocar.mock.calls[1][0].messages as Message[];
    expect(segunda[segunda.length - 1].content?.[0].toolResult?.status).toBe('error');
    expect(salida.respuesta).toBe('Perdón, sigamos.');
  });

  it('si el modelo no deja de pedir herramientas, corta y deja un historial válido', async () => {
    const invocar = vi.fn().mockResolvedValue(respuestaHerramienta('evaluar_elegibilidad', {}));
    const salida = await conversar(invocar, MODELO, entrada('hola'));

    expect(invocar).toHaveBeenCalledTimes(MAX_VUELTAS_HERRAMIENTAS);
    expect(salida.respuesta).toBe(RESPUESTA_RESPALDO);
    expect(salida.historial).toEqual([
      { role: 'user', content: [{ text: 'hola' }] },
      { role: 'assistant', content: [{ text: RESPUESTA_RESPALDO }] },
    ]);
  });

  it('una respuesta sin texto usa la respuesta de respaldo', async () => {
    const invocar = vi.fn().mockResolvedValueOnce(respuestaTexto('   '));
    const salida = await conversar(invocar, MODELO, entrada('hola'));
    expect(salida.respuesta).toBe(RESPUESTA_RESPALDO);
  });

  it('si Bedrock falla, propaga el error', async () => {
    const invocar = vi.fn().mockRejectedValueOnce(new Error('ThrottlingException'));
    await expect(conversar(invocar, MODELO, entrada('hola'))).rejects.toThrow('ThrottlingException');
  });
});
```

- [ ] **Step 3: Ejecutar y ver que falla**

Run: `npm test -w backend -- test/chat/conversar.test.ts`
Expected: FAIL, no se puede resolver `../../src/chat/conversar`.

- [ ] **Step 4: Implementar `backend/src/chat/conversar.ts`**

```ts
import type {
  ContentBlock,
  ConverseCommandInput,
  ConverseCommandOutput,
  Message,
} from '@aws-sdk/client-bedrock-runtime';
import type { Perfil } from '../rules-engine/index';
import { HERRAMIENTAS, ejecutarHerramienta } from './herramientas';

export type InvocarConverse = (input: ConverseCommandInput) => Promise<ConverseCommandOutput>;

export const MAX_VUELTAS_HERRAMIENTAS = 6;

export const RESPUESTA_RESPALDO =
  'Perdón, me enredé procesando tu mensaje. ¿Me lo puedes repetir con otras palabras?';

export const SYSTEM_PROMPT = `Eres "Rumbo a Casa", un asistente que orienta a familias chilenas sobre cuatro subsidios habitacionales del MINVU: DS49 (Fondo Solidario de Elección de Vivienda, para familias más vulnerables), DS1 (sectores medios), DS19 (Integración Social y Territorial, viviendas nuevas en proyectos) y DS52 (arriendo).

Cómo trabajas:
- Conversa con calidez y en lenguaje simple. Haz una o dos preguntas por mensaje, nunca un formulario entero.
- Responde en el idioma en que te escribe la familia (español o inglés).
- Cada dato que la familia te dé, guárdalo de inmediato con la herramienta actualizar_perfil. Si un dato vuelve en "rechazados", explica qué no se entendió y vuelve a preguntarlo.
- Tú no decides la elegibilidad. Llama a evaluar_elegibilidad y explica lo que devuelve: el estado de cada programa, su motivo y el decreto de "regla". Si un programa devuelve falta_dato, pregunta por los campos de camposFaltantes.
- Cuando algún programa salga elegible, ofrece el plan de papeles con generar_plan.
- Los montos en UF son referenciales. Si un resultado trae una "nota" en "detalle", menciónala.
- Nunca pidas la Clave Única, el RUT, el nombre completo, la dirección ni datos bancarios. No los necesitas.
- La postulación la hace la familia en Serviu o en minvu.gob.cl; tú solo orientas. No prometas que va a obtener el subsidio.
- Si la familia no sabe un dato, no lo inventes: no lo guardes y sigue con otra pregunta.

Campos del perfil (usa exactamente estos nombres en actualizar_perfil):
- postulanteEdad: edad de quien postula.
- region: una de las 16 regiones de Chile, escrita como "Metropolitana", "Valparaíso", "Biobío", "O'Higgins", etc.
- zonaEspecial: "chiloe", "palena", "isla_de_pascua", "juan_fernandez" o "ninguna".
- tramoRSH: tramo del Registro Social de Hogares como número (40, 50, 60, 70, 80, 90 o 100).
- tienePropiedad: true si alguien del grupo familiar ya es dueño de una vivienda o de un sitio.
- ahorroCLP o ahorroUF: ahorro en la cuenta de ahorro para la vivienda. Si la familia lo dice en pesos, usa ahorroCLP; el sistema lo convierte a UF.
- antiguedadCuentaAhorroMeses: meses desde que abrió la cuenta de ahorro para la vivienda.
- ingresoFamiliarMensualCLP: ingreso mensual de todo el grupo familiar, en pesos. El sistema calcula el equivalente en UF.
- integrantesGrupoFamiliar: las otras personas del grupo familiar (sin contar a quien postula), cada una con edad y discapacidadCertificada (true o false). Si postula sola, lista vacía [].
- excepcionPostulacionIndividualDS49: true si postula sola y es adulto mayor, viuda o viudo, tiene discapacidad certificada, es indígena reconocido o está en el Informe Valech.
- subsidioPrevio: "DS49", "DS1_T1", "damnificado_2014" o "ninguno".
- objetivo: "comprar", "construir" o "arrendar".`;

export interface EntradaConversar {
  perfil: Perfil;
  historial: Message[];
  mensaje: string;
}

export interface SalidaConversar {
  perfil: Perfil;
  historial: Message[];
  respuesta: string;
}

const textoDe = (contenido: ContentBlock[]) =>
  contenido
    .map((bloque) => bloque.text ?? '')
    .join('')
    .trim();

export async function conversar(
  invocar: InvocarConverse,
  modelId: string,
  entrada: EntradaConversar,
): Promise<SalidaConversar> {
  let perfil = entrada.perfil;
  const inicio: Message[] = [...entrada.historial, { role: 'user', content: [{ text: entrada.mensaje }] }];
  const enCurso: Message[] = [...inicio];

  for (let vuelta = 0; vuelta < MAX_VUELTAS_HERRAMIENTAS; vuelta++) {
    const salida = await invocar({
      modelId,
      system: [{ text: SYSTEM_PROMPT }],
      messages: [...enCurso],
      toolConfig: { tools: HERRAMIENTAS },
      inferenceConfig: { maxTokens: 1024, temperature: 0.3 },
    });
    const contenido = salida.output?.message?.content ?? [];
    const pedidos = contenido.filter((bloque) => bloque.toolUse);

    if (salida.stopReason !== 'tool_use' || pedidos.length === 0) {
      const respuesta = textoDe(contenido) || RESPUESTA_RESPALDO;
      return {
        perfil,
        historial: [...enCurso, { role: 'assistant', content: [{ text: respuesta }] }],
        respuesta,
      };
    }

    enCurso.push({ role: 'assistant', content: contenido });
    const resultados = pedidos.map(({ toolUse }): ContentBlock => {
      const r = ejecutarHerramienta(toolUse?.name ?? '', toolUse?.input, perfil);
      perfil = r.perfil;
      return {
        toolResult: {
          toolUseId: toolUse?.toolUseId,
          // Paso por JSON: el SDK exige JSON plano y así se descartan los undefined.
          content: [{ json: JSON.parse(JSON.stringify(r.salida)) }],
          status: r.error ? 'error' : 'success',
        },
      };
    });
    enCurso.push({ role: 'user', content: resultados });
  }

  return {
    perfil,
    historial: [...inicio, { role: 'assistant', content: [{ text: RESPUESTA_RESPALDO }] }],
    respuesta: RESPUESTA_RESPALDO,
  };
}
```

- [ ] **Step 5: Ejecutar y ver que pasa**

Run: `npm test -w backend -- test/chat/conversar.test.ts && npx tsc --noEmit -p backend`
Expected: PASS. Si `tsc` marca `toolUseId: toolUse?.toolUseId` como `string | undefined` no asignable, usar `toolUse?.toolUseId ?? ''`.

- [ ] **Step 6: Commit**

```bash
git add backend/src/chat/conversar.ts backend/test/chat/fakes.ts backend/test/chat/conversar.test.ts
git commit -m "feat: bucle de conversación con Bedrock Converse y herramientas"
```

---

### Task 7: Ruta `POST /api/chat` en el handler

**Files:**
- Modify: `backend/src/handler.ts`
- Test: `backend/test/handler.test.ts` (los 2 tests actuales se quedan igual; se agrega un `describe`)

**Interfaces:**
- Consumes: `conversar`, `type InvocarConverse` (Task 6), `RepositorioDynamo`, `type RepositorioSesiones` (Task 5), `generarPlanPapeles` (Task 3), `evaluarTodosLosProgramas` (rules-engine), `BedrockRuntimeClient`, `ConverseCommand`, `DynamoDBClient`, `DynamoDBDocumentClient`.
- Produces:
  - `const MAX_MENSAJES_POR_SESION = 40`
  - `const MODELO_POR_DEFECTO = 'us.anthropic.claude-haiku-4-5-20251001-v1:0'`
  - `interface DependenciasChat { repositorio: RepositorioSesiones; invocar: InvocarConverse; modelId: string }`
  - `function crearHandler(obtenerDependencias: () => DependenciasChat): (event: APIGatewayProxyEventV2) => Promise<APIGatewayProxyStructuredResultV2>`
  - `const handler`, el mismo nombre que ya usa la infra (`handler: 'handler'`), armado con dependencias reales que se crean **solo** la primera vez que llega un `/api/chat`, así `/api/hello` sigue andando sin variables de entorno. Lee `TABLA_SESIONES` (obligatoria) y `MODEL_ID` (opcional) del entorno.
- Contrato HTTP: ver la sección "Contrato de API para la SPA" al inicio del plan.

- [ ] **Step 1: Escribir la prueba que falla**

Agregar a `backend/test/handler.test.ts`. Los imports van arriba del archivo, junto a los existentes, y el `describe` al final:

```ts
import { vi } from 'vitest';
import { randomUUID } from 'node:crypto';
import { crearHandler, MAX_MENSAJES_POR_SESION, type DependenciasChat } from '../src/handler';
import { RepositorioEnMemoria } from '../src/chat/sesion-repositorio';
import { respuestaHerramienta, respuestaTexto } from './chat/fakes';
```

```ts
const peticionChat = (
  body: string | undefined,
  opciones: { metodo?: string; base64?: boolean } = {},
) =>
  ({
    rawPath: '/api/chat',
    body,
    isBase64Encoded: opciones.base64 ?? false,
    requestContext: { http: { method: opciones.metodo ?? 'POST' } },
  }) as unknown as APIGatewayProxyEventV2;

const armar = (invocar = vi.fn().mockResolvedValue(respuestaTexto('Hola, ¿en qué región vives?'))) => {
  const repositorio = new RepositorioEnMemoria();
  const deps: DependenciasChat = { repositorio, invocar, modelId: 'modelo-de-prueba' };
  return { repositorio, invocar, handlerChat: crearHandler(() => deps) };
};

describe('POST /api/chat', () => {
  it('responde 200 con respuesta, perfil, resultados de los 4 programas y plan', async () => {
    const { handlerChat, repositorio } = armar();
    const sessionId = randomUUID();
    const res = await handlerChat(peticionChat(JSON.stringify({ sessionId, mensaje: 'Hola' })));

    expect(res.statusCode).toBe(200);
    const cuerpo = JSON.parse(res.body as string);
    expect(cuerpo.respuesta).toBe('Hola, ¿en qué región vives?');
    expect(cuerpo.perfil.tramoRSH).toBe('desconocido');
    expect(cuerpo.resultados).toHaveLength(4);
    expect(cuerpo.plan).toEqual([]);

    const sesion = await repositorio.obtener(sessionId);
    expect(sesion.mensajes).toBe(1);
    expect(sesion.historial).toHaveLength(2);
  });

  it('acepta el cuerpo en base64 (así puede llegar desde la Function URL)', async () => {
    const { handlerChat } = armar();
    const body = Buffer.from(JSON.stringify({ sessionId: randomUUID(), mensaje: 'Hola' })).toString('base64');
    const res = await handlerChat(peticionChat(body, { base64: true }));
    expect(res.statusCode).toBe(200);
  });

  it('guarda entre mensajes el perfil que cambió una herramienta', async () => {
    const invocar = vi
      .fn()
      .mockResolvedValueOnce(respuestaHerramienta('actualizar_perfil', { tramoRSH: 40 }))
      .mockResolvedValueOnce(respuestaTexto('Anotado.'))
      .mockResolvedValueOnce(respuestaTexto('¿Y tu ahorro?'));
    const { handlerChat, repositorio } = armar(invocar);
    const sessionId = randomUUID();

    const primera = await handlerChat(peticionChat(JSON.stringify({ sessionId, mensaje: 'Tramo 40' })));
    expect(JSON.parse(primera.body as string).perfil.tramoRSH).toBe(40);

    await handlerChat(peticionChat(JSON.stringify({ sessionId, mensaje: 'ok' })));
    const sesion = await repositorio.obtener(sessionId);
    expect(sesion.perfil.tramoRSH).toBe(40);
    expect(sesion.mensajes).toBe(2);
  });

  it.each([
    ['JSON roto', '{no es json'],
    ['sin cuerpo', undefined],
    ['sin sessionId', JSON.stringify({ mensaje: 'Hola' })],
    ['sessionId que no es UUID', JSON.stringify({ sessionId: 'abc', mensaje: 'Hola' })],
    ['mensaje vacío', JSON.stringify({ sessionId: randomUUID(), mensaje: '   ' })],
    ['mensaje de más de 2000 caracteres', JSON.stringify({ sessionId: randomUUID(), mensaje: 'a'.repeat(2001) })],
  ])('responde 400 con %s', async (_caso, body) => {
    const { handlerChat, invocar } = armar();
    const res = await handlerChat(peticionChat(body));
    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body as string)).toEqual({ error: 'solicitud_invalida' });
    expect(invocar).not.toHaveBeenCalled();
  });

  it('responde 405 si no es POST', async () => {
    const { handlerChat } = armar();
    const res = await handlerChat(peticionChat(undefined, { metodo: 'GET' }));
    expect(res.statusCode).toBe(405);
  });

  it('responde 429 al llegar al tope de mensajes, sin llamar a Bedrock', async () => {
    const { handlerChat, repositorio, invocar } = armar();
    const sessionId = randomUUID();
    const llena = await repositorio.obtener(sessionId);
    await repositorio.guardar({ ...llena, mensajes: MAX_MENSAJES_POR_SESION });

    const res = await handlerChat(peticionChat(JSON.stringify({ sessionId, mensaje: 'Hola' })));
    expect(res.statusCode).toBe(429);
    expect(JSON.parse(res.body as string).error).toBe('limite_mensajes');
    expect(invocar).not.toHaveBeenCalled();
  });

  it('responde 503 si Bedrock falla y no guarda la sesión', async () => {
    const invocar = vi.fn().mockRejectedValue(new Error('AccessDeniedException: account being verified'));
    const { handlerChat, repositorio } = armar(invocar);
    const sessionId = randomUUID();

    const res = await handlerChat(peticionChat(JSON.stringify({ sessionId, mensaje: 'Hola' })));
    expect(res.statusCode).toBe(503);
    expect(JSON.parse(res.body as string).error).toBe('asistente_no_disponible');
    const sesion = await repositorio.obtener(sessionId);
    expect(sesion.mensajes).toBe(0);
    expect(sesion.historial).toEqual([]);
  });

  it('responde 500 si falla el repositorio de sesiones', async () => {
    const deps: DependenciasChat = {
      repositorio: {
        obtener: vi.fn().mockRejectedValue(new Error('DynamoDB caído')),
        guardar: vi.fn(),
      },
      invocar: vi.fn(),
      modelId: 'modelo-de-prueba',
    };
    const res = await crearHandler(() => deps)(
      peticionChat(JSON.stringify({ sessionId: randomUUID(), mensaje: 'Hola' })),
    );
    expect(res.statusCode).toBe(500);
    expect(JSON.parse(res.body as string)).toEqual({ error: 'error_interno' });
  });
});
```

- [ ] **Step 2: Ejecutar y ver que falla**

Run: `npm test -w backend -- test/handler.test.ts`
Expected: FAIL, `crearHandler` no está exportado.

- [ ] **Step 3: Implementar**

Reemplazar `backend/src/handler.ts` completo por:

```ts
import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
} from 'aws-lambda';
import { z } from 'zod';
import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { evaluarTodosLosProgramas } from './rules-engine/index';
import { conversar, type InvocarConverse, type SalidaConversar } from './chat/conversar';
import { generarPlanPapeles } from './chat/papeles';
import { RepositorioDynamo, type RepositorioSesiones } from './chat/sesion-repositorio';

export const MAX_MENSAJES_POR_SESION = 40;
export const MODELO_POR_DEFECTO = 'us.anthropic.claude-haiku-4-5-20251001-v1:0';

export interface DependenciasChat {
  repositorio: RepositorioSesiones;
  invocar: InvocarConverse;
  modelId: string;
}

type Resultado = APIGatewayProxyStructuredResultV2;

const json = (statusCode: number, body: unknown): Resultado => ({
  statusCode,
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(body),
});

const SolicitudChat = z.object({
  sessionId: z.uuid(),
  mensaje: z.string().trim().min(1).max(2000),
});

function leerCuerpo(event: APIGatewayProxyEventV2): unknown {
  if (!event.body) return undefined;
  const texto = event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString('utf8') : event.body;
  try {
    return JSON.parse(texto);
  } catch {
    return undefined;
  }
}

async function atenderChat(event: APIGatewayProxyEventV2, deps: DependenciasChat): Promise<Resultado> {
  const solicitud = SolicitudChat.safeParse(leerCuerpo(event));
  if (!solicitud.success) return json(400, { error: 'solicitud_invalida' });
  const { sessionId, mensaje } = solicitud.data;

  const sesion = await deps.repositorio.obtener(sessionId);
  if (sesion.mensajes >= MAX_MENSAJES_POR_SESION) {
    return json(429, {
      error: 'limite_mensajes',
      mensaje: 'Esta conversación llegó a su límite de mensajes. Puedes empezar una nueva.',
    });
  }

  let salida: SalidaConversar;
  try {
    salida = await conversar(deps.invocar, deps.modelId, {
      perfil: sesion.perfil,
      historial: sesion.historial,
      mensaje,
    });
  } catch (error) {
    console.error('Bedrock falló', error);
    return json(503, {
      error: 'asistente_no_disponible',
      mensaje: 'El asistente no está disponible en este momento. Puedes probar el modo demo.',
    });
  }

  await deps.repositorio.guardar({
    sessionId,
    perfil: salida.perfil,
    historial: salida.historial,
    mensajes: sesion.mensajes + 1,
  });

  const resultados = evaluarTodosLosProgramas(salida.perfil);
  return json(200, {
    respuesta: salida.respuesta,
    perfil: salida.perfil,
    resultados,
    plan: generarPlanPapeles(resultados),
  });
}

export function crearHandler(obtenerDependencias: () => DependenciasChat) {
  return async (event: APIGatewayProxyEventV2): Promise<Resultado> => {
    if (event.rawPath === '/api/hello') {
      return json(200, {
        message: 'Hola desde Lambda',
        region: process.env.AWS_REGION ?? 'local',
      });
    }
    if (event.rawPath === '/api/chat') {
      if (event.requestContext?.http?.method !== 'POST') {
        return json(405, { error: 'metodo_no_permitido' });
      }
      try {
        return await atenderChat(event, obtenerDependencias());
      } catch (error) {
        console.error('Error en /api/chat', error);
        return json(500, { error: 'error_interno' });
      }
    }
    return json(404, { error: 'not_found' });
  };
}

let dependenciasReales: DependenciasChat | undefined;

function crearDependenciasReales(): DependenciasChat {
  if (!dependenciasReales) {
    const tabla = process.env.TABLA_SESIONES;
    if (!tabla) throw new Error('Falta la variable de entorno TABLA_SESIONES');
    const bedrock = new BedrockRuntimeClient({});
    const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
      marshallOptions: { removeUndefinedValues: true },
    });
    dependenciasReales = {
      repositorio: new RepositorioDynamo(dynamo, tabla),
      invocar: (input) => bedrock.send(new ConverseCommand(input)),
      modelId: process.env.MODEL_ID ?? MODELO_POR_DEFECTO,
    };
  }
  return dependenciasReales;
}

export const handler = crearHandler(crearDependenciasReales);
```

- [ ] **Step 4: Ejecutar y ver que pasa**

Run: `npm test -w backend && npx tsc --noEmit -p backend`
Expected: PASS en todo el backend, incluidos los 2 tests previos de `/api/hello` y 404.

- [ ] **Step 5: Commit**

```bash
git add backend/src/handler.ts backend/test/handler.test.ts
git commit -m "feat: ruta POST /api/chat con límites y manejo de errores"
```

---

### Task 8: Infra: tabla de sesiones, permisos y variables para `apiFn`

`infra/lib/rumbo-stack.ts` es el archivo donde trabaja Augusto. Antes de tocarlo, trae sus cambios y avísale.

**Files:**
- Modify: `infra/lib/rumbo-stack.ts`
- Test: `infra/test/rumbo-stack.test.ts` (agregar tests al `describe` existente)

**Interfaces:**
- Consumes: el nombre de variable `TABLA_SESIONES`, el atributo TTL `expiraEn` y la clave `sessionId` (Task 5); `MODEL_ID` y el modelo por defecto (Task 7).
- Produces: `apiFn` con `TABLA_SESIONES` y `MODEL_ID` en el entorno, `timeout` de 28 s (CloudFront corta el origen a los 30 s y el bucle de herramientas puede hacer varias llamadas a Bedrock), 512 MB, permisos de lectura y escritura en la tabla y `bedrock:InvokeModel` sobre el perfil de inferencia y el modelo base.

Sobre los permisos de Bedrock: Haiku 4.5 se invoca por el perfil de inferencia cross-region `us.anthropic...`, que enruta a varias regiones de EE. UU. Por eso IAM debe permitir el ARN del perfil de inferencia **y** el ARN del modelo base en cualquier región (`arn:aws:bedrock:*::foundation-model/...`). Si falta el segundo, Converse responde `AccessDeniedException` aunque el perfil esté permitido.

- [ ] **Step 1: Sincronizar con Augusto**

Run: `git pull --rebase origin main && git log --oneline -5 -- infra/lib/rumbo-stack.ts`
Expected: sin conflictos. Si hay commits nuevos de Augusto en `rumbo-stack.ts`, leer el archivo actualizado antes del Step 4 y aplicar los cambios sobre esa versión. Avisarle a Augusto que vas a tocar `infra/lib/rumbo-stack.ts` (tabla DynamoDB y permisos de `apiFn`).

- [ ] **Step 2: Escribir la prueba que falla**

En `infra/test/rumbo-stack.test.ts`, agregar dentro del `describe('RumboStack', ...)` existente:

```ts
  it('crea la tabla de sesiones con clave sessionId, pago por uso y TTL en expiraEn', () => {
    const t = sintetizar();
    t.hasResourceProperties('AWS::DynamoDB::Table', {
      KeySchema: [{ AttributeName: 'sessionId', KeyType: 'HASH' }],
      BillingMode: 'PAY_PER_REQUEST',
      TimeToLiveSpecification: { AttributeName: 'expiraEn', Enabled: true },
    });
  });

  it('pasa la tabla y el modelo a la Lambda de la API, con timeout bajo el de CloudFront', () => {
    const t = sintetizar();
    t.hasResourceProperties('AWS::Lambda::Function', {
      Timeout: 28,
      Environment: {
        Variables: Match.objectLike({
          TABLA_SESIONES: Match.anyValue(),
          MODEL_ID: 'us.anthropic.claude-haiku-4-5-20251001-v1:0',
        }),
      },
    });
  });

  it('permite invocar Bedrock en el perfil de inferencia y en el modelo base', () => {
    const t = sintetizar();
    t.hasResourceProperties('AWS::IAM::Policy', {
      PolicyDocument: {
        Statement: Match.arrayWith([
          Match.objectLike({
            Action: 'bedrock:InvokeModel',
            Effect: 'Allow',
            Resource: Match.arrayWith([
              'arn:aws:bedrock:*::foundation-model/anthropic.claude-haiku-4-5-20251001-v1:0',
            ]),
          }),
        ]),
      },
    });
  });

  it('da a la Lambda permisos de lectura y escritura en la tabla', () => {
    const t = sintetizar();
    t.hasResourceProperties('AWS::IAM::Policy', {
      PolicyDocument: {
        Statement: Match.arrayWith([
          Match.objectLike({
            Action: Match.arrayWith(['dynamodb:GetItem', 'dynamodb:PutItem']),
            Effect: 'Allow',
          }),
        ]),
      },
    });
  });
```

- [ ] **Step 3: Ejecutar y ver que falla**

Run: `npm test -w infra`
Expected: FAIL en los 4 tests nuevos; los 4 existentes siguen pasando.

- [ ] **Step 4: Implementar**

En `infra/lib/rumbo-stack.ts`, agregar los imports:

```ts
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
```

Agregar debajo de los imports:

```ts
const MODEL_ID = 'us.anthropic.claude-haiku-4-5-20251001-v1:0';
const MODELO_BASE = 'anthropic.claude-haiku-4-5-20251001-v1:0';
```

Reemplazar la creación de `apiFn` por:

```ts
    const tablaSesiones = new dynamodb.Table(this, 'Sesiones', {
      partitionKey: { name: 'sessionId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      timeToLiveAttribute: 'expiraEn',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const apiFn = new NodejsFunction(this, 'ApiFn', {
      entry: props.backendEntry,
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_24_X,
      // CloudFront corta el origen a los 30 s; el bucle de herramientas hace varias llamadas a Bedrock.
      timeout: cdk.Duration.seconds(28),
      memorySize: 512,
      environment: {
        TABLA_SESIONES: tablaSesiones.tableName,
        MODEL_ID,
      },
    });
    tablaSesiones.grantReadWriteData(apiFn);
    apiFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['bedrock:InvokeModel'],
        resources: [
          `arn:aws:bedrock:${this.region}:${this.account}:inference-profile/${MODEL_ID}`,
          // El perfil de inferencia cross-region enruta a varias regiones de EE. UU.
          `arn:aws:bedrock:*::foundation-model/${MODELO_BASE}`,
        ],
      }),
    );
```

El resto del stack (bucket, `addFunctionUrl`, distribución, `BucketDeployment`, output) no cambia.

- [ ] **Step 5: Ejecutar y ver que pasa**

Run: `npm test -w infra && npm test -w backend`
Expected: PASS en los dos workspaces (infra: 8 tests).

- [ ] **Step 6: Commit y push**

```bash
git add infra/lib/rumbo-stack.ts infra/test/rumbo-stack.test.ts
git commit -m "feat: tabla de sesiones y permisos de Bedrock para la API"
git push origin HEAD
```

(Si se ejecuta en un worktree, el push de la rama lo decide `finishing-a-development-branch`; en ese caso omitir el `git push` aquí.)

---

### Task 9: Deploy y prueba de humo en la URL pública

Es un cambio visible hacia afuera en la cuenta de Augusto: **confirmar con el usuario antes de desplegar.** No lleva TDD; la verificación es la prueba de humo.

**Files:** ninguno (si todo sale bien, solo se agrega evidencia en `docs/evidence/README.md`).

**Interfaces:**
- Consumes: todo lo anterior mergeado a `main`.
- Produces: `POST https://d26duk07atmc3z.cloudfront.net/api/chat` respondiendo según el contrato.

- [ ] **Step 1: Confirmar identidad y construir la web**

Run: `aws sts get-caller-identity --profile rumbo --query Arn --output text && npm run build -w web`
Expected: el ARN del usuario IAM `blaster` y `web/dist/` generado (el stack sube esa carpeta).

- [ ] **Step 2: Revisar el diff de CloudFormation**

Run: `cd infra && npx cdk diff RumboACasa --profile rumbo`
Expected: se agregan `AWS::DynamoDB::Table` y la política IAM, y se modifica `ApiFn` (entorno, timeout, memoria). **No** debe reemplazar la distribución de CloudFront ni el bucket; si aparece `[-]` o "replace" en alguno de los dos, detenerse y revisar con el usuario.

- [ ] **Step 3: Desplegar (con confirmación del usuario)**

Run: `cd infra && npx cdk deploy RumboACasa --profile rumbo`
Expected: `UPDATE_COMPLETE` y el output `SiteUrl` con la misma URL.

- [ ] **Step 4: Prueba de humo**

```bash
SID=$(cat /proc/sys/kernel/random/uuid)
curl -s -w '\n%{http_code}\n' -X POST https://d26duk07atmc3z.cloudfront.net/api/chat \
  -H 'content-type: application/json' \
  -d "{\"sessionId\":\"$SID\",\"mensaje\":\"Hola, somos una familia de 3 en Valparaíso y queremos arrendar\"}"
curl -s -w '\n%{http_code}\n' https://d26duk07atmc3z.cloudfront.net/api/hello
```

Expected:
- `/api/chat` → `200` con `respuesta` en español y `perfil.region` = `"Valparaíso"` (si el modelo llamó a `actualizar_perfil`). Si responde `503`, revisar los logs: `aws logs tail /aws/lambda/<nombre de ApiFn> --since 10m --profile rumbo`. Un `AccessDeniedException` con "account is currently being verified" es la verificación de la cuenta pendiente (no es un bug); cualquier otro `AccessDeniedException` apunta a los permisos del Task 8.
- `/api/hello` → `200`, igual que antes.

El tope de mensajes no se prueba en vivo (costaría 40 llamadas a Bedrock); lo cubre el test de Task 7.

- [ ] **Step 5: Evidencia**

Agregar a `docs/evidence/README.md` la fecha, el comando de la prueba de humo y el código de respuesta obtenido (sin IDs de cuenta ni ARNs). Commit:

```bash
git add docs/evidence/README.md
git commit -m "docs: prueba de humo de /api/chat en la URL pública"
git push origin main
```

- [ ] **Step 6: Avisar a Augusto**

Mandarle la sección "Contrato de API para la SPA" de este plan para que conecte el chat y las tarjetas en la SPA (incluido el 503 → modo demo).

---

## Fuera de alcance de este plan

- Descarga `.ics` de fechas de llamados, modo demo con familia ficticia y la UI del chat (semana 2 / track de Augusto).
- Alarma de AWS Budgets (está en el spec, pero va con la infra de la semana 2).
- Pendiente (c) del review del motor de reglas (revisar el patrón de `ds49.ts`/`ds1.ts` antes de copiarlo para un 5º programa): no aplica, este plan no agrega programas.
- Formularios específicos de DS1: no están en `dsDocs/`. El plan de papeles de DS1 lo declara en su `fuente`.
