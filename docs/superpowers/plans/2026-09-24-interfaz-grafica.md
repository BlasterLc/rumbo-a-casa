# Interfaz gráfica de Rumbo a Casa — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir toda la interfaz gráfica de Rumbo a Casa (las 5 pantallas del flujo: bienvenida, entrevista, resultado, plan y seguimiento) con Material UI real y el design system "Rumbo a Casa" publicado por el usuario, organizada en atomic design, sin componentes genéricos de IA — cada pieza sigue al milímetro las reglas de marca, tokens y copy del design system.

**Architecture:** SPA React + Vite existente (`web/`) se llena con: (1) un tema MUI generado desde los tokens del design system, (2) una librería de componentes en atomic design (`atoms/molecules/organisms/templates`) que replica los componentes del design system con las mismas props documentadas, (3) cinco pantallas que consumen la API real `POST /api/chat` del backend ya construido, con contexto de sesión persistido en `localStorage` y modo demo que reutiliza el motor de reglas real (`@rumbo/backend/rules-engine`) en el navegador. Cada tarea de componente termina agregándolo a una página-catálogo (`/catalogo`) y capturando una screenshot con Playwright a 360×800 para verificación visual, ya que el MCP de Playwright no está disponible en esta sesión.

**Tech Stack:** React 18.3 + TypeScript + Vite (ya en el repo) · Material UI 5.16.7 + `@mui/icons-material` + Emotion · `react-router-dom` 6 · `zod` 4 (reutilizado del backend) · Vitest + Testing Library para pruebas de componentes · `@playwright/test` (dev-only) para capturas de verificación visual, controlado por Bash — sustituye al MCP de Playwright, que no está conectado en esta sesión.

**Spec:** `docs/superpowers/specs/2026-09-20-rumbo-a-casa-design.md` (diseño técnico del hackathon) + el design system "Rumbo a Casa" publicado en `https://claude.ai/artifact/Ee1rjdCZ62CeTsJZmQ3yiz` (README de marca, `tokens.json`, `guidelines/*.md` y el README de cada componente bajo `project/components/*/README.md`, leídos íntegros para este plan). Este plan transcribe su contenido; el ejecutor no necesita volver a leer el artifact salvo para verificar un detalle puntual.

## Global Constraints

- MUI fijado en `5.16.7` (misma versión que declara el design system) — no instalar MUI 6.
- React y Vite: usar las versiones ya presentes en `web/package.json` (React `^18.3.0`, Vite `^5.4.0`). No tocarlas.
- `zod` en `web/package.json` debe quedar en `^4.6.5`, la misma que `backend/package.json`, porque el modo demo importa en tiempo de ejecución el motor de reglas real del backend.
- Ningún componente usa `<div>` con estilos a mano donde exista un componente MUI equivalente (`Button`, `TextField`, `Card`, `Chip`, `Stepper`, `Tabs`, `AppBar`, `BottomNavigation`, `Alert`, `Accordion`) — por regla del design system (`guidelines/20-material-ui.md`).
- Todo color, espacio, radio, sombra y tamaño sale de `web/src/theme/tokens.ts` / `tokens.css`. Ningún valor de color o `px` suelto en un componente — si hace falta un valor que no está en los tokens, es una señal de que el componente está mal planteado, no una excusa para inventar un hex.
- Ningún componente pide, guarda ni muestra la Clave Única, RUT, clave bancaria ni contraseña de ningún servicio (regla dura del README del design system).
- Todo resultado de elegibilidad mostrado en la interfaz viene del motor de reglas real — por la API (`/api/chat`) o, en modo demo, por importación directa de `evaluarTodosLosProgramas` desde `@rumbo/backend/rules-engine`. Ningún componente muestra un `SelloElegibilidad` con un estado inventado o de prueba manual fuera de sus propios tests unitarios.
- Estado backend `EstadoElegibilidad` tiene 3 valores (`elegible | no_elegible | falta_dato`); el design system define 4 (`califica | falta | posible | noAplica`). `posible` no se usa en este plan — no hay ninguna regla del motor que hoy produzca esa categoría. Se documenta en `web/src/lib/estado.ts` (Task 10) y no se simula.
- Ningún dato de `llamados` (fecha de apertura/cierre/Serviu) existe hoy en el backend. Donde el design system pide esa información (`LineaDeLlamados`, `TarjetaPrograma.llamado`), se usa el propio texto de repliegue que el design system define para la fuente ausente («Sin fecha publicada», «Por confirmar con el Serviu») — nunca una fecha inventada.
- `PlanPrograma.documentos` del backend solo trae `{ nombre, detalle? }`, no el par `nombreComun`/`nombreOficial`/`donde`/`gratis` que pide `ChecklistDocumentos`. Se mapea `nombre → nombreComun` y `detalle → donde` (ver Task 23) en vez de inventar campos que el backend no entrega.
- `TarjetaPorQue` (desglose regla-por-regla con el dato de la persona) no se conecta a datos reales en este plan: el motor de reglas devuelve un solo `motivo` por programa, no un arreglo de reglas evaluadas una por una con el dato de la persona. Se construye el componente fiel a su contrato (Task 25) y se prueba con datos de fixture, pero **no se usa con datos de la API** — eso requiere extender el rules-engine del backend, fuera de este plan. Se avisa al usuario al final.
- Todas las capturas de verificación visual se toman a 360×800 (el "teléfono de 360 px" que describe el propio sistema de diseño), contra `http://localhost:5173` servido por `npm run dev -w web`.
- Idioma: solo español en este plan. El spec menciona una opción en inglés; queda fuera de alcance y se señala al final.

## Review Focus

- **Respuestas de error de `/api/chat` (429/503/500/400).** El spec exige que un fallo de Bedrock ofrezca el modo demo y que el límite de mensajes se explique con el texto exacto del backend — una implementación ingenua solo mostraría "algo salió mal". Cubierto en Task 25 (`chatClient`) y Task 28 (`PantallaEntrevista`).
- **Campos de `Perfil` en `'desconocido'`.** Cualquier cálculo que lea un campo del perfil antes de que la entrevista lo complete debe tratar `'desconocido'` sin producir `NaN` ni texto roto. Cubierto en Task 28 (`pasoActivo`, probado con `PERFIL_DESCONOCIDO`) y en Task 29 (`PantallaResultado` calcula el número de personas solo cuando `integrantesGrupoFamiliar` no es `'desconocido'`, y sus tests corren con un perfil íntegramente `'desconocido'` sin que la pantalla rompa).
- **Mensaje vacío o de más de 2000 caracteres en la entrevista.** El backend rechaza con 400 si el mensaje no cumple `min(1).max(2000)`; la interfaz debe bloquear el envío antes, no depender del 400. Cubierto en Task 28.
- **Primera visita sin `sessionId` ni `localStorage` disponible** (modo privado del navegador, o `localStorage` bloqueado). El contexto de sesión debe generar un `sessionId` nuevo y degradar a memoria en vez de romper la app. Cubierto en Task 25.
- **Las tres combinaciones de `estado` en la misma respuesta de `resultados`.** `PantallaResultado` debe agrupar y ordenar (`elegible` primero, luego `falta_dato`, luego `no_elegible`) para cualquier combinación de los 4 programas, no solo el caso feliz de "todo elegible". Cubierto en Task 29.

## Índice de tareas

**Fundación:** 1) Dependencias y tipos compartidos · 2) Tokens y tema MUI · 3) Assets de marca + `Simbolo` · 4) Catálogo visual + script de captura Playwright
**Atoms:** 5) `Icono` · 6) `Boton` · 7) `Chip` · 8) `CampoTexto`
**Molecules:** 9) `SelloElegibilidad` · 10) `OpcionTarjeta` · 11) `Alerta` · 12) `AvisoLimite` · 13) `PasoAPaso` · 14) `Pestanas` · 15) `BurbujaChat` + `Pensando`
**Organisms:** 16) `Franja` · 17) `Logotipo` · 18) `CabeceraApp` · 19) `BarraInferior` · 20) `BloqueHero` · 21) `TarjetaPrograma` · 22) `ChecklistDocumentos` · 23) `LineaDeLlamados` · 24) `TarjetaPorQue`
**Estado y enrutamiento:** 25) `SesionContext` + `chatClient` · 26) `AppShell` + rutas
**Pantallas:** 27) `PantallaBienvenida` · 28) `PantallaEntrevista` · 29) `PantallaResultado` · 30) `PantallaPlan` · 31) `PantallaSeguimiento`
**Cierre:** 32) Verificación end-to-end + build de producción

---

### Task 1: Dependencias del frontend y tipos compartidos con el backend

**Files:**
- Modify: `backend/package.json`
- Modify: `web/package.json`
- Create: `web/src/types/dominio.ts`
- Test: `web/src/types/dominio.test.ts`

**Interfaces:**
- Produces: `web/src/types/dominio.ts` re-exporta, con `export type`, `Perfil`, `ResultadoPrograma`, `Programa`, `EstadoElegibilidad`, `Regla` (de `@rumbo/backend/rules-engine`) y `PlanPrograma`, `Documento` (de `@rumbo/backend/chat/papeles`); y re-exporta en runtime `evaluarTodosLosProgramas` y `generarPlanPapeles` para el modo demo (Task 28).

- [ ] **Step 1: Declarar los subpaths del backend que el frontend puede importar**

Reemplaza el contenido de `backend/package.json` por:

```json
{
  "name": "@rumbo/backend",
  "private": true,
  "type": "module",
  "exports": {
    "./rules-engine": "./src/rules-engine/index.ts",
    "./chat/papeles": "./src/chat/papeles.ts"
  },
  "scripts": {
    "test": "vitest run"
  },
  "devDependencies": {
    "@types/aws-lambda": "^8.10.145",
    "@types/node": "^20.14.0",
    "typescript": "^5.5.0",
    "vitest": "^2.0.0"
  },
  "dependencies": {
    "@aws-sdk/client-bedrock-runtime": "^3.1139.0",
    "@aws-sdk/client-dynamodb": "^3.1139.0",
    "@aws-sdk/lib-dynamodb": "^3.1139.0",
    "zod": "^4.6.5"
  }
}
```

Solo se agregó el campo `exports`. Ambos subpaths (`rules-engine/index.ts`, `chat/papeles.ts`) son TypeScript puro con `zod`, sin dependencias de AWS — seguro para el navegador.

- [ ] **Step 2: Instalar todas las dependencias del frontend de una vez**

Reemplaza el contenido de `web/package.json` por:

```json
{
  "name": "@rumbo/web",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "test": "vitest run"
  },
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "react-router-dom": "^6.26.0",
    "@mui/material": "5.16.7",
    "@mui/icons-material": "5.16.7",
    "@emotion/react": "^11.13.0",
    "@emotion/styled": "^11.13.0",
    "zod": "^4.6.5",
    "@rumbo/backend": "*"
  },
  "devDependencies": {
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.0",
    "typescript": "^5.5.0",
    "vite": "^5.4.0",
    "vitest": "^2.0.0",
    "jsdom": "^25.0.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/jest-dom": "^6.5.0",
    "@testing-library/user-event": "^14.5.0",
    "@playwright/test": "^1.47.0",
    "playwright": "^1.47.0"
  }
}
```

- [ ] **Step 3: Instalar y verificar el link del workspace**

Run: `npm install` (desde la raíz del repo)
Expected: instala todo sin error y crea el symlink `node_modules/@rumbo/backend -> ../backend`.

- [ ] **Step 4: Instalar el navegador de Playwright**

Run: `npx playwright install chromium --with-deps` (ejecutar desde `web/` o con `-w web` si el binario lo requiere; en Windows omite `--with-deps` si falla y ejecuta solo `npx playwright install chromium`)
Expected: descarga Chromium para Playwright. Solo hace falta una vez en el entorno.

- [ ] **Step 5: Configurar Vitest con entorno jsdom**

Create `web/vitest.config.ts`:

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
  },
});
```

Create `web/vitest.setup.ts`:

```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 6: Escribir el test de re-exportación (falla primero)**

Create `web/src/types/dominio.test.ts`:

```ts
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
```

- [ ] **Step 7: Ejecutar el test y verificar que falla**

Run: `npm run test -w web`
Expected: FAIL — `Cannot find module './dominio'` o similar, porque `dominio.ts` no existe todavía.

- [ ] **Step 8: Crear el módulo de tipos y funciones compartidas**

Create `web/src/types/dominio.ts`:

```ts
export type {
  Perfil,
  ResultadoPrograma,
  Programa,
  EstadoElegibilidad,
  Regla,
} from '@rumbo/backend/rules-engine';
export type { PlanPrograma, Documento } from '@rumbo/backend/chat/papeles';

export { evaluarTodosLosProgramas } from '@rumbo/backend/rules-engine';
export { generarPlanPapeles } from '@rumbo/backend/chat/papeles';

import type { Perfil } from '@rumbo/backend/rules-engine';

/** Perfil con todos los campos en 'desconocido', para una sesión nueva. Debe coincidir campo a campo con `PERFIL_VACIO` de `backend/src/chat/perfil.ts`. */
export const PERFIL_DESCONOCIDO: Perfil = {
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
```

- [ ] **Step 9: Ejecutar el test y verificar que pasa**

Run: `npm run test -w web`
Expected: PASS — 2 tests verdes.

- [ ] **Step 10: Verificar que el chequeo de tipos del backend sigue intacto**

Run: `npm test -w backend`
Expected: PASS — el `exports` agregado no cambia ningún import interno del backend (todos son relativos).

- [ ] **Step 11: Commit**

```bash
git add backend/package.json web/package.json web/vitest.config.ts web/vitest.setup.ts web/src/types/dominio.ts web/src/types/dominio.test.ts package-lock.json
git commit -m "feat(web): instalar MUI y dependencias, compartir tipos y motor de reglas del backend"
```

---

### Task 2: Tokens y tema MUI

Transcribe `tokens.json` del design system (color, tipografía, espacio, radio, sombra, tamaño — un solo tema, claro) a un tema real de Material UI, siguiendo `guidelines/20-material-ui.md`: paleta en hexadecimal (MUI lo necesita para calcular hover/estados), todo lo pintado sobrescrito con `var(--token)`.

**Files:**
- Create: `web/src/theme/tokens.ts`
- Create: `web/src/theme/tokens.css`
- Create: `web/src/theme/theme.ts`
- Modify: `web/index.html`
- Modify: `web/src/main.tsx`
- Test: `web/src/theme/theme.test.ts`

**Interfaces:**
- Produces: `color` (mapa de 30 tokens de color, hex/rgba), `spacePx`, `radiusPx`, `sizePx` (números), `shadow` (strings), `fontFamily` (`display`/`sans`/`mono`) — todos exportados desde `web/src/theme/tokens.ts`. `temaRumbo` (tema MUI) exportado desde `web/src/theme/theme.ts`. Toda tarea posterior que necesite un color/espacio/radio importa de aquí, nunca escribe un hex o un `px` suelto.

- [ ] **Step 1: Test de que el tema expone los tokens de marca**

Create `web/src/theme/theme.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { temaRumbo } from './theme';
import { color } from './tokens';

describe('temaRumbo', () => {
  it('usa el azul de marca como color primario y el terracota como secundario', () => {
    expect(temaRumbo.palette.primary.main).toBe(color.brand);
    expect(temaRumbo.palette.secondary.main).toBe(color.accent);
  });

  it('el texto sobre un relleno es siempre ink-on-fill, nunca blanco literal fuera del token', () => {
    expect(temaRumbo.palette.primary.contrastText).toBe(color['ink-on-fill']);
  });

  it('los botones no usan elevación por sombra para jerarquía', () => {
    expect(temaRumbo.components?.MuiButton?.defaultProps?.disableElevation).toBe(true);
  });
});
```

- [ ] **Step 2: Ejecutar y verificar que falla**

Run: `npm run test -w web`
Expected: FAIL — no existen `./theme` ni `./tokens`.

- [ ] **Step 3: Escribir los tokens**

Create `web/src/theme/tokens.ts`:

```ts
/** Transcrito de tokens.json del design system "Rumbo a Casa" (v1, tema único "Claro"). */

export const color = {
  'surface-base': '#f7f5f1',
  'surface-raised': '#ffffff',
  'surface-sunken': '#efece6',
  'surface-brand': '#123a6b',
  'surface-brand-soft': '#e4edf8',
  'surface-accent-soft': '#fbede2',
  'surface-success-soft': '#dff0e6',
  'surface-warning-soft': '#fdf0d9',
  'surface-danger-soft': '#fbe4e2',
  'ink-strong': '#14181f',
  ink: '#2a3039',
  'ink-muted': '#56606e',
  'ink-on-brand': '#ffffff',
  'ink-on-fill': '#ffffff',
  'ink-brand': '#16457e',
  'ink-accent': '#8a3d1e',
  'ink-success': '#14563b',
  'ink-warning': '#7a4700',
  'ink-danger': '#93201f',
  brand: '#1b4d8f',
  'brand-strong': '#123a6b',
  accent: '#b5542e',
  'accent-strong': '#8f3f1f',
  success: '#1c6b4b',
  warning: '#9a5b00',
  danger: '#b02525',
  border: '#dbd6cd',
  'border-strong': '#7c8593',
  'focus-ring': '#1b4d8f',
  scrim: 'rgba(16, 22, 32, 0.55)',
} as const;

export type TokenColor = keyof typeof color;

export const spacePx = {
  'space-1': 4,
  'space-2': 8,
  'space-3': 12,
  'space-4': 16,
  'space-5': 24,
  'space-6': 32,
  'space-7': 48,
  'space-8': 64,
} as const;

export const radiusPx = {
  'radius-sm': 8,
  'radius-md': 14,
  'radius-lg': 22,
  'radius-pill': 999,
} as const;

export const sizePx = {
  'size-touch': 48,
  'size-control': 56,
  'size-icon': 24,
  'size-mic': 72,
} as const;

export const sizeMeasure = '36ch';

export const shadow = {
  'shadow-sm': '0 1px 2px rgba(20, 24, 31, 0.08)',
  'shadow-md': '0 4px 14px rgba(20, 24, 31, 0.1)',
  'shadow-lg': '0 12px 32px rgba(20, 24, 31, 0.14)',
} as const;

export const fontFamily = {
  display: '"Bricolage Grotesque", "Figtree", system-ui, sans-serif',
  sans: '"Figtree", "Segoe UI", system-ui, sans-serif',
  mono: '"IBM Plex Mono", ui-monospace, monospace',
} as const;

export interface EstiloTexto {
  fontFamily: string;
  fontSize: string;
  lineHeight: string;
  fontWeight: number;
  letterSpacing?: string;
}

export const type = {
  'display-xl': { fontFamily: fontFamily.display, fontSize: '40px', lineHeight: '44px', fontWeight: 700, letterSpacing: '-0.02em' },
  'display-l': { fontFamily: fontFamily.display, fontSize: '30px', lineHeight: '36px', fontWeight: 700, letterSpacing: '-0.015em' },
  'display-m': { fontFamily: fontFamily.display, fontSize: '24px', lineHeight: '30px', fontWeight: 600, letterSpacing: '-0.01em' },
  title: { fontFamily: fontFamily.sans, fontSize: '20px', lineHeight: '26px', fontWeight: 600 },
  'body-l': { fontFamily: fontFamily.sans, fontSize: '18px', lineHeight: '28px', fontWeight: 400 },
  body: { fontFamily: fontFamily.sans, fontSize: '16px', lineHeight: '24px', fontWeight: 400 },
  'body-strong': { fontFamily: fontFamily.sans, fontSize: '16px', lineHeight: '24px', fontWeight: 600 },
  caption: { fontFamily: fontFamily.sans, fontSize: '14px', lineHeight: '20px', fontWeight: 400 },
  label: { fontFamily: fontFamily.sans, fontSize: '13px', lineHeight: '16px', fontWeight: 600, letterSpacing: '0.04em' },
  dato: { fontFamily: fontFamily.mono, fontSize: '15px', lineHeight: '22px', fontWeight: 500 },
} satisfies Record<string, EstiloTexto>;
```

- [ ] **Step 4: Escribir las variables CSS (mismos valores, para `styleOverrides` y CSS plano)**

Create `web/src/theme/tokens.css`:

```css
:root {
  /* Color */
  --surface-base: #f7f5f1;
  --surface-raised: #ffffff;
  --surface-sunken: #efece6;
  --surface-brand: #123a6b;
  --surface-brand-soft: #e4edf8;
  --surface-accent-soft: #fbede2;
  --surface-success-soft: #dff0e6;
  --surface-warning-soft: #fdf0d9;
  --surface-danger-soft: #fbe4e2;
  --ink-strong: #14181f;
  --ink: #2a3039;
  --ink-muted: #56606e;
  --ink-on-brand: #ffffff;
  --ink-on-fill: #ffffff;
  --ink-brand: #16457e;
  --ink-accent: #8a3d1e;
  --ink-success: #14563b;
  --ink-warning: #7a4700;
  --ink-danger: #93201f;
  --brand: #1b4d8f;
  --brand-strong: #123a6b;
  --accent: #b5542e;
  --accent-strong: #8f3f1f;
  --success: #1c6b4b;
  --warning: #9a5b00;
  --danger: #b02525;
  --border: #dbd6cd;
  --border-strong: #7c8593;
  --focus-ring: #1b4d8f;
  --scrim: rgba(16, 22, 32, 0.55);

  /* Espacio */
  --space-1: 4px; --space-2: 8px; --space-3: 12px; --space-4: 16px;
  --space-5: 24px; --space-6: 32px; --space-7: 48px; --space-8: 64px;

  /* Radio */
  --radius-sm: 8px; --radius-md: 14px; --radius-lg: 22px; --radius-pill: 999px;

  /* Sombra */
  --shadow-sm: 0 1px 2px rgba(20, 24, 31, 0.08);
  --shadow-md: 0 4px 14px rgba(20, 24, 31, 0.1);
  --shadow-lg: 0 12px 32px rgba(20, 24, 31, 0.14);

  /* Tamaño */
  --size-touch: 48px; --size-control: 56px; --size-icon: 24px; --size-mic: 72px;
  --size-measure: 36ch;

  /* Tipografía */
  --font-display: "Bricolage Grotesque", "Figtree", system-ui, sans-serif;
  --font-sans: "Figtree", "Segoe UI", system-ui, sans-serif;
  --font-mono: "IBM Plex Mono", ui-monospace, monospace;
}

html, body { margin: 0; }

body {
  background: var(--surface-base);
  color: var(--ink);
  font-family: var(--font-sans);
  -webkit-font-smoothing: antialiased;
}

/* Nada tocable baja de 48 px. */
.MuiIconButton-root, .MuiBottomNavigationAction-root {
  min-width: var(--size-touch);
  min-height: var(--size-touch);
}

/* El anillo de foco no se quita nunca. */
:focus-visible {
  outline: 3px solid var(--focus-ring);
  outline-offset: 2px;
}
```

- [ ] **Step 5: Escribir el tema MUI**

Create `web/src/theme/theme.ts`:

```ts
import { createTheme } from '@mui/material/styles';
import { color, fontFamily, type } from './tokens';

export const temaRumbo = createTheme({
  palette: {
    mode: 'light',
    background: { default: color['surface-base'], paper: color['surface-raised'] },
    text: { primary: color.ink, secondary: color['ink-muted'] },
    primary: { main: color.brand, dark: color['brand-strong'], contrastText: color['ink-on-fill'] },
    secondary: { main: color.accent, dark: color['accent-strong'], contrastText: color['ink-on-fill'] },
    success: { main: color.success, contrastText: color['ink-on-fill'] },
    warning: { main: color.warning, contrastText: color['ink-on-fill'] },
    error: { main: color.danger, contrastText: color['ink-on-fill'] },
    divider: color.border,
  },
  shape: { borderRadius: 14 },
  spacing: 4,
  typography: {
    fontFamily: fontFamily.sans,
    h1: type['display-xl'],
    h2: type['display-l'],
    h3: type['display-m'],
    subtitle1: type.title,
    body1: type['body-l'],
    body2: type.body,
    caption: type.caption,
    overline: { ...type.label, textTransform: 'none' },
    button: { ...type['body-strong'], textTransform: 'none' },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        ':focus-visible': { outline: '3px solid var(--focus-ring)', outlineOffset: '2px' },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true, variant: 'contained', size: 'large' },
      styleOverrides: {
        root: {
          borderRadius: 'var(--radius-md)',
          minHeight: 'var(--size-control)',
          paddingLeft: 'var(--space-5)',
          paddingRight: 'var(--space-5)',
        },
      },
    },
    MuiTextField: { defaultProps: { variant: 'outlined', fullWidth: true } },
    MuiOutlinedInput: {
      styleOverrides: {
        root: { borderRadius: 'var(--radius-md)', minHeight: 'var(--size-control)' },
        notchedOutline: { borderColor: 'var(--border-strong)' },
      },
    },
    MuiAlert: { defaultProps: { variant: 'standard' } },
    MuiTabs: { defaultProps: { variant: 'scrollable', allowScrollButtonsMobile: true } },
    MuiTab: { styleOverrides: { root: { minHeight: 'var(--size-touch)', textTransform: 'none' } } },
    MuiIconButton: { styleOverrides: { root: { minWidth: 'var(--size-touch)', minHeight: 'var(--size-touch)' } } },
    MuiBottomNavigationAction: {
      styleOverrides: { root: { minWidth: 'var(--size-touch)', minHeight: 'var(--size-touch)' } },
    },
    MuiChip: { styleOverrides: { root: { borderRadius: 'var(--radius-pill)' } } },
    MuiCard: { styleOverrides: { root: { borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' } } },
    MuiPaper: { defaultProps: { elevation: 0 } },
  },
});
```

- [ ] **Step 6: Cargar las fuentes de Google y las variables CSS en `index.html`**

Replace `web/index.html`:

```html
<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400..800&family=Figtree:wght@400..700&family=IBM+Plex+Mono:wght@400;500&display=swap"
      rel="stylesheet"
    />
    <title>Rumbo a Casa</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 7: Aplicar el tema en el punto de entrada**

Replace `web/src/main.tsx`:

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { temaRumbo } from './theme/theme';
import './theme/tokens.css';
import { App } from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={temaRumbo}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </StrictMode>,
);
```

- [ ] **Step 8: Ejecutar el test y verificar que pasa**

Run: `npm run test -w web`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add web/src/theme web/index.html web/src/main.tsx
git commit -m "feat(web): tema MUI y tokens del design system Rumbo a Casa"
```

---

### Task 3: Assets de marca y el átomo `Simbolo`

Copia literal de los 4 SVG del símbolo de Rumbo a Casa (leídos del design system) a `web/public/marca/`, más el átomo que los muestra. Los archivos se usan tal cual — el README de marca prohíbe redibujarlos.

**Files:**
- Create: `web/public/marca/rumbo-simbolo.svg`
- Create: `web/public/marca/rumbo-simbolo-oscuro.svg`
- Create: `web/public/marca/rumbo-simbolo-monocromo.svg`
- Create: `web/public/marca/rumbo-icono-app.svg`
- Create: `web/src/components/atoms/Simbolo/Simbolo.tsx`
- Test: `web/src/components/atoms/Simbolo/Simbolo.test.tsx`

**Interfaces:**
- Produces: `Simbolo(props: { tamano?: number; tono?: 'color' | 'claro' | 'mono' }): JSX.Element` desde `web/src/components/atoms/Simbolo/Simbolo.tsx` — firma idéntica a `index.d.ts` del design system.

- [ ] **Step 1: Copiar los 4 SVG tal cual**

Create `web/public/marca/rumbo-simbolo.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" role="img" aria-label="Rumbo a Casa">
  <rect x="8" y="36" width="14" height="20" rx="6" fill="#1b4d8f"></rect>
  <rect x="25" y="26" width="14" height="30" rx="6" fill="#1b4d8f"></rect>
  <path d="M42 23a7 7 0 0 1 14 0v27a6 6 0 0 1-6 6h-2a6 6 0 0 1-6-6z" fill="#b5542e"></path>
</svg>
```

Create `web/public/marca/rumbo-simbolo-oscuro.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" role="img" aria-label="Rumbo a Casa">
  <rect x="8" y="36" width="14" height="20" rx="6" fill="#7fb3ee"></rect>
  <rect x="25" y="26" width="14" height="30" rx="6" fill="#7fb3ee"></rect>
  <path d="M42 23a7 7 0 0 1 14 0v27a6 6 0 0 1-6 6h-2a6 6 0 0 1-6-6z" fill="#e8a07a"></path>
</svg>
```

Create `web/public/marca/rumbo-simbolo-monocromo.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" role="img" aria-label="Rumbo a Casa">
  <rect x="8" y="36" width="14" height="20" rx="6" fill="#2a3039"></rect>
  <rect x="25" y="26" width="14" height="30" rx="6" fill="#2a3039"></rect>
  <path d="M42 23a7 7 0 0 1 14 0v27a6 6 0 0 1-6 6h-2a6 6 0 0 1-6-6z" fill="#2a3039"></path>
</svg>
```

Create `web/public/marca/rumbo-icono-app.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" role="img" aria-label="Rumbo a Casa">
  <rect width="64" height="64" rx="14" fill="#f7f5f1"></rect>
  <g transform="translate(5.33 2.02) scale(0.833)">
    <rect x="8" y="36" width="14" height="20" rx="6" fill="#1b4d8f"></rect>
    <rect x="25" y="26" width="14" height="30" rx="6" fill="#1b4d8f"></rect>
    <path d="M42 23a7 7 0 0 1 14 0v27a6 6 0 0 1-6 6h-2a6 6 0 0 1-6-6z" fill="#b5542e"></path>
  </g>
</svg>
```

- [ ] **Step 2: Test del átomo (falla primero)**

Create `web/src/components/atoms/Simbolo/Simbolo.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Simbolo } from './Simbolo';

describe('Simbolo', () => {
  it('usa la versión clara sobre fondo oscuro por defecto en tono claro', () => {
    render(<Simbolo tono="claro" />);
    const img = screen.getByRole('img', { name: 'Rumbo a Casa' });
    expect(img).toHaveAttribute('src', '/marca/rumbo-simbolo-oscuro.svg');
  });

  it('usa la versión a dos tintas por defecto', () => {
    render(<Simbolo />);
    expect(screen.getByRole('img', { name: 'Rumbo a Casa' })).toHaveAttribute('src', '/marca/rumbo-simbolo.svg');
  });

  it('respeta el tamaño pedido', () => {
    render(<Simbolo tamano={32} />);
    const img = screen.getByRole('img', { name: 'Rumbo a Casa' });
    expect(img).toHaveAttribute('width', '32');
    expect(img).toHaveAttribute('height', '32');
  });
});
```

- [ ] **Step 3: Ejecutar y verificar que falla**

Run: `npm run test -w web`
Expected: FAIL — `./Simbolo` no existe.

- [ ] **Step 4: Implementar el átomo**

Create `web/src/components/atoms/Simbolo/Simbolo.tsx`:

```tsx
const ARCHIVO = {
  color: '/marca/rumbo-simbolo.svg',
  claro: '/marca/rumbo-simbolo-oscuro.svg',
  mono: '/marca/rumbo-simbolo-monocromo.svg',
} as const;

export interface SimboloProps {
  tamano?: number;
  tono?: 'color' | 'claro' | 'mono';
}

/** El símbolo de marca. Se usa tal cual — nunca se redibuja. Ver guidelines/10-marca.md. */
export function Simbolo({ tamano = 24, tono = 'color' }: SimboloProps) {
  return <img src={ARCHIVO[tono]} alt="Rumbo a Casa" width={tamano} height={tamano} />;
}
```

- [ ] **Step 5: Ejecutar y verificar que pasa**

Run: `npm run test -w web`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add web/public/marca web/src/components/atoms/Simbolo
git commit -m "feat(web): assets de marca y atomo Simbolo"
```

---

### Task 4: Catálogo visual y script de captura Playwright

Establece el patrón que usa el resto del plan para "revisar en localhost a medida que se construye": una página `/catalogo` que va acumulando cada componente nuevo, y un script de Node que usa `playwright` (librería, no MCP — el MCP de Playwright no está disponible en esta sesión) para abrir esa página en Chromium a 360×800 y guardar una captura. El ejecutor abre la imagen resultante con la herramienta de lectura de archivos para verificarla visualmente.

**Files:**
- Create: `web/src/dev/Catalogo.tsx`
- Create: `web/e2e/capturar.mjs`
- Modify: `web/src/App.tsx`
- Modify: `.gitignore`

**Interfaces:**
- Produces: `Catalogo` (componente de React, sin props) en `web/src/dev/Catalogo.tsx`. Cada tarea de componente posterior le agrega una sección (`<section>` con `Typography variant="overline"` de título + el componente). `web/e2e/capturar.mjs <ruta> <nombre-archivo>` — script de Node, no de test; guarda `web/e2e/capturas/<nombre-archivo>.png`.

- [ ] **Step 1: Crear el catálogo con lo único que existe hasta ahora**

Create `web/src/dev/Catalogo.tsx`:

```tsx
import { Stack, Typography } from '@mui/material';
import { Simbolo } from '../components/atoms/Simbolo/Simbolo';

/**
 * Página interna de verificación visual, no es parte del flujo de la persona.
 * Cada tarea de componente agrega aquí su propia sección, en orden de construcción.
 */
export function Catalogo() {
  return (
    <Stack spacing={6} sx={{ p: 5, maxWidth: 420, mx: 'auto' }}>
      <Typography variant="h2">Catálogo Rumbo a Casa</Typography>

      <section>
        <Typography variant="overline">Simbolo</Typography>
        <Stack direction="row" spacing={4} sx={{ mt: 2, alignItems: 'center' }}>
          <Simbolo tamano={48} />
          <div style={{ background: '#123a6b', padding: 12, borderRadius: 12 }}>
            <Simbolo tamano={48} tono="claro" />
          </div>
          <Simbolo tamano={48} tono="mono" />
        </Stack>
      </section>
    </Stack>
  );
}
```

- [ ] **Step 2: Exponer `/catalogo` con un enrutamiento mínimo temporal**

Replace `web/src/App.tsx` (Task 26 lo reemplaza por el enrutamiento definitivo con `react-router-dom`; esta versión solo existe para poder capturar el catálogo mientras se construyen los componentes):

```tsx
import { Catalogo } from './dev/Catalogo';

export function App() {
  if (window.location.pathname === '/catalogo') return <Catalogo />;
  return (
    <div style={{ padding: 24, fontFamily: 'sans-serif' }}>
      Rumbo a Casa — interfaz en construcción. Visita <a href="/catalogo">/catalogo</a> para ver los
      componentes ya hechos.
    </div>
  );
}
```

- [ ] **Step 3: Escribir el script de captura**

Create `web/e2e/capturar.mjs`:

```js
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const [, , ruta = '/', archivo = 'captura'] = process.argv;
const base = process.env.BASE_URL ?? 'http://localhost:5173';
const carpeta = new URL('./capturas/', import.meta.url);

await mkdir(carpeta, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 360, height: 800 } });
await page.goto(base + ruta, { waitUntil: 'networkidle' });
const destino = fileURLToPath(new URL(`./${archivo}.png`, carpeta));
await page.screenshot({ path: destino, fullPage: true });
await browser.close();
console.log(`Guardado ${destino}`);
```

- [ ] **Step 4: Ignorar las capturas generadas**

Run: `printf '\nweb/e2e/capturas/\n' >> .gitignore` (o agrega la línea `web/e2e/capturas/` a `.gitignore` con el editor — son artefactos de verificación, no código fuente).

- [ ] **Step 5: Levantar el servidor de desarrollo (queda corriendo para el resto del plan)**

Run: `npm run dev -w web` **en segundo plano** (deja este proceso corriendo; todas las capturas de las tareas siguientes asumen que `http://localhost:5173` responde).
Expected: Vite sirve en `http://localhost:5173`.

- [ ] **Step 6: Primera captura — verificar el pipeline completo**

Run: `node web/e2e/capturar.mjs /catalogo 00-catalogo-inicial`
Expected: se crea `web/e2e/capturas/00-catalogo-inicial.png`.

Abre `web/e2e/capturas/00-catalogo-inicial.png` con la herramienta de lectura de archivos y verifica a simple vista: fondo `surface-base` (crema, no blanco puro), título "Catálogo Rumbo a Casa" en Bricolage Grotesque (con gancho más orgánico que una sans genérica), y el símbolo en sus tres tonos — el de tono claro sobre un cuadro azul oscuro, el monocromo en gris oscuro sólido. Si el símbolo no se ve o el fondo es blanco puro, algo del Step 1-2 de Task 2 o Step 1 de Task 3 no cargó — revisa antes de seguir.

- [ ] **Step 7: Commit**

```bash
git add web/src/dev web/e2e/capturar.mjs web/src/App.tsx .gitignore
git commit -m "feat(web): catalogo de verificacion visual y script de captura con Playwright"
```

---

### Task 5: Átomo `Icono`

`@mui/icons-material` no viene en la versión UMD del design system, así que ellos traen un juego propio; en este proyecto con bundler, `guidelines/20-material-ui.md` pide justamente reemplazarlo por `@mui/icons-material` con trazo redondeado. Se mapea 1 a 1 el mismo conjunto de 17 nombres que declara `index.d.ts` del design system.

**Files:**
- Create: `web/src/components/atoms/Icono/Icono.tsx`
- Test: `web/src/components/atoms/Icono/Icono.test.tsx`
- Modify: `web/src/dev/Catalogo.tsx`

**Interfaces:**
- Produces: `NombreIcono` (unión de 17 strings), `NOMBRES_ICONO: NombreIcono[]`, `Icono(props: { nombre: NombreIcono; tamano?: number; grosor?: number } & Omit<SvgIconProps, 'fontSize'>): JSX.Element` desde `web/src/components/atoms/Icono/Icono.tsx`.

- [ ] **Step 1: Test (falla primero)**

Create `web/src/components/atoms/Icono/Icono.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Icono, NOMBRES_ICONO } from './Icono';

describe('Icono', () => {
  it('tiene los 17 nombres del design system', () => {
    expect(NOMBRES_ICONO).toHaveLength(17);
    expect(NOMBRES_ICONO).toContain('check');
    expect(NOMBRES_ICONO).toContain('banco');
  });

  it('renderiza el trazo correcto para "check"', () => {
    render(<Icono nombre="check" />);
    expect(screen.getByTestId('CheckRoundedIcon')).toBeInTheDocument();
  });

  it('respeta el tamaño pedido', () => {
    render(<Icono nombre="reloj" tamano={32} />);
    expect(screen.getByTestId('ScheduleRoundedIcon')).toHaveStyle({ fontSize: '32px' });
  });

  it('no fija un color propio, para heredar currentColor del texto que acompaña', () => {
    render(<Icono nombre="alerta" />);
    expect(screen.getByTestId('WarningAmberRoundedIcon')).not.toHaveAttribute('color');
  });
});
```

- [ ] **Step 2: Ejecutar y verificar que falla**

Run: `npm run test -w web`
Expected: FAIL — `./Icono` no existe.

- [ ] **Step 3: Implementar**

Create `web/src/components/atoms/Icono/Icono.tsx`:

```tsx
import type { ComponentType } from 'react';
import type { SvgIconProps } from '@mui/material';
import CheckRounded from '@mui/icons-material/CheckRounded';
import ScheduleRounded from '@mui/icons-material/ScheduleRounded';
import WarningAmberRounded from '@mui/icons-material/WarningAmberRounded';
import InfoRounded from '@mui/icons-material/InfoRounded';
import CloseRounded from '@mui/icons-material/CloseRounded';
import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded';
import MicRounded from '@mui/icons-material/MicRounded';
import VolumeUpRounded from '@mui/icons-material/VolumeUpRounded';
import ChatBubbleOutlineRounded from '@mui/icons-material/ChatBubbleOutlineRounded';
import HomeRounded from '@mui/icons-material/HomeRounded';
import DescriptionRounded from '@mui/icons-material/DescriptionRounded';
import NotificationsRounded from '@mui/icons-material/NotificationsRounded';
import OpenInNewRounded from '@mui/icons-material/OpenInNewRounded';
import VerifiedUserRounded from '@mui/icons-material/VerifiedUserRounded';
import ExpandMoreRounded from '@mui/icons-material/ExpandMoreRounded';
import RemoveRounded from '@mui/icons-material/RemoveRounded';
import AccountBalanceRounded from '@mui/icons-material/AccountBalanceRounded';

export type NombreIcono =
  | 'check' | 'reloj' | 'alerta' | 'info' | 'cerrar' | 'atras' | 'mic' | 'parlante'
  | 'chat' | 'casa' | 'papel' | 'campana' | 'externo' | 'escudo' | 'abajo' | 'menos' | 'banco';

const MAPA: Record<NombreIcono, ComponentType<SvgIconProps>> = {
  check: CheckRounded,
  reloj: ScheduleRounded,
  alerta: WarningAmberRounded,
  info: InfoRounded,
  cerrar: CloseRounded,
  atras: ArrowBackRounded,
  mic: MicRounded,
  parlante: VolumeUpRounded,
  chat: ChatBubbleOutlineRounded,
  casa: HomeRounded,
  papel: DescriptionRounded,
  campana: NotificationsRounded,
  externo: OpenInNewRounded,
  escudo: VerifiedUserRounded,
  abajo: ExpandMoreRounded,
  menos: RemoveRounded,
  banco: AccountBalanceRounded,
};

export const NOMBRES_ICONO = Object.keys(MAPA) as NombreIcono[];

export interface IconoProps extends Omit<SvgIconProps, 'fontSize'> {
  nombre: NombreIcono;
  tamano?: number;
  grosor?: number;
}

/** Juego mínimo al estilo Material Symbols Rounded, peso 400, sin relleno. Hereda color con currentColor. */
export function Icono({ nombre, tamano = 24, grosor, sx, ...props }: IconoProps) {
  const Cmp = MAPA[nombre];
  return <Cmp sx={{ fontSize: tamano, strokeWidth: grosor, ...sx }} {...props} />;
}
```

- [ ] **Step 4: Ejecutar y verificar que pasa**

Run: `npm run test -w web`
Expected: PASS.

- [ ] **Step 5: Agregar al catálogo**

En `web/src/dev/Catalogo.tsx`, agrega el import `import { Icono, NOMBRES_ICONO } from '../components/atoms/Icono/Icono';` y esta sección antes de `</Stack>` final:

```tsx
      <section>
        <Typography variant="overline">Icono</Typography>
        <Stack direction="row" spacing={3} sx={{ mt: 2, flexWrap: 'wrap' }}>
          {NOMBRES_ICONO.map((nombre) => (
            <Stack key={nombre} alignItems="center" spacing={0.5}>
              <Icono nombre={nombre} />
              <Typography variant="caption">{nombre}</Typography>
            </Stack>
          ))}
        </Stack>
      </section>
```

- [ ] **Step 6: Captura de verificación visual**

Run: `node web/e2e/capturar.mjs /catalogo 05-icono`
Expected: PNG generado. Ábrelo y confirma que los 17 trazos son redondeados (sin ángulos rectos en las puntas) y del mismo grosor visual — no una mezcla de estilos de ícono.

- [ ] **Step 7: Commit**

```bash
git add web/src/components/atoms/Icono web/src/dev/Catalogo.tsx
git commit -m "feat(web): atomo Icono"
```

---

### Task 6: Átomo `Boton`

**Files:**
- Create: `web/src/components/atoms/Boton/Boton.tsx`
- Test: `web/src/components/atoms/Boton/Boton.test.tsx`
- Modify: `web/src/dev/Catalogo.tsx`

**Interfaces:**
- Consumes: `Icono`, `NombreIcono` de `../Icono/Icono` (Task 5).
- Produces: `Boton(props: BotonProps): JSX.Element` con `BotonProps = Omit<ButtonProps, 'startIcon' | 'endIcon'> & { icono?: NombreIcono; iconoFinal?: NombreIcono; loading?: boolean }` desde `web/src/components/atoms/Boton/Boton.tsx`.

- [ ] **Step 1: Test (falla primero)**

Create `web/src/components/atoms/Boton/Boton.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Boton } from './Boton';

describe('Boton', () => {
  it('es "contained" por defecto, la jerarquía de acción principal', () => {
    render(<Boton>Ver mi plan</Boton>);
    expect(screen.getByRole('button', { name: 'Ver mi plan' })).toHaveClass('MuiButton-contained');
  });

  it('muestra el icono inicial cuando se pide', () => {
    render(<Boton icono="externo">Ir a postulacionenlinea.minvu.cl</Boton>);
    expect(screen.getByTestId('OpenInNewRoundedIcon')).toBeInTheDocument();
  });

  it('se deshabilita y marca aria-busy mientras carga, sin perder su texto', () => {
    render(<Boton loading>Guardando…</Boton>);
    const boton = screen.getByRole('button', { name: 'Guardando…' });
    expect(boton).toBeDisabled();
    expect(boton).toHaveAttribute('aria-busy', 'true');
  });

  it('llama a onClick al presionar', async () => {
    const onClick = vi.fn();
    render(<Boton onClick={onClick}>Guardar y seguir</Boton>);
    await userEvent.click(screen.getByRole('button', { name: 'Guardar y seguir' }));
    expect(onClick).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: Ejecutar y verificar que falla**

Run: `npm run test -w web`
Expected: FAIL — `./Boton` no existe.

- [ ] **Step 3: Implementar**

Create `web/src/components/atoms/Boton/Boton.tsx`:

```tsx
import { Button, type ButtonProps } from '@mui/material';
import { Icono, type NombreIcono } from '../Icono/Icono';

export interface BotonProps extends Omit<ButtonProps, 'startIcon' | 'endIcon'> {
  icono?: NombreIcono;
  iconoFinal?: NombreIcono;
  /** Deshabilita el botón y marca aria-busy. El texto de "Guardando…" lo decide quien lo usa. */
  loading?: boolean;
}

/**
 * Acción de la persona. Una sola jerarquía `contained` por pantalla: si compiten dos, uno de
 * los dos no es la acción principal. Ver `guidelines/20-material-ui.md` y el README de este
 * componente en el design system.
 */
export function Boton({ icono, iconoFinal, loading = false, disabled, children, ...props }: BotonProps) {
  return (
    <Button
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      startIcon={icono ? <Icono nombre={icono} /> : undefined}
      endIcon={iconoFinal ? <Icono nombre={iconoFinal} /> : undefined}
      {...props}
    >
      {children}
    </Button>
  );
}
```

- [ ] **Step 4: Ejecutar y verificar que pasa**

Run: `npm run test -w web`
Expected: PASS.

- [ ] **Step 5: Agregar al catálogo**

En `web/src/dev/Catalogo.tsx`, agrega `import { Boton } from '../components/atoms/Boton/Boton';` y esta sección:

```tsx
      <section>
        <Typography variant="overline">Boton</Typography>
        <Stack spacing={2} sx={{ mt: 2, maxWidth: 320 }}>
          <Boton>Ver mi plan</Boton>
          <Boton variant="outlined">Ver el detalle</Boton>
          <Boton variant="outlined" color="secondary" icono="mic">Contar hablando</Boton>
          <Boton variant="text">Ahora no</Boton>
          <Boton icono="externo">Ir a postulacionenlinea.minvu.cl</Boton>
          <Boton loading>Guardando…</Boton>
        </Stack>
      </section>
```

- [ ] **Step 6: Captura de verificación visual**

Run: `node web/e2e/capturar.mjs /catalogo 06-boton`
Expected: PNG generado. Verifica: radio de esquina generoso (no cuadrado, no totalmente redondo/píldora — `radius-md`), el botón `contained` en azul `brand`, el `outlined` secundario en terracota `accent` (nunca relleno), ningún botón con sombra de elevación, y "Contar hablando" con ícono de micrófono a la izquierda del texto.

- [ ] **Step 7: Commit**

```bash
git add web/src/components/atoms/Boton web/src/dev/Catalogo.tsx
git commit -m "feat(web): atomo Boton"
```

---

### Task 7: Átomo `Chip` (`ChipFiltro` + `ChipEtiqueta`)

Dos funciones que no se mezclan: `ChipFiltro` es tocable y cambia una lista; `ChipEtiqueta` solo informa.

**Files:**
- Create: `web/src/components/atoms/Chip/Chip.tsx`
- Test: `web/src/components/atoms/Chip/Chip.test.tsx`
- Modify: `web/src/dev/Catalogo.tsx`

**Interfaces:**
- Produces: `ChipFiltro(props: ChipProps & { activo?: boolean }): JSX.Element`, `ChipEtiqueta(props: { label: string }): JSX.Element` desde `web/src/components/atoms/Chip/Chip.tsx`.

- [ ] **Step 1: Test (falla primero)**

Create `web/src/components/atoms/Chip/Chip.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChipFiltro, ChipEtiqueta } from './Chip';

describe('ChipFiltro', () => {
  it('mide al menos 48 px de alto, aunque el texto sea corto', () => {
    render(<ChipFiltro label="Arriendo" />);
    expect(screen.getByText('Arriendo').closest('.MuiChip-root')).toHaveStyle({ height: '48px' });
  });

  it('el filtro activo se marca con fondo y borde, no solo con un color', () => {
    render(<ChipFiltro label="Sin crédito" activo />);
    const chip = screen.getByText('Sin crédito').closest('.MuiChip-root') as HTMLElement;
    expect(chip).toHaveStyle({ backgroundColor: 'rgb(228, 237, 248)' });
  });
});

describe('ChipEtiqueta', () => {
  it('muestra la etiqueta informativa', () => {
    render(<ChipEtiqueta label="Región del Biobío" />);
    expect(screen.getByText('Región del Biobío')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Ejecutar y verificar que falla**

Run: `npm run test -w web`
Expected: FAIL — `./Chip` no existe.

- [ ] **Step 3: Implementar**

Create `web/src/components/atoms/Chip/Chip.tsx`:

```tsx
import { Chip, type ChipProps } from '@mui/material';

export interface ChipFiltroProps extends ChipProps {
  activo?: boolean;
}

/** Filtro tocable: cambia lo que se ve en una lista. La selección se marca con fondo y borde juntos. */
export function ChipFiltro({ activo = false, sx, ...props }: ChipFiltroProps) {
  return (
    <Chip
      variant="outlined"
      sx={{
        height: 'var(--size-touch)',
        fontFamily: 'var(--font-sans)',
        borderColor: activo ? 'var(--brand)' : 'var(--border-strong)',
        borderWidth: activo ? 2 : 1,
        backgroundColor: activo ? 'var(--surface-brand-soft)' : 'transparent',
        color: activo ? 'var(--ink-brand)' : 'var(--ink)',
        fontWeight: activo ? 600 : 400,
        ...sx,
      }}
      {...props}
    />
  );
}

export interface ChipEtiquetaProps {
  label: string;
}

/** Etiqueta que solo informa: tipo de programa, región, tramo. No se toca. */
export function ChipEtiqueta({ label }: ChipEtiquetaProps) {
  return (
    <Chip
      label={label}
      variant="outlined"
      size="small"
      sx={{ borderColor: 'var(--border)', color: 'var(--ink-muted)', fontFamily: 'var(--font-sans)' }}
    />
  );
}
```

- [ ] **Step 4: Ejecutar y verificar que pasa**

Run: `npm run test -w web`
Expected: PASS.

- [ ] **Step 5: Agregar al catálogo**

En `web/src/dev/Catalogo.tsx`, agrega `import { ChipFiltro, ChipEtiqueta } from '../components/atoms/Chip/Chip';` y esta sección:

```tsx
      <section>
        <Typography variant="overline">Chip</Typography>
        <Stack direction="row" spacing={1.5} sx={{ mt: 2, flexWrap: 'wrap' }}>
          <ChipFiltro label="Todos" activo />
          <ChipFiltro label="Arriendo" />
          <ChipFiltro label="Sin crédito" />
          <ChipEtiqueta label="Región del Biobío" />
          <ChipEtiqueta label="Tramo 40%" />
        </Stack>
      </section>
```

- [ ] **Step 6: Captura de verificación visual**

Run: `node web/e2e/capturar.mjs /catalogo 07-chip`
Expected: PNG generado. Verifica: los chips son píldora (`radius-pill`), "Todos" activo se distingue por fondo azul suave Y borde, no solo por un tono ligeramente distinto; los `ChipEtiqueta` son visiblemente más chicos y neutros (borde gris, texto `ink-muted`).

- [ ] **Step 7: Commit**

```bash
git add web/src/components/atoms/Chip web/src/dev/Catalogo.tsx
git commit -m "feat(web): atomo Chip (ChipFiltro y ChipEtiqueta)"
```

---

### Task 8: Átomo `CampoTexto`

El `dictado` de este componente es solo el adorno visual del botón de micrófono — `index.d.ts` del design system solo documenta que "muestra" el botón, no una integración de reconocimiento de voz. Cablear Web Speech API real queda fuera de este plan (se avisa en el cierre); aquí se construye el campo fiel a su contrato documentado.

**Files:**
- Create: `web/src/components/atoms/CampoTexto/CampoTexto.tsx`
- Test: `web/src/components/atoms/CampoTexto/CampoTexto.test.tsx`
- Modify: `web/src/dev/Catalogo.tsx`

**Interfaces:**
- Consumes: `Icono` de `../Icono/Icono` (Task 5).
- Produces: `CampoTexto(props: CampoTextoProps): JSX.Element` con `CampoTextoProps = Omit<TextFieldProps, 'label' | 'helperText' | 'error'> & { pregunta: string; ayuda?: string; error?: string; dictado?: boolean; equivalencia?: string }` desde `web/src/components/atoms/CampoTexto/CampoTexto.tsx`.

- [ ] **Step 1: Test (falla primero)**

Create `web/src/components/atoms/CampoTexto/CampoTexto.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CampoTexto } from './CampoTexto';

describe('CampoTexto', () => {
  it('usa la pregunta como etiqueta y la ayuda como texto de apoyo', () => {
    render(
      <CampoTexto
        pregunta="¿Cuántas personas viven contigo?"
        ayuda="Con esto vemos tu grupo familiar."
        value=""
        onChange={() => {}}
      />,
    );
    expect(screen.getByLabelText('¿Cuántas personas viven contigo?')).toBeInTheDocument();
    expect(screen.getByText('Con esto vemos tu grupo familiar.')).toBeInTheDocument();
  });

  it('el error reemplaza la ayuda y marca el campo inválido', () => {
    render(
      <CampoTexto
        pregunta="¿Cuánto tienes ahorrado?"
        ayuda="Con esto vemos si alcanzas el mínimo del programa."
        error="Escribe solo números, sin puntos ni signo peso."
        value=""
        onChange={() => {}}
      />,
    );
    expect(screen.getByText('Escribe solo números, sin puntos ni signo peso.')).toBeInTheDocument();
    expect(screen.queryByText('Con esto vemos si alcanzas el mínimo del programa.')).not.toBeInTheDocument();
    expect(screen.getByLabelText('¿Cuánto tienes ahorrado?')).toBeInvalid();
  });

  it('muestra el botón de dictado cuando se pide', () => {
    render(<CampoTexto pregunta="¿En qué región vives?" dictado value="" onChange={() => {}} />);
    expect(screen.getByRole('button', { name: 'Dictar por voz' })).toBeInTheDocument();
  });

  it('muestra la equivalencia calculada bajo el campo, en vez de pedirla directamente en UF', () => {
    render(<CampoTexto pregunta="¿Cuánto tienes ahorrado?" equivalencia="12,3 UF" value="500000" onChange={() => {}} />);
    expect(screen.getByText('12,3 UF')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Ejecutar y verificar que falla**

Run: `npm run test -w web`
Expected: FAIL — `./CampoTexto` no existe.

- [ ] **Step 3: Implementar**

Create `web/src/components/atoms/CampoTexto/CampoTexto.tsx`:

```tsx
import { TextField, IconButton, InputAdornment, Typography, type TextFieldProps } from '@mui/material';
import { Icono } from '../Icono/Icono';

export interface CampoTextoProps extends Omit<TextFieldProps, 'label' | 'helperText' | 'error'> {
  /** La pregunta completa en lenguaje natural, no el nombre del campo. */
  pregunta: string;
  /** Para qué sirve el dato. */
  ayuda?: string;
  /** Qué hacer para arreglarlo. Reemplaza a la ayuda. */
  error?: string;
  /** Muestra el botón de micrófono como adorno final (afordancia visual; el reconocimiento de
   * voz lo cablea quien use el campo). */
  dictado?: boolean;
  /** Equivalencia calculada, por ejemplo el monto en UF. */
  equivalencia?: string;
}

/**
 * Entrada de un dato de la entrevista. Tres partes siempre visibles: la pregunta como etiqueta,
 * el campo, y una ayuda que dice para qué sirve el dato — nunca el formato, eso va en `placeholder`.
 */
export function CampoTexto({
  pregunta,
  ayuda,
  error,
  dictado,
  equivalencia,
  InputProps,
  sx,
  ...props
}: CampoTextoProps) {
  return (
    <>
      <TextField
        label={pregunta}
        helperText={error ?? ayuda}
        error={Boolean(error)}
        InputProps={{
          ...InputProps,
          endAdornment: dictado ? (
            <InputAdornment position="end">
              <IconButton aria-label="Dictar por voz" sx={{ color: 'var(--accent)' }}>
                <Icono nombre="mic" />
              </IconButton>
            </InputAdornment>
          ) : InputProps?.endAdornment,
        }}
        sx={{
          '& .MuiFormHelperText-root': { color: error ? 'var(--ink-danger)' : 'var(--ink-muted)' },
          ...sx,
        }}
        {...props}
      />
      {equivalencia && (
        <Typography sx={{ fontFamily: 'var(--font-mono)', fontSize: '15px', color: 'var(--ink-muted)', mt: 0.5 }}>
          {equivalencia}
        </Typography>
      )}
    </>
  );
}
```

- [ ] **Step 4: Ejecutar y verificar que pasa**

Run: `npm run test -w web`
Expected: PASS.

- [ ] **Step 5: Agregar al catálogo**

En `web/src/dev/Catalogo.tsx`, agrega `import { CampoTexto } from '../components/atoms/CampoTexto/CampoTexto';` y esta sección:

```tsx
      <section>
        <Typography variant="overline">CampoTexto</Typography>
        <Stack spacing={3} sx={{ mt: 2 }}>
          <CampoTexto
            pregunta="¿Cuántas personas viven contigo?"
            ayuda="Con esto vemos si entras en el 40% del Registro Social de Hogares."
            value=""
            onChange={() => {}}
          />
          <CampoTexto
            pregunta="¿Cuánto tienes ahorrado?"
            equivalencia="12,3 UF"
            value="500000"
            inputMode="numeric"
            onChange={() => {}}
          />
          <CampoTexto pregunta="¿En qué región vives?" dictado value="" onChange={() => {}} />
          <CampoTexto
            pregunta="¿Cuál es tu correo?"
            error="Escribe un correo con arroba, por ejemplo nombre@correo.cl."
            value="no-es-un-correo"
            onChange={() => {}}
          />
        </Stack>
      </section>
```

- [ ] **Step 6: Captura de verificación visual**

Run: `node web/e2e/capturar.mjs /catalogo 08-campotexto`
Expected: PNG generado. Verifica: la etiqueta es la pregunta completa (no un nombre de campo corto), la ayuda se ve en gris apagado, el campo con error muestra el borde y el texto en rojo/terracota oscuro (`ink-danger`) y NO muestra la ayuda original a la vez, y el campo con `dictado` tiene el ícono de micrófono a la derecha en color terracota.

- [ ] **Step 7: Commit**

```bash
git add web/src/components/atoms/CampoTexto web/src/dev/Catalogo.tsx
git commit -m "feat(web): atomo CampoTexto"
```

---

### Task 9: Molécula `SelloElegibilidad` y el mapeo de estados backend → design system

El componente más delicado del sistema: es lo único que la persona recuerda de la pantalla. El motor de reglas del backend solo tiene 3 estados (`elegible | no_elegible | falta_dato`); el design system define 4 (`califica | falta | posible | noAplica`). Este task también crea el mapeo explícito entre ambos, documentando que `'posible'` no se usa hoy.

**Files:**
- Create: `web/src/components/molecules/SelloElegibilidad/SelloElegibilidad.tsx`
- Test: `web/src/components/molecules/SelloElegibilidad/SelloElegibilidad.test.tsx`
- Create: `web/src/lib/estado.ts`
- Test: `web/src/lib/estado.test.ts`
- Modify: `web/src/dev/Catalogo.tsx`

**Interfaces:**
- Consumes: `Icono`, `NombreIcono` de `../../atoms/Icono/Icono` (Task 5). `EstadoElegibilidad` (backend) de `../types/dominio` (Task 1).
- Produces: `EstadoElegibilidad` (unión de 4, del design system) y `SelloElegibilidad(props: { estado: EstadoElegibilidad; programa?: string; compacto?: boolean }): JSX.Element` desde `SelloElegibilidad.tsx`. `mapEstado(estado: EstadoBackend): EstadoElegibilidad` desde `web/src/lib/estado.ts` — toda pantalla que reciba un `ResultadoPrograma` de la API pasa su `estado` por esta función antes de dárselo a `SelloElegibilidad`.

- [ ] **Step 1: Test del componente (falla primero)**

Create `web/src/components/molecules/SelloElegibilidad/SelloElegibilidad.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SelloElegibilidad } from './SelloElegibilidad';

describe('SelloElegibilidad', () => {
  it('muestra la palabra "Califica" dentro del sello, no solo el color', () => {
    render(<SelloElegibilidad estado="califica" />);
    expect(screen.getByText('Califica')).toBeInTheDocument();
  });

  it('nunca escribe "rechazado" ni "no cumple" para noAplica', () => {
    render(<SelloElegibilidad estado="noAplica" />);
    expect(screen.getByText('No aplica')).toBeInTheDocument();
    expect(screen.queryByText(/rechazad/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/no cumple/i)).not.toBeInTheDocument();
  });

  it('con programa, antepone la sigla a la palabra', () => {
    render(<SelloElegibilidad estado="falta" programa="DS49" />);
    expect(screen.getByText('DS49 · Falta un dato')).toBeInTheDocument();
  });

  it('en compacto baja de tamaño pero conserva el texto', () => {
    render(<SelloElegibilidad estado="posible" compacto />);
    const chip = screen.getByText('Posible').closest('.MuiChip-root');
    expect(chip).toHaveStyle({ height: '26px' });
  });
});
```

- [ ] **Step 2: Ejecutar y verificar que falla**

Run: `npm run test -w web`
Expected: FAIL — `./SelloElegibilidad` no existe.

- [ ] **Step 3: Implementar el componente**

Create `web/src/components/molecules/SelloElegibilidad/SelloElegibilidad.tsx`:

```tsx
import { Chip } from '@mui/material';
import { Icono, type NombreIcono } from '../../atoms/Icono/Icono';

export type EstadoElegibilidad = 'califica' | 'falta' | 'posible' | 'noAplica';

const CONFIG: Record<EstadoElegibilidad, { palabra: string; color: string; icono: NombreIcono }> = {
  califica: { palabra: 'Califica', color: 'var(--success)', icono: 'check' },
  falta: { palabra: 'Falta un dato', color: 'var(--warning)', icono: 'alerta' },
  posible: { palabra: 'Posible', color: 'var(--brand)', icono: 'info' },
  noAplica: { palabra: 'No aplica', color: 'var(--border-strong)', icono: 'menos' },
};

export interface SelloElegibilidadProps {
  estado: EstadoElegibilidad;
  programa?: string;
  compacto?: boolean;
}

/**
 * El resultado del motor de reglas para un programa. Solo existen estos cuatro valores y no se
 * agregan más sin cambiar el motor. El sello nunca viaja solo: junto a él van la razón y la
 * regla citada (ver `TarjetaPrograma`, Task 21).
 */
export function SelloElegibilidad({ estado, programa, compacto = false }: SelloElegibilidadProps) {
  const { palabra, color, icono } = CONFIG[estado];
  const texto = programa ? `${programa} · ${palabra}` : palabra;
  return (
    <Chip
      icon={<Icono nombre={icono} tamano={compacto ? 16 : 20} />}
      label={texto}
      sx={{
        height: compacto ? 26 : 'var(--size-touch)',
        backgroundColor: color,
        color: 'var(--ink-on-fill)',
        fontFamily: 'var(--font-sans)',
        fontWeight: 600,
        fontSize: compacto ? '13px' : '16px',
        letterSpacing: compacto ? '0.04em' : undefined,
        '& .MuiChip-icon': { color: 'var(--ink-on-fill)' },
      }}
    />
  );
}
```

- [ ] **Step 4: Test del mapeo backend → design system (falla primero)**

Create `web/src/lib/estado.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { mapEstado } from './estado';

describe('mapEstado', () => {
  it('mapea elegible a califica', () => expect(mapEstado('elegible')).toBe('califica'));
  it('mapea falta_dato a falta', () => expect(mapEstado('falta_dato')).toBe('falta'));
  it('mapea no_elegible a noAplica, nunca a "posible"', () => expect(mapEstado('no_elegible')).toBe('noAplica'));
});
```

- [ ] **Step 5: Ejecutar y verificar que falla**

Run: `npm run test -w web`
Expected: FAIL — `./estado` no existe (el componente del Step 3 ya debería pasar sus propios tests; solo falta este módulo).

- [ ] **Step 6: Implementar el mapeo**

Create `web/src/lib/estado.ts`:

```ts
import type { EstadoElegibilidad as EstadoBackend } from '../types/dominio';
import type { EstadoElegibilidad as EstadoUI } from '../components/molecules/SelloElegibilidad/SelloElegibilidad';

/**
 * El motor de reglas del backend solo conoce 3 estados. El design system define un cuarto,
 * 'posible' (una condición que depende de algo aún no verificado contra el llamado), que
 * ninguna regla del motor produce hoy — no se simula. Si el backend lo agrega, se mapea aquí.
 */
export function mapEstado(estado: EstadoBackend): EstadoUI {
  switch (estado) {
    case 'elegible':
      return 'califica';
    case 'falta_dato':
      return 'falta';
    case 'no_elegible':
      return 'noAplica';
  }
}
```

- [ ] **Step 7: Ejecutar y verificar que todo pasa**

Run: `npm run test -w web`
Expected: PASS.

- [ ] **Step 8: Agregar al catálogo**

En `web/src/dev/Catalogo.tsx`, agrega `import { SelloElegibilidad } from '../components/molecules/SelloElegibilidad/SelloElegibilidad';` y esta sección:

```tsx
      <section>
        <Typography variant="overline">SelloElegibilidad</Typography>
        <Stack direction="row" spacing={1.5} sx={{ mt: 2, flexWrap: 'wrap' }}>
          <SelloElegibilidad estado="califica" programa="DS49" />
          <SelloElegibilidad estado="falta" programa="DS1" />
          <SelloElegibilidad estado="posible" programa="DS19" />
          <SelloElegibilidad estado="noAplica" programa="DS52" />
        </Stack>
        <Stack direction="row" spacing={1.5} sx={{ mt: 2, alignItems: 'center' }}>
          <SelloElegibilidad estado="califica" compacto />
          <SelloElegibilidad estado="falta" compacto />
        </Stack>
      </section>
```

- [ ] **Step 9: Captura de verificación visual**

Run: `node web/e2e/capturar.mjs /catalogo 09-selloelegibilidad`
Expected: PNG generado. Verifica: los 4 sellos tienen colores claramente distintos en tono, no solo en matiz (para que se distingan sin depender del rojo/verde), cada uno con su ícono y palabra legibles en blanco sobre el relleno, y las versiones `compacto` son notoriamente más chicas.

- [ ] **Step 10: Commit**

```bash
git add web/src/components/molecules/SelloElegibilidad web/src/lib/estado.ts web/src/lib/estado.test.ts web/src/dev/Catalogo.tsx
git commit -m "feat(web): molecula SelloElegibilidad y mapeo de estados backend-design system"
```

---

### Task 10: Molécula `OpcionTarjeta`

Reemplaza al radio suelto en toda la entrevista. La tarjeta entera es el objetivo tocable, marcada con borde y fondo, nunca solo con el punto del radio.

**Files:**
- Create: `web/src/components/molecules/OpcionTarjeta/OpcionTarjeta.tsx`
- Test: `web/src/components/molecules/OpcionTarjeta/OpcionTarjeta.test.tsx`
- Modify: `web/src/dev/Catalogo.tsx`

**Interfaces:**
- Produces: `OpcionTarjetaItem { value: string; titulo: string; detalle?: string }`, `OpcionTarjeta(props: { pregunta?: string; opciones: OpcionTarjetaItem[]; value?: string; onChange?: (e: ChangeEvent<HTMLInputElement>) => void; name?: string }): JSX.Element` desde `web/src/components/molecules/OpcionTarjeta/OpcionTarjeta.tsx`.

- [ ] **Step 1: Test (falla primero)**

Create `web/src/components/molecules/OpcionTarjeta/OpcionTarjeta.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OpcionTarjeta } from './OpcionTarjeta';

const opciones = [
  { value: 'allegado', titulo: 'Vivo de allegado', detalle: 'En la casa de un familiar, sin contrato.' },
  { value: 'arriendo', titulo: 'Arriendo', detalle: 'Pago arriendo mensual.' },
  { value: 'no_seguro', titulo: 'No estoy seguro' },
];

describe('OpcionTarjeta', () => {
  it('muestra la pregunta y cada opción con su título y detalle', () => {
    render(<OpcionTarjeta pregunta="¿Dónde vives hoy?" opciones={opciones} name="vivienda" />);
    expect(screen.getByText('¿Dónde vives hoy?')).toBeInTheDocument();
    expect(screen.getByText('Vivo de allegado')).toBeInTheDocument();
    expect(screen.getByText('En la casa de un familiar, sin contrato.')).toBeInTheDocument();
  });

  it('"No estoy seguro" es una opción válida, sin detalle obligatorio', () => {
    render(<OpcionTarjeta opciones={opciones} name="vivienda" />);
    expect(screen.getByText('No estoy seguro')).toBeInTheDocument();
  });

  it('llama a onChange con el value de la opción elegida', async () => {
    const onChange = vi.fn();
    render(<OpcionTarjeta opciones={opciones} name="vivienda" onChange={onChange} />);
    await userEvent.click(screen.getByText('Arriendo'));
    expect(onChange).toHaveBeenCalled();
    expect((onChange.mock.calls[0][0] as { target: { value: string } }).target.value).toBe('arriendo');
  });
});
```

- [ ] **Step 2: Ejecutar y verificar que falla**

Run: `npm run test -w web`
Expected: FAIL — `./OpcionTarjeta` no existe.

- [ ] **Step 3: Implementar**

Create `web/src/components/molecules/OpcionTarjeta/OpcionTarjeta.tsx`:

```tsx
import type { ChangeEvent } from 'react';
import { RadioGroup, FormControlLabel, Radio, Paper, Stack, Typography } from '@mui/material';

export interface OpcionTarjetaItem {
  value: string;
  titulo: string;
  detalle?: string;
}

export interface OpcionTarjetaProps {
  pregunta?: string;
  /** Máximo cuatro. "No estoy seguro" va siempre al final. */
  opciones: OpcionTarjetaItem[];
  value?: string;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  name?: string;
}

/**
 * Opción única presentada como tarjeta grande. La tarjeta entera es el objetivo tocable, no
 * solo el círculo del radio. La seleccionada se marca con borde `brand` de 2 px y fondo
 * `surface-brand-soft`, nunca solo con el punto del radio.
 */
export function OpcionTarjeta({ pregunta, opciones, value, onChange, name }: OpcionTarjetaProps) {
  return (
    <Stack spacing={2}>
      {pregunta && (
        <Typography sx={{ fontFamily: 'var(--font-sans)', fontSize: '18px', color: 'var(--ink-strong)' }}>
          {pregunta}
        </Typography>
      )}
      <RadioGroup name={name} value={value ?? ''} onChange={onChange}>
        <Stack spacing={1.5}>
          {opciones.map((o) => {
            const seleccionada = o.value === value;
            return (
              <Paper
                key={o.value}
                variant="outlined"
                sx={{
                  borderRadius: 'var(--radius-md)',
                  borderColor: seleccionada ? 'var(--brand)' : 'var(--border)',
                  borderWidth: seleccionada ? 2 : 1,
                  backgroundColor: seleccionada ? 'var(--surface-brand-soft)' : 'var(--surface-raised)',
                }}
              >
                <FormControlLabel
                  value={o.value}
                  control={<Radio />}
                  sx={{
                    width: '100%',
                    minHeight: 'var(--size-control)',
                    m: 0,
                    p: 'var(--space-4)',
                    alignItems: 'flex-start',
                  }}
                  label={
                    <Stack sx={{ py: 0.5 }}>
                      <Typography
                        sx={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '16px', color: 'var(--ink-strong)' }}
                      >
                        {o.titulo}
                      </Typography>
                      {o.detalle && (
                        <Typography sx={{ fontFamily: 'var(--font-sans)', fontSize: '14px', color: 'var(--ink-muted)' }}>
                          {o.detalle}
                        </Typography>
                      )}
                    </Stack>
                  }
                />
              </Paper>
            );
          })}
        </Stack>
      </RadioGroup>
    </Stack>
  );
}
```

- [ ] **Step 4: Ejecutar y verificar que pasa**

Run: `npm run test -w web`
Expected: PASS.

- [ ] **Step 5: Agregar al catálogo**

En `web/src/dev/Catalogo.tsx`, agrega `import { OpcionTarjeta } from '../components/molecules/OpcionTarjeta/OpcionTarjeta';` y esta sección:

```tsx
      <section>
        <Typography variant="overline">OpcionTarjeta</Typography>
        <div style={{ marginTop: 16 }}>
          <OpcionTarjeta
            pregunta="¿Dónde vives hoy?"
            name="vivienda-catalogo"
            value="allegado"
            opciones={[
              { value: 'allegado', titulo: 'Vivo de allegado', detalle: 'En la casa de un familiar, sin contrato.' },
              { value: 'arriendo', titulo: 'Arriendo', detalle: 'Pago arriendo mensual.' },
              { value: 'sitio_propio', titulo: 'Tengo sitio propio', detalle: 'Un terreno a mi nombre, sin construir.' },
              { value: 'no_seguro', titulo: 'No estoy seguro' },
            ]}
          />
        </div>
      </section>
```

- [ ] **Step 6: Captura de verificación visual**

Run: `node web/e2e/capturar.mjs /catalogo 10-opciontarjeta`
Expected: PNG generado. Verifica: la tarjeta "Vivo de allegado" (la seleccionada) tiene borde azul grueso y fondo celeste, claramente distinta de las demás; "No estoy seguro" está al final sin detalle y no se ve incompleta.

- [ ] **Step 7: Commit**

```bash
git add web/src/components/molecules/OpcionTarjeta web/src/dev/Catalogo.tsx
git commit -m "feat(web): molecula OpcionTarjeta"
```

---

### Task 11: Molécula `Alerta`

El `index.d.ts` del design system tipa `accion` como un `string` (la etiqueta del botón) sin ningún manejador de click — un botón sin handler no hace nada, así que este task agrega `onAccion?: () => void` como extensión pragmática y documentada sobre el contrato publicado, no como reemplazo de él.

**Files:**
- Create: `web/src/components/molecules/Alerta/Alerta.tsx`
- Test: `web/src/components/molecules/Alerta/Alerta.test.tsx`
- Modify: `web/src/dev/Catalogo.tsx`

**Interfaces:**
- Produces: `Severidad = 'info' | 'success' | 'warning' | 'error'`, `Alerta(props: { severity?: Severidad; titulo?: string; children?: ReactNode; accion?: string; onAccion?: () => void }): JSX.Element` desde `web/src/components/molecules/Alerta/Alerta.tsx`.

- [ ] **Step 1: Test (falla primero)**

Create `web/src/components/molecules/Alerta/Alerta.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Alerta } from './Alerta';

describe('Alerta', () => {
  it('dice qué pasó y qué sigue', () => {
    render(<Alerta severity="warning">El llamado del DS1 cierra el 28 de octubre. Te faltan 2 documentos.</Alerta>);
    expect(screen.getByText(/El llamado del DS1 cierra el 28 de octubre/)).toBeInTheDocument();
  });

  it('usa la superficie suave de warning, no un rojo de bloqueo', () => {
    render(<Alerta severity="warning">Plazo por vencer.</Alerta>);
    expect(screen.getByRole('alert')).toHaveStyle({ backgroundColor: 'rgb(253, 240, 217)' });
  });

  it('el título hace de palabra cuando existe, junto al icono', () => {
    render(
      <Alerta severity="success" titulo="Documento listo">
        Guardamos tu certificado.
      </Alerta>,
    );
    expect(screen.getByText('Documento listo')).toBeInTheDocument();
    expect(screen.getByTestId('SuccessOutlinedIcon')).toBeInTheDocument();
  });

  it('la acción llama a onAccion al presionarla', async () => {
    const onAccion = vi.fn();
    render(
      <Alerta severity="info" accion="Ver mi plan" onAccion={onAccion}>
        Calificas para DS49.
      </Alerta>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Ver mi plan' }));
    expect(onAccion).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: Ejecutar y verificar que falla**

Run: `npm run test -w web`
Expected: FAIL — `./Alerta` no existe.

- [ ] **Step 3: Implementar**

Create `web/src/components/molecules/Alerta/Alerta.tsx`:

```tsx
import type { ReactNode } from 'react';
import { Alert, AlertTitle, Button } from '@mui/material';

export type Severidad = 'info' | 'success' | 'warning' | 'error';

const SUPERFICIE: Record<Severidad, { fondo: string; tinta: string }> = {
  info: { fondo: 'var(--surface-brand-soft)', tinta: 'var(--ink-brand)' },
  success: { fondo: 'var(--surface-success-soft)', tinta: 'var(--ink-success)' },
  warning: { fondo: 'var(--surface-warning-soft)', tinta: 'var(--ink-warning)' },
  error: { fondo: 'var(--surface-danger-soft)', tinta: 'var(--ink-danger)' },
};

export interface AlertaProps {
  severity?: Severidad;
  titulo?: string;
  children?: ReactNode;
  /** Un solo enlace de acción, al final del mensaje. */
  accion?: string;
  /** No forma parte del `index.d.ts` publicado (que solo trae la etiqueta); se agrega porque
   * un botón de acción sin manejador no hace nada. Opcional a propósito. */
  onAccion?: () => void;
}

/**
 * Mensaje del sistema sobre el estado del trámite. Máximo una por pantalla — si hay dos cosas
 * urgentes, la segunda va dentro de la tarjeta que le corresponde, no en una segunda alerta.
 */
export function Alerta({ severity = 'info', titulo, children, accion, onAccion }: AlertaProps) {
  const { fondo, tinta } = SUPERFICIE[severity];
  return (
    <Alert
      severity={severity}
      variant="standard"
      sx={{
        backgroundColor: fondo,
        color: tinta,
        borderRadius: 'var(--radius-md)',
        fontFamily: 'var(--font-sans)',
        '& .MuiAlert-icon': { color: tinta },
      }}
      action={
        accion ? (
          <Button color="inherit" size="small" onClick={onAccion} sx={{ fontWeight: 700 }}>
            {accion}
          </Button>
        ) : undefined
      }
    >
      {titulo && <AlertTitle sx={{ fontWeight: 700 }}>{titulo}</AlertTitle>}
      {children}
    </Alert>
  );
}
```

- [ ] **Step 4: Ejecutar y verificar que pasa**

Run: `npm run test -w web`
Expected: PASS.

- [ ] **Step 5: Agregar al catálogo**

En `web/src/dev/Catalogo.tsx`, agrega `import { Alerta } from '../components/molecules/Alerta/Alerta';` y esta sección:

```tsx
      <section>
        <Typography variant="overline">Alerta</Typography>
        <Stack spacing={2} sx={{ mt: 2 }}>
          <Alerta severity="info" accion="Ver mi plan">Calificas para DS49.</Alerta>
          <Alerta severity="success" titulo="Documento listo">Guardamos tu certificado del RSH.</Alerta>
          <Alerta severity="warning">El llamado del DS1 cierra el 28 de octubre. Te faltan 2 documentos.</Alerta>
          <Alerta severity="error">Este llamado ya cerró.</Alerta>
        </Stack>
      </section>
```

- [ ] **Step 6: Captura de verificación visual**

Run: `node web/e2e/capturar.mjs /catalogo 11-alerta`
Expected: PNG generado. Verifica: los 4 tonos usan superficies suaves (no colores saturados que compitan con el botón principal), cada uno con su ícono coherente con la tinta del texto, y "Documento listo" muestra el título en negrita distinto del cuerpo.

- [ ] **Step 7: Commit**

```bash
git add web/src/components/molecules/Alerta web/src/dev/Catalogo.tsx
git commit -m "feat(web): molecula Alerta"
```

---

### Task 12: Molécula `AvisoLimite`

El texto es fijo y no se edita desde la pantalla — existe por una decisión de producto, no de diseño: "Rumbo a Casa no postula por nadie y no pide Clave Única". `index.d.ts` tipa la prop como `conSalida?: boolean` (no como `momento: 'plan' | 'salida'`, que es como lo nombra la prosa del README) — se sigue el tipo publicado.

**Files:**
- Create: `web/src/components/molecules/AvisoLimite/AvisoLimite.tsx`
- Test: `web/src/components/molecules/AvisoLimite/AvisoLimite.test.tsx`
- Modify: `web/src/dev/Catalogo.tsx`

**Interfaces:**
- Consumes: `Icono` de `../../atoms/Icono/Icono` (Task 5).
- Produces: `AvisoLimite(props: { conSalida?: boolean }): JSX.Element` desde `web/src/components/molecules/AvisoLimite/AvisoLimite.tsx`.

- [ ] **Step 1: Test (falla primero)**

Create `web/src/components/molecules/AvisoLimite/AvisoLimite.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AvisoLimite } from './AvisoLimite';

describe('AvisoLimite', () => {
  it('dice siempre que nunca se pide la Clave Única', () => {
    render(<AvisoLimite />);
    expect(screen.getByText(/Nunca te pedimos tu Clave Única/)).toBeInTheDocument();
  });

  it('sin conSalida, no muestra el enlace al sitio del MINVU', () => {
    render(<AvisoLimite />);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('con conSalida, muestra el dominio completo y abre en una pestaña nueva del navegador', () => {
    render(<AvisoLimite conSalida />);
    const enlace = screen.getByRole('link', { name: /postulacionenlinea\.minvu\.cl/ });
    expect(enlace).toHaveAttribute('href', 'https://postulacionenlinea.minvu.cl');
    expect(enlace).toHaveAttribute('target', '_blank');
  });

  it('no tiene botón de cerrar', () => {
    render(<AvisoLimite conSalida />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Ejecutar y verificar que falla**

Run: `npm run test -w web`
Expected: FAIL — `./AvisoLimite` no existe.

- [ ] **Step 3: Implementar**

Create `web/src/components/molecules/AvisoLimite/AvisoLimite.tsx`:

```tsx
import { Paper, Stack, Typography, Link } from '@mui/material';
import { Icono } from '../../atoms/Icono/Icono';

export interface AvisoLimiteProps {
  /** true justo antes del enlace de salida al sitio del MINVU; false la primera vez que se
   * llega a un plan completo. */
  conSalida?: boolean;
}

const DOMINIO = 'postulacionenlinea.minvu.cl';

/**
 * El aviso de lo que la app no hace. Aparece solo dos veces en todo el recorrido. El texto es
 * fijo y no se edita desde la pantalla que lo usa — es la única forma de garantizar que el
 * mensaje sea siempre el mismo.
 */
export function AvisoLimite({ conSalida = false }: AvisoLimiteProps) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 'var(--space-4)',
        backgroundColor: 'var(--surface-brand-soft)',
        borderColor: 'var(--surface-brand-soft)',
        borderRadius: 'var(--radius-md)',
      }}
    >
      <Stack direction="row" spacing={1.5}>
        <Icono nombre="escudo" tamano={20} sx={{ color: 'var(--ink-brand)', flexShrink: 0, mt: '2px' }} />
        <Stack spacing={1}>
          <Typography sx={{ fontFamily: 'var(--font-sans)', fontSize: '16px', color: 'var(--ink-brand)' }}>
            Te preparamos para postular: ordenamos tus datos, evaluamos tu elegibilidad y armamos tu
            plan de documentos.
          </Typography>
          <Typography sx={{ fontFamily: 'var(--font-sans)', fontSize: '16px', color: 'var(--ink-brand)' }}>
            Postulas tú, con tu Clave Única, en tu propio navegador.
          </Typography>
          <Typography sx={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '16px', color: 'var(--ink-brand)' }}>
            Nunca te pedimos tu Clave Única, ni entramos a {DOMINIO} por ti.
          </Typography>
          {conSalida && (
            <Link
              href={`https://${DOMINIO}`}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ fontFamily: 'var(--font-mono)', fontSize: '15px', color: 'var(--ink-brand)' }}
            >
              Ir a {DOMINIO}
            </Link>
          )}
        </Stack>
      </Stack>
    </Paper>
  );
}
```

- [ ] **Step 4: Ejecutar y verificar que pasa**

Run: `npm run test -w web`
Expected: PASS.

- [ ] **Step 5: Agregar al catálogo**

En `web/src/dev/Catalogo.tsx`, agrega `import { AvisoLimite } from '../components/molecules/AvisoLimite/AvisoLimite';` y esta sección:

```tsx
      <section>
        <Typography variant="overline">AvisoLimite</Typography>
        <Stack spacing={2} sx={{ mt: 2 }}>
          <AvisoLimite />
          <AvisoLimite conSalida />
        </Stack>
      </section>
```

- [ ] **Step 6: Captura de verificación visual**

Run: `node web/e2e/capturar.mjs /catalogo 12-avisolimite`
Expected: PNG generado. Verifica: fondo azul suave consistente con `surface-brand-soft`, ícono de escudo, y la segunda instancia con el enlace visible mostrando el dominio completo en `dato` (monoespaciada).

- [ ] **Step 7: Commit**

```bash
git add web/src/components/molecules/AvisoLimite web/src/dev/Catalogo.tsx
git commit -m "feat(web): molecula AvisoLimite"
```

---

### Task 13: Molécula `PasoAPaso`

Responde a las dos preguntas que hacen abandonar una entrevista larga: cuánto falta y si se puede volver. `index.d.ts` no incluye un manejador de click (a diferencia de la prosa del README, que sí lo menciona como `onStepClick`); se agrega `onActivarPaso?: (indice: number) => void`, con nombre en español consistente con el resto del tipo (`pasos`/`activo`), porque sin él la mitad del propósito documentado del componente ("si puedo volver") no se puede cumplir.

**Files:**
- Create: `web/src/components/molecules/PasoAPaso/PasoAPaso.tsx`
- Test: `web/src/components/molecules/PasoAPaso/PasoAPaso.test.tsx`
- Modify: `web/src/dev/Catalogo.tsx`

**Interfaces:**
- Consumes: `Icono` de `../../atoms/Icono/Icono` (Task 5).
- Produces: `PasoAPaso(props: { pasos: string[]; activo?: number; onActivarPaso?: (indice: number) => void }): JSX.Element` desde `web/src/components/molecules/PasoAPaso/PasoAPaso.tsx`.

- [ ] **Step 1: Test (falla primero)**

Create `web/src/components/molecules/PasoAPaso/PasoAPaso.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PasoAPaso } from './PasoAPaso';

const pasos = ['Familia', 'Vivienda', 'Ahorro', 'Ingreso', 'Región'];

describe('PasoAPaso', () => {
  it('muestra el número y el total como dato, no solo la barra', () => {
    render(<PasoAPaso pasos={pasos} activo={2} />);
    expect(screen.getByText('Paso 3 de 5')).toBeInTheDocument();
  });

  it('los pasos ya contestados son tocables', async () => {
    const onActivarPaso = vi.fn();
    render(<PasoAPaso pasos={pasos} activo={2} onActivarPaso={onActivarPaso} />);
    await userEvent.click(screen.getByRole('button', { name: /Familia/ }));
    expect(onActivarPaso).toHaveBeenCalledWith(0);
  });

  it('los pasos pendientes no son tocables', () => {
    render(<PasoAPaso pasos={pasos} activo={2} onActivarPaso={vi.fn()} />);
    expect(screen.queryByRole('button', { name: /Región/ })).not.toBeInTheDocument();
  });

  it('nunca muestra más de seis pasos', () => {
    const muchos = ['1', '2', '3', '4', '5', '6', '7', '8'];
    render(<PasoAPaso pasos={muchos} activo={0} />);
    expect(screen.getByText('Paso 1 de 6')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Ejecutar y verificar que falla**

Run: `npm run test -w web`
Expected: FAIL — `./PasoAPaso` no existe.

- [ ] **Step 3: Implementar**

Create `web/src/components/molecules/PasoAPaso/PasoAPaso.tsx`:

```tsx
import type { ReactNode } from 'react';
import { Stepper, Step, StepButton, StepLabel, Typography, Stack, Box } from '@mui/material';
import { Icono } from '../../atoms/Icono/Icono';

export interface PasoAPasoProps {
  /** Nombres cortos, de una palabra, del mundo de la persona (Vivienda, Familia, Ahorro…). Máximo seis. */
  pasos: string[];
  activo?: number;
  onActivarPaso?: (indice: number) => void;
}

interface IconoPasoProps {
  activo?: boolean;
  completado?: boolean;
  icon: ReactNode;
}

function IconoPaso({ activo, completado, icon }: IconoPasoProps) {
  const color = completado ? 'var(--success)' : activo ? 'var(--brand)' : 'var(--border-strong)';
  return (
    <Box
      sx={{
        width: 24,
        height: 24,
        borderRadius: '50%',
        backgroundColor: color,
        color: 'var(--ink-on-fill)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 13,
        fontWeight: 700,
      }}
    >
      {completado ? <Icono nombre="check" tamano={14} /> : icon}
    </Box>
  );
}

/**
 * Avance de la entrevista. Responde a las dos preguntas que hacen abandonar: cuánto falta y si
 * se puede volver. Los pasos ya contestados son tocables y se pueden corregir; los pendientes, no.
 */
export function PasoAPaso({ pasos, activo = 0, onActivarPaso }: PasoAPasoProps) {
  const pasosMostrados = pasos.slice(0, 6);
  return (
    <Stack spacing={1}>
      <Typography
        sx={{
          fontFamily: 'var(--font-sans)',
          fontSize: '13px',
          fontWeight: 600,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          color: 'var(--ink-muted)',
        }}
      >
        Paso {Math.min(activo + 1, pasosMostrados.length)} de {pasosMostrados.length}
      </Typography>
      <Stepper activeStep={activo} nonLinear alternativeLabel>
        {pasosMostrados.map((nombre, indice) => {
          const completado = indice < activo;
          const tocable = indice <= activo && Boolean(onActivarPaso);
          const icono = <IconoPaso activo={indice === activo} completado={completado} icon={indice + 1} />;
          return (
            <Step key={nombre} completed={completado}>
              {tocable ? (
                <StepButton onClick={() => onActivarPaso?.(indice)} icon={icono}>
                  {nombre}
                </StepButton>
              ) : (
                <StepLabel StepIconComponent={() => icono}>{nombre}</StepLabel>
              )}
            </Step>
          );
        })}
      </Stepper>
    </Stack>
  );
}
```

- [ ] **Step 4: Ejecutar y verificar que pasa**

Run: `npm run test -w web`
Expected: PASS.

- [ ] **Step 5: Agregar al catálogo**

En `web/src/dev/Catalogo.tsx`, agrega `import { PasoAPaso } from '../components/molecules/PasoAPaso/PasoAPaso';` y esta sección:

```tsx
      <section>
        <Typography variant="overline">PasoAPaso</Typography>
        <div style={{ marginTop: 16 }}>
          <PasoAPaso pasos={['Familia', 'Vivienda', 'Ahorro', 'Ingreso', 'Región']} activo={2} onActivarPaso={() => {}} />
        </div>
      </section>
```

- [ ] **Step 6: Captura de verificación visual**

Run: `node web/e2e/capturar.mjs /catalogo 13-pasoapaso`
Expected: PNG generado. Verifica: "Familia" y "Vivienda" (completados) muestran un check en verde, "Ahorro" (activo) muestra el número 3 en azul, "Ingreso" y "Región" (pendientes) en gris, y arriba dice "Paso 3 de 5".

- [ ] **Step 7: Commit**

```bash
git add web/src/components/molecules/PasoAPaso web/src/dev/Catalogo.tsx
git commit -m "feat(web): molecula PasoAPaso"
```

---

### Task 14: Molécula `Pestanas`

Corta una lista larga dentro de una misma pantalla: filtra resultados por estado o cambia entre los planes de varios programas. Nunca para pasos de un proceso — eso es `PasoAPaso`.

**Files:**
- Create: `web/src/components/molecules/Pestanas/Pestanas.tsx`
- Test: `web/src/components/molecules/Pestanas/Pestanas.test.tsx`
- Modify: `web/src/dev/Catalogo.tsx`

**Interfaces:**
- Produces: `PestanaItem { valor: string; etiqueta: string; cuenta?: number }`, `Pestanas(props: { pestanas: PestanaItem[]; value?: string; onChange?: (e: SyntheticEvent, v: string) => void; etiquetaAria?: string }): JSX.Element` desde `web/src/components/molecules/Pestanas/Pestanas.tsx`.

- [ ] **Step 1: Test (falla primero)**

Create `web/src/components/molecules/Pestanas/Pestanas.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Pestanas } from './Pestanas';

const pestanas = [
  { valor: 'califica', etiqueta: 'Calificas', cuenta: 2 },
  { valor: 'falta', etiqueta: 'Te falta', cuenta: 1 },
  { valor: 'no_aplica', etiqueta: 'No aplica' },
];

describe('Pestanas', () => {
  it('sin value, arranca en la primera pestaña', () => {
    render(<Pestanas pestanas={pestanas} />);
    expect(screen.getByRole('tab', { name: /Calificas/ })).toHaveAttribute('aria-selected', 'true');
  });

  it('la cuenta se ve como número, no como punto', () => {
    render(<Pestanas pestanas={pestanas} />);
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('llama a onChange con el value de la pestaña elegida', async () => {
    const onChange = vi.fn();
    render(<Pestanas pestanas={pestanas} value="califica" onChange={onChange} />);
    await userEvent.click(screen.getByRole('tab', { name: /Te falta/ }));
    expect(onChange).toHaveBeenCalledWith(expect.anything(), 'falta');
  });

  it('nunca muestra más de cuatro pestañas', () => {
    const cinco = [...pestanas, { valor: 'x', etiqueta: 'Extra' }, { valor: 'y', etiqueta: 'Otra' }];
    render(<Pestanas pestanas={cinco} />);
    expect(screen.getAllByRole('tab')).toHaveLength(4);
  });
});
```

- [ ] **Step 2: Ejecutar y verificar que falla**

Run: `npm run test -w web`
Expected: FAIL — `./Pestanas` no existe.

- [ ] **Step 3: Implementar**

Create `web/src/components/molecules/Pestanas/Pestanas.tsx`:

```tsx
import { useState, type SyntheticEvent } from 'react';
import { Tabs, Tab, Box, Typography } from '@mui/material';

export interface PestanaItem {
  valor: string;
  etiqueta: string;
  cuenta?: number;
}

export interface PestanasProps {
  /** La primera es la que la persona quiere ver, no "Todos". */
  pestanas: PestanaItem[];
  value?: string;
  onChange?: (e: SyntheticEvent, v: string) => void;
  etiquetaAria?: string;
}

/**
 * Corta una lista larga dentro de una misma pantalla. Sin `value`, se gobierna sola y arranca
 * en la primera pestaña. Siempre desplazable — en 360 px no se reparten cuatro pestañas a lo
 * ancho sin partir palabras.
 */
export function Pestanas({ pestanas, value, onChange, etiquetaAria }: PestanasProps) {
  const [interno, setInterno] = useState(pestanas[0]?.valor ?? '');
  const actual = value ?? interno;
  const pestanasMostradas = pestanas.slice(0, 4);

  const manejarCambio = (e: SyntheticEvent, v: string) => {
    if (value === undefined) setInterno(v);
    onChange?.(e, v);
  };

  return (
    <Tabs
      value={actual}
      onChange={manejarCambio}
      aria-label={etiquetaAria}
      sx={{ '& .MuiTabs-indicator': { backgroundColor: 'var(--brand)', height: 3 } }}
    >
      {pestanasMostradas.map((p) => (
        <Tab
          key={p.valor}
          value={p.valor}
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <span>{p.etiqueta}</span>
              {typeof p.cuenta === 'number' && (
                <Typography
                  component="span"
                  sx={{
                    fontSize: '12px',
                    fontWeight: 700,
                    color: 'var(--ink-on-fill)',
                    backgroundColor: 'var(--ink-muted)',
                    borderRadius: 'var(--radius-pill)',
                    px: 0.75,
                    minWidth: 18,
                    textAlign: 'center',
                  }}
                >
                  {p.cuenta}
                </Typography>
              )}
            </Box>
          }
          sx={{
            fontFamily: 'var(--font-sans)',
            color: p.valor === actual ? 'var(--ink-brand)' : 'var(--ink)',
            fontWeight: p.valor === actual ? 700 : 400,
          }}
        />
      ))}
    </Tabs>
  );
}
```

- [ ] **Step 4: Ejecutar y verificar que pasa**

Run: `npm run test -w web`
Expected: PASS.

- [ ] **Step 5: Agregar al catálogo**

En `web/src/dev/Catalogo.tsx`, agrega `import { Pestanas } from '../components/molecules/Pestanas/Pestanas';` y esta sección:

```tsx
      <section>
        <Typography variant="overline">Pestanas</Typography>
        <div style={{ marginTop: 16 }}>
          <Pestanas
            etiquetaAria="Filtrar resultados"
            pestanas={[
              { valor: 'califica', etiqueta: 'Calificas', cuenta: 2 },
              { valor: 'falta', etiqueta: 'Te falta', cuenta: 1 },
              { valor: 'no_aplica', etiqueta: 'No aplica', cuenta: 1 },
            ]}
          />
        </div>
      </section>
```

- [ ] **Step 6: Captura de verificación visual**

Run: `node web/e2e/capturar.mjs /catalogo 14-pestanas`
Expected: PNG generado. Verifica: "Calificas" (primera pestaña) está activa por defecto, con indicador azul de 3 px debajo y texto en negrita; las cuentas se ven como números en píldoras oscuras, no como puntos.

- [ ] **Step 7: Commit**

```bash
git add web/src/components/molecules/Pestanas web/src/dev/Catalogo.tsx
git commit -m "feat(web): molecula Pestanas"
```

---

### Task 15: Moléculas `BurbujaChat` y `Pensando`

El `porQue` de `BurbujaChat` en `index.d.ts` es solo un booleano (sin manejador); se agrega `onPorQue?: () => void` por la misma razón pragmática que en `Alerta` (Task 11). `Pensando` es un componente aparte del design system, no una prop de `BurbujaChat` — se implementa como tal.

**Files:**
- Create: `web/src/components/molecules/BurbujaChat/BurbujaChat.tsx`
- Create: `web/src/components/molecules/BurbujaChat/Pensando.tsx`
- Test: `web/src/components/molecules/BurbujaChat/BurbujaChat.test.tsx`
- Test: `web/src/components/molecules/BurbujaChat/Pensando.test.tsx`
- Modify: `web/src/dev/Catalogo.tsx`

**Interfaces:**
- Consumes: `Icono` de `../../atoms/Icono/Icono` (Task 5).
- Produces: `BurbujaChat(props: { autor?: 'agente' | 'persona'; children?: ReactNode; escuchable?: boolean; dictado?: boolean; porQue?: boolean; onPorQue?: () => void }): JSX.Element` y `Pensando(props: { children?: ReactNode }): JSX.Element`, ambos en `web/src/components/molecules/BurbujaChat/`.

- [ ] **Step 1: Tests (fallan primero)**

Create `web/src/components/molecules/BurbujaChat/BurbujaChat.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BurbujaChat } from './BurbujaChat';

describe('BurbujaChat', () => {
  it('el turno del agente muestra el botón Escuchar con la palabra visible', () => {
    render(<BurbujaChat autor="agente" escuchable>Cuéntame de tu familia.</BurbujaChat>);
    expect(screen.getByRole('button', { name: 'Escuchar' })).toBeInTheDocument();
  });

  it('el turno de la persona nunca muestra el botón Escuchar', () => {
    render(<BurbujaChat autor="persona" escuchable>Somos 4 personas.</BurbujaChat>);
    expect(screen.queryByRole('button', { name: 'Escuchar' })).not.toBeInTheDocument();
  });

  it('un turno dictado se marca como editable, nunca se guarda en silencio', () => {
    render(<BurbujaChat autor="persona" dictado>Somos 4 personas.</BurbujaChat>);
    expect(screen.getByText('Lo dijiste hablando · toca para corregir')).toBeInTheDocument();
  });

  it('"¿Por qué pregunto esto?" llama a onPorQue', async () => {
    const onPorQue = vi.fn();
    render(<BurbujaChat autor="agente" porQue onPorQue={onPorQue}>¿Tienes ahorro?</BurbujaChat>);
    await userEvent.click(screen.getByRole('button', { name: '¿Por qué pregunto esto?' }));
    expect(onPorQue).toHaveBeenCalledOnce();
  });
});
```

Create `web/src/components/molecules/BurbujaChat/Pensando.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Pensando } from './Pensando';

describe('Pensando', () => {
  it('nunca son solo tres puntitos: dice en qué está el agente', () => {
    render(<Pensando>Revisando el llamado de noviembre del DS1</Pensando>);
    expect(screen.getByText('Revisando el llamado de noviembre del DS1')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Ejecutar y verificar que fallan**

Run: `npm run test -w web`
Expected: FAIL — ninguno de los dos módulos existe.

- [ ] **Step 3: Implementar `BurbujaChat`**

Create `web/src/components/molecules/BurbujaChat/BurbujaChat.tsx`:

```tsx
import type { ReactNode } from 'react';
import { Paper, Stack, IconButton, Typography, Link } from '@mui/material';
import { Icono } from '../../atoms/Icono/Icono';

export interface BurbujaChatProps {
  autor?: 'agente' | 'persona';
  children?: ReactNode;
  /** Muestra el botón «Escuchar». Solo tiene efecto en turnos del agente. */
  escuchable?: boolean;
  /** Marca el turno como dictado y editable. */
  dictado?: boolean;
  /** Añade el enlace «¿Por qué pregunto esto?». */
  porQue?: boolean;
  /** No está en el `index.d.ts` publicado (que solo trae la etiqueta); se agrega porque el
   * enlace necesita un manejador para hacer algo. */
  onPorQue?: () => void;
}

/**
 * El turno de la conversación con el agente. Se distinguen por lado, color y forma, no solo por
 * color. La burbuja no supera `size-measure` de ancho — un párrafo que cruza toda la pantalla
 * se vuelve ilegible.
 */
export function BurbujaChat({ autor = 'agente', children, escuchable, dictado, porQue, onPorQue }: BurbujaChatProps) {
  const esPersona = autor === 'persona';
  return (
    <Stack alignItems={esPersona ? 'flex-end' : 'flex-start'} spacing={0.5} sx={{ maxWidth: 'var(--size-measure)' }}>
      {escuchable && !esPersona && (
        <IconButton
          size="small"
          aria-label="Escuchar"
          sx={{ alignSelf: 'flex-end', color: 'var(--ink-brand)', borderRadius: 'var(--radius-pill)', px: 1, gap: 0.5 }}
        >
          <Icono nombre="parlante" tamano={18} />
          <Typography component="span" sx={{ fontSize: '13px', fontWeight: 600 }}>
            Escuchar
          </Typography>
        </IconButton>
      )}
      <Paper
        variant={esPersona ? 'elevation' : 'outlined'}
        sx={{
          px: 'var(--space-4)',
          py: 'var(--space-3)',
          borderRadius: 'var(--radius-lg)',
          ...(esPersona
            ? { borderBottomRightRadius: 'var(--radius-sm)', backgroundColor: 'var(--surface-accent-soft)' }
            : {
                borderBottomLeftRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--surface-raised)',
                borderColor: 'var(--border)',
              }),
        }}
      >
        <Typography sx={{ fontFamily: 'var(--font-sans)', fontSize: '18px', color: 'var(--ink)' }}>
          {children}
        </Typography>
        {dictado && (
          <Typography
            sx={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--ink-muted)', mt: 0.5, fontStyle: 'italic' }}
          >
            Lo dijiste hablando · toca para corregir
          </Typography>
        )}
      </Paper>
      {porQue && !esPersona && (
        <Link
          component="button"
          onClick={onPorQue}
          sx={{ fontFamily: 'var(--font-sans)', fontSize: '14px', color: 'var(--ink-brand)' }}
        >
          ¿Por qué pregunto esto?
        </Link>
      )}
    </Stack>
  );
}
```

- [ ] **Step 4: Implementar `Pensando`**

Create `web/src/components/molecules/BurbujaChat/Pensando.tsx`:

```tsx
import type { ReactNode } from 'react';
import { Paper, CircularProgress, Typography } from '@mui/material';

export interface PensandoProps {
  children?: ReactNode;
}

/** Estado de espera con texto: nunca tres puntitos solos. Dice en qué está el agente. */
export function Pensando({ children }: PensandoProps) {
  return (
    <Paper
      variant="outlined"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 1,
        px: 'var(--space-4)',
        py: 'var(--space-3)',
        borderRadius: 'var(--radius-lg)',
        borderBottomLeftRadius: 'var(--radius-sm)',
        backgroundColor: 'var(--surface-raised)',
        borderColor: 'var(--border)',
        maxWidth: 'var(--size-measure)',
      }}
    >
      <CircularProgress size={16} sx={{ color: 'var(--ink-muted)' }} />
      <Typography sx={{ fontFamily: 'var(--font-sans)', fontSize: '16px', color: 'var(--ink-muted)' }}>
        {children}
      </Typography>
    </Paper>
  );
}
```

- [ ] **Step 5: Ejecutar y verificar que pasan**

Run: `npm run test -w web`
Expected: PASS.

- [ ] **Step 6: Agregar al catálogo**

En `web/src/dev/Catalogo.tsx`, agrega `import { BurbujaChat } from '../components/molecules/BurbujaChat/BurbujaChat';` y `import { Pensando } from '../components/molecules/BurbujaChat/Pensando';`, y esta sección:

```tsx
      <section>
        <Typography variant="overline">BurbujaChat y Pensando</Typography>
        <Stack spacing={2} sx={{ mt: 2 }}>
          <BurbujaChat autor="agente" escuchable porQue>
            ¿Cuántas personas viven contigo, sin contarte a ti?
          </BurbujaChat>
          <BurbujaChat autor="persona" dictado>
            Vivimos mi pareja, mi hijo y yo.
          </BurbujaChat>
          <Pensando>Revisando el llamado de noviembre del DS1</Pensando>
        </Stack>
      </section>
```

- [ ] **Step 7: Captura de verificación visual**

Run: `node web/e2e/capturar.mjs /catalogo 15-burbujachat`
Expected: PNG generado. Verifica: la burbuja del agente está a la izquierda con borde y esquina inferior izquierda recortada, la de la persona a la derecha en tono terracota suave con la esquina inferior derecha recortada, "Escuchar" solo aparece en la del agente, y "Pensando" muestra un texto real, no solo un spinner.

- [ ] **Step 8: Commit**

```bash
git add web/src/components/molecules/BurbujaChat web/src/dev/Catalogo.tsx
git commit -m "feat(web): moleculas BurbujaChat y Pensando"
```

---

### Task 16: Organismo `Franja` (patrón de marca)

Banda decorativa: medios redondeles apoyados sobre el borde de la pieza, más una huella de discos. Máximo dos tintas. Se implementa como SVG con un `<pattern>` que se repite, no como imagen — así escala a cualquier ancho de contenedor sin pixelarse.

**Files:**
- Create: `web/src/components/organisms/Franja/Franja.tsx`
- Test: `web/src/components/organisms/Franja/Franja.test.tsx`
- Modify: `web/src/dev/Catalogo.tsx`

**Interfaces:**
- Produces: `Franja(props: { alto?: number; tono?: 'brand' | 'accent'; borde?: 'abajo' | 'arriba'; ancho?: number }): JSX.Element` desde `web/src/components/organisms/Franja/Franja.tsx`.

- [ ] **Step 1: Test (falla primero)**

Create `web/src/components/organisms/Franja/Franja.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Franja } from './Franja';

describe('Franja', () => {
  it('usa el alto pedido', () => {
    const { getByTestId } = render(<Franja alto={96} />);
    expect(getByTestId('franja')).toHaveAttribute('height', '96');
  });

  it('en tono brand pinta el fondo surface-brand y agrega la huella de discos', () => {
    const { container } = render(<Franja tono="brand" />);
    const rects = container.querySelectorAll('rect');
    expect(rects[0]).toHaveAttribute('fill', 'var(--surface-brand)');
    expect(container.querySelectorAll('circle')).toHaveLength(4); // 1 arco + 3 discos
  });

  it('en tono accent lleva un máximo de dos tintas: fondo y arco, sin huella', () => {
    const { container } = render(<Franja tono="accent" />);
    expect(container.querySelectorAll('circle')).toHaveLength(1);
  });

  it('con alto 24 sirve como firma de cabecera', () => {
    const { getByTestId } = render(<Franja alto={24} />);
    expect(getByTestId('franja')).toHaveAttribute('height', '24');
  });
});
```

- [ ] **Step 2: Ejecutar y verificar que falla**

Run: `npm run test -w web`
Expected: FAIL — `./Franja` no existe.

- [ ] **Step 3: Implementar**

Create `web/src/components/organisms/Franja/Franja.tsx`:

```tsx
export interface FranjaProps {
  /** Entre 96 y 120 en pantalla; 24 para la firma de cabecera. */
  alto?: number;
  tono?: 'brand' | 'accent';
  /** A qué canto se pega la banda. */
  borde?: 'abajo' | 'arriba';
  ancho?: number;
}

const PASO = 96;
const RADIO_ARCO = 32; // space-6
const DIAMETRO_DISCO = 16; // space-4

/**
 * Banda decorativa de marca: medios redondeles sentados sobre una línea, más una huella de
 * discos. Siempre toca un borde de la pieza; dos tintas como máximo por banda.
 */
export function Franja({ alto = 96, tono = 'brand', borde = 'abajo', ancho }: FranjaProps) {
  const fondo = tono === 'brand' ? 'var(--surface-brand)' : 'var(--surface-accent-soft)';
  const arco = tono === 'brand' ? 'var(--brand)' : 'var(--accent)';
  const huella = tono === 'brand' ? 'var(--surface-base)' : undefined;
  const yBase = borde === 'abajo' ? alto : 0;
  const yDisco = borde === 'abajo' ? alto - DIAMETRO_DISCO / 2 : DIAMETRO_DISCO / 2;
  const idPatron = `franja-${tono}-${alto}-${borde}`;

  return (
    <svg
      data-testid="franja"
      role="presentation"
      aria-hidden="true"
      width={ancho ?? '100%'}
      height={alto}
      viewBox={`0 0 ${PASO} ${alto}`}
      preserveAspectRatio="none"
      style={{ display: 'block', width: ancho ?? '100%', height: alto }}
    >
      <defs>
        <pattern id={idPatron} width={PASO} height={alto} patternUnits="userSpaceOnUse">
          <rect width={PASO} height={alto} fill={fondo} />
          <circle cx={PASO / 2} cy={yBase} r={RADIO_ARCO} fill={arco} />
          {huella &&
            [0.15, 0.5, 0.85].map((f) => (
              <circle key={f} cx={PASO * f} cy={yDisco} r={DIAMETRO_DISCO / 2} fill={huella} />
            ))}
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${idPatron})`} />
    </svg>
  );
}
```

- [ ] **Step 4: Ejecutar y verificar que pasa**

Run: `npm run test -w web`
Expected: PASS.

- [ ] **Step 5: Agregar al catálogo**

En `web/src/dev/Catalogo.tsx`, agrega `import { Franja } from '../components/organisms/Franja/Franja';` y esta sección:

```tsx
      <section>
        <Typography variant="overline">Franja</Typography>
        <Stack spacing={2} sx={{ mt: 2 }}>
          <Franja tono="brand" alto={96} />
          <Franja tono="accent" alto={96} />
          <Franja tono="brand" alto={24} />
        </Stack>
      </section>
```

- [ ] **Step 6: Captura de verificación visual**

Run: `node web/e2e/capturar.mjs /catalogo 16-franja`
Expected: PNG generado. Verifica: la banda azul tiene un medio redondel claro en el centro y puntos crema repartidos; la banda terracota suave solo tiene el arco, sin puntos; la banda de 24 px se ve como una firma fina, no como un bloque grande.

- [ ] **Step 7: Commit**

```bash
git add web/src/components/organisms/Franja web/src/dev/Catalogo.tsx
git commit -m "feat(web): organismo Franja (patron de marca)"
```

---

### Task 17: Organismo `Logotipo`

El nombre se compone en vivo, nunca como archivo con el texto en curvas. Nota: `Logotipo` tipa su prop de tono como `'color' | 'claro' | 'monocromo'` (palabra completa), mientras que `Simbolo` (Task 3) la tipa como `'color' | 'claro' | 'mono'` (abreviada) — son dos componentes del mismo design system con esa pequeña inconsistencia entre sí; `Logotipo` traduce internamente su propio tono al de `Simbolo` al usarlo.

**Files:**
- Create: `web/src/components/organisms/Logotipo/Logotipo.tsx`
- Test: `web/src/components/organisms/Logotipo/Logotipo.test.tsx`
- Modify: `web/src/dev/Catalogo.tsx`

**Interfaces:**
- Consumes: `Simbolo` de `../../atoms/Simbolo/Simbolo` (Task 3).
- Produces: `Logotipo(props: { disposicion?: 'horizontal' | 'vertical' | 'simbolo'; alto?: number; tono?: 'color' | 'claro' | 'monocromo' }): JSX.Element` desde `web/src/components/organisms/Logotipo/Logotipo.tsx`.

- [ ] **Step 1: Test (falla primero)**

Create `web/src/components/organisms/Logotipo/Logotipo.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Logotipo } from './Logotipo';

describe('Logotipo', () => {
  it('en disposición simbolo, no muestra el nombre', () => {
    render(<Logotipo disposicion="simbolo" />);
    expect(screen.getByRole('img', { name: 'Rumbo a Casa' })).toBeInTheDocument();
    expect(screen.queryByText('Rumbo a Casa')).not.toBeInTheDocument();
  });

  it('en horizontal, el nombre va junto al símbolo en una sola línea', () => {
    render(<Logotipo disposicion="horizontal" />);
    expect(screen.getByText('Rumbo a Casa')).toBeInTheDocument();
    expect(screen.getByRole('img')).toBeInTheDocument();
  });

  it('en vertical, el nombre va en dos líneas bajo el símbolo', () => {
    const { container } = render(<Logotipo disposicion="vertical" />);
    expect(container.querySelector('br')).toBeInTheDocument();
  });

  it('en tono claro, usa la versión del símbolo para fondo oscuro', () => {
    render(<Logotipo tono="claro" />);
    expect(screen.getByRole('img')).toHaveAttribute('src', '/marca/rumbo-simbolo-oscuro.svg');
  });

  it('en tono monocromo, usa la versión de una tinta del símbolo', () => {
    render(<Logotipo tono="monocromo" />);
    expect(screen.getByRole('img')).toHaveAttribute('src', '/marca/rumbo-simbolo-monocromo.svg');
  });
});
```

- [ ] **Step 2: Ejecutar y verificar que falla**

Run: `npm run test -w web`
Expected: FAIL — `./Logotipo` no existe.

- [ ] **Step 3: Implementar**

Create `web/src/components/organisms/Logotipo/Logotipo.tsx`:

```tsx
import { Stack, Typography } from '@mui/material';
import { Simbolo } from '../../atoms/Simbolo/Simbolo';

export interface LogotipoProps {
  disposicion?: 'horizontal' | 'vertical' | 'simbolo';
  alto?: number;
  tono?: 'color' | 'claro' | 'monocromo';
}

const TONO_SIMBOLO = { color: 'color', claro: 'claro', monocromo: 'mono' } as const;

/**
 * El símbolo y el nombre, en las tres disposiciones que el proyecto necesita. El nombre se
 * compone en vivo en la familia `display`, peso 700, interletrado -0,02em — nunca un archivo
 * con el texto convertido a curvas, para que el nombre de marca y el que muestra la app no se
 * puedan separar.
 */
export function Logotipo({ disposicion = 'horizontal', alto = 40, tono = 'color' }: LogotipoProps) {
  const colorTexto =
    tono === 'claro' ? 'var(--ink-on-brand)' : tono === 'monocromo' ? 'var(--ink)' : 'var(--ink-strong)';

  if (disposicion === 'simbolo') return <Simbolo tamano={alto} tono={TONO_SIMBOLO[tono]} />;

  const nombre = (
    <Typography
      sx={{
        fontFamily: 'var(--font-display)',
        fontWeight: 700,
        letterSpacing: '-0.02em',
        color: colorTexto,
        fontSize: alto * 0.5,
        lineHeight: 1.1,
        textAlign: disposicion === 'vertical' ? 'center' : 'left',
      }}
    >
      {disposicion === 'vertical' ? (
        <>
          Rumbo a
          <br />
          Casa
        </>
      ) : (
        'Rumbo a Casa'
      )}
    </Typography>
  );

  return (
    <Stack
      direction={disposicion === 'vertical' ? 'column' : 'row'}
      alignItems="center"
      spacing={`${alto * 0.22}px`}
    >
      <Simbolo tamano={alto} tono={TONO_SIMBOLO[tono]} />
      {nombre}
    </Stack>
  );
}
```

- [ ] **Step 4: Ejecutar y verificar que pasa**

Run: `npm run test -w web`
Expected: PASS.

- [ ] **Step 5: Agregar al catálogo**

En `web/src/dev/Catalogo.tsx`, agrega `import { Logotipo } from '../components/organisms/Logotipo/Logotipo';` y esta sección:

```tsx
      <section>
        <Typography variant="overline">Logotipo</Typography>
        <Stack spacing={3} sx={{ mt: 2 }}>
          <Logotipo disposicion="horizontal" alto={40} />
          <div style={{ background: '#123a6b', padding: 16, borderRadius: 12, display: 'inline-block' }}>
            <Logotipo disposicion="horizontal" alto={32} tono="claro" />
          </div>
          <Logotipo disposicion="vertical" alto={48} />
        </Stack>
      </section>
```

- [ ] **Step 6: Captura de verificación visual**

Run: `node web/e2e/capturar.mjs /catalogo 17-logotipo`
Expected: PNG generado. Verifica: el nombre está en la tipografía con carácter (Bricolage Grotesque, no una sans genérica), la versión horizontal alinea símbolo y nombre en una línea, la vertical centra "Rumbo a" / "Casa" bajo el símbolo, y la versión sobre fondo azul usa el símbolo claro (peldaños celestes, puerta durazno).

- [ ] **Step 7: Commit**

```bash
git add web/src/components/organisms/Logotipo web/src/dev/Catalogo.tsx
git commit -m "feat(web): organismo Logotipo"
```

---

### Task 18: Organismo `CabeceraApp`

`index.d.ts` tipa `accion` como un simple `boolean`, sin decir qué ícono ni qué maneja — se agregan `accionIcono`/`onAccion` opcionales porque una acción sin ícono ni manejador no se puede renderizar; ninguna pantalla de este plan termina usándola (ver Tasks 27-31), así que queda lista pero sin uso real todavía.

**Files:**
- Create: `web/src/components/organisms/CabeceraApp/CabeceraApp.tsx`
- Test: `web/src/components/organisms/CabeceraApp/CabeceraApp.test.tsx`
- Modify: `web/src/dev/Catalogo.tsx`

**Interfaces:**
- Consumes: `Icono`, `NombreIcono` de `../../atoms/Icono/Icono` (Task 5); `Simbolo` de `../../atoms/Simbolo/Simbolo` (Task 3); `Franja` de `../Franja/Franja` (Task 16).
- Produces: `CabeceraApp(props: { titulo: string; atras?: boolean; onAtras?: () => void; accion?: boolean; accionIcono?: NombreIcono; onAccion?: () => void; conFranja?: boolean }): JSX.Element` desde `web/src/components/organisms/CabeceraApp/CabeceraApp.tsx`.

- [ ] **Step 1: Test (falla primero)**

Create `web/src/components/organisms/CabeceraApp/CabeceraApp.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CabeceraApp } from './CabeceraApp';

describe('CabeceraApp', () => {
  it('muestra el título y el símbolo, nunca el logotipo completo', () => {
    render(<CabeceraApp titulo="Tu entrevista" />);
    expect(screen.getByText('Tu entrevista')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Rumbo a Casa' })).toBeInTheDocument();
  });

  it('el botón de volver llama a onAtras', async () => {
    const onAtras = vi.fn();
    render(<CabeceraApp titulo="Tu plan" atras onAtras={onAtras} />);
    await userEvent.click(screen.getByRole('button', { name: 'Volver' }));
    expect(onAtras).toHaveBeenCalledOnce();
  });

  it('sin atras, no muestra el botón de volver', () => {
    render(<CabeceraApp titulo="Rumbo a Casa" />);
    expect(screen.queryByRole('button', { name: 'Volver' })).not.toBeInTheDocument();
  });

  it('con conFranja, agrega la firma de marca bajo la cabecera', () => {
    render(<CabeceraApp titulo="Tu plan" conFranja />);
    expect(screen.getByTestId('franja')).toHaveAttribute('height', '24');
  });
});
```

- [ ] **Step 2: Ejecutar y verificar que falla**

Run: `npm run test -w web`
Expected: FAIL — `./CabeceraApp` no existe.

- [ ] **Step 3: Implementar**

Create `web/src/components/organisms/CabeceraApp/CabeceraApp.tsx`:

```tsx
import { AppBar, Toolbar, IconButton, Typography } from '@mui/material';
import { Icono, type NombreIcono } from '../../atoms/Icono/Icono';
import { Simbolo } from '../../atoms/Simbolo/Simbolo';
import { Franja } from '../Franja/Franja';

export interface CabeceraAppProps {
  titulo: string;
  atras?: boolean;
  onAtras?: () => void;
  accion?: boolean;
  accionIcono?: NombreIcono;
  onAccion?: () => void;
  conFranja?: boolean;
}

/**
 * La cabecera fija de la app. Es el único lugar de la interfaz donde el azul profundo ocupa una
 * superficie grande. Solo lleva el símbolo en tintas oscuras, nunca el logotipo completo — el
 * nombre ya está en el título. No se oculta al desplazar.
 */
export function CabeceraApp({
  titulo,
  atras,
  onAtras,
  accion,
  accionIcono,
  onAccion,
  conFranja,
}: CabeceraAppProps) {
  return (
    <AppBar position="sticky" elevation={0} sx={{ backgroundColor: 'var(--surface-brand)', top: 0 }}>
      <Toolbar sx={{ gap: 1, minHeight: 'var(--size-touch)' }}>
        {atras && (
          <IconButton aria-label="Volver" onClick={onAtras} sx={{ color: 'var(--ink-on-brand)' }}>
            <Icono nombre="atras" />
          </IconButton>
        )}
        <Simbolo tamano={28} tono="claro" />
        <Typography
          noWrap
          sx={{
            fontFamily: 'var(--font-sans)',
            fontWeight: 600,
            fontSize: '20px',
            color: 'var(--ink-on-brand)',
            flex: 1,
          }}
        >
          {titulo}
        </Typography>
        {accion && accionIcono && (
          <IconButton aria-label="Acción" onClick={onAccion} sx={{ color: 'var(--ink-on-brand)' }}>
            <Icono nombre={accionIcono} />
          </IconButton>
        )}
      </Toolbar>
      {conFranja && <Franja alto={24} tono="brand" borde="abajo" />}
    </AppBar>
  );
}
```

- [ ] **Step 4: Ejecutar y verificar que pasa**

Run: `npm run test -w web`
Expected: PASS.

- [ ] **Step 5: Agregar al catálogo**

En `web/src/dev/Catalogo.tsx`, agrega `import { CabeceraApp } from '../components/organisms/CabeceraApp/CabeceraApp';` y esta sección (fuera del `<Stack>` con padding, para verla a ancho completo):

```tsx
      <section>
        <Typography variant="overline">CabeceraApp</Typography>
        <div style={{ margin: '16px -20px 0', maxWidth: 360 }}>
          <CabeceraApp titulo="Tu plan para DS49" atras conFranja />
        </div>
      </section>
```

- [ ] **Step 6: Captura de verificación visual**

Run: `node web/e2e/capturar.mjs /catalogo 18-cabeceraapp`
Expected: PNG generado. Verifica: fondo azul profundo de borde a borde, solo el símbolo (no el nombre completo) a la izquierda del título, botón de volver en blanco, y la firma de patrón de 24 px pegada al borde inferior de la barra.

- [ ] **Step 7: Commit**

```bash
git add web/src/components/organisms/CabeceraApp web/src/dev/Catalogo.tsx
git commit -m "feat(web): organismo CabeceraApp"
```

---

### Task 19: Organismo `BarraInferior`

Cuatro destinos fijos, cada uno una etapa real del trámite: Hablar (la entrevista), Mi plan (resultado + plan de un programa), Documentos (checklist agregado) y Avisos (seguimiento y plazos) — el mapeo exacto a pantallas se cablea en Task 26.

**Files:**
- Create: `web/src/components/organisms/BarraInferior/BarraInferior.tsx`
- Test: `web/src/components/organisms/BarraInferior/BarraInferior.test.tsx`
- Modify: `web/src/dev/Catalogo.tsx`

**Interfaces:**
- Consumes: `Icono` de `../../atoms/Icono/Icono` (Task 5).
- Produces: `DestinoBarraInferior = 'hablar' | 'plan' | 'documentos' | 'avisos'`, `BarraInferior(props: { value?: DestinoBarraInferior; avisos?: number; onChange?: (e: SyntheticEvent, v: string) => void }): JSX.Element` desde `web/src/components/organisms/BarraInferior/BarraInferior.tsx`.

- [ ] **Step 1: Test (falla primero)**

Create `web/src/components/organisms/BarraInferior/BarraInferior.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BarraInferior } from './BarraInferior';

describe('BarraInferior', () => {
  it('tiene los cuatro destinos fijos, siempre con su etiqueta visible', () => {
    render(<BarraInferior value="hablar" />);
    expect(screen.getByRole('button', { name: /Hablar/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Mi plan/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Documentos/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Avisos/ })).toBeInTheDocument();
  });

  it('muestra el número de avisos, no solo un punto', () => {
    render(<BarraInferior value="hablar" avisos={2} />);
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('llama a onChange con el destino elegido', async () => {
    const onChange = vi.fn();
    render(<BarraInferior value="hablar" onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: /Mi plan/ }));
    expect(onChange).toHaveBeenCalled();
    expect(onChange.mock.calls[0][1]).toBe('plan');
  });
});
```

- [ ] **Step 2: Ejecutar y verificar que falla**

Run: `npm run test -w web`
Expected: FAIL — `./BarraInferior` no existe.

- [ ] **Step 3: Implementar**

Create `web/src/components/organisms/BarraInferior/BarraInferior.tsx`:

```tsx
import type { SyntheticEvent } from 'react';
import { BottomNavigation, BottomNavigationAction, Badge } from '@mui/material';
import { Icono } from '../../atoms/Icono/Icono';

export type DestinoBarraInferior = 'hablar' | 'plan' | 'documentos' | 'avisos';

export interface BarraInferiorProps {
  value?: DestinoBarraInferior;
  avisos?: number;
  onChange?: (e: SyntheticEvent, v: string) => void;
}

/**
 * Navegación principal en celular, fija al borde inferior. Cuatro destinos y no crece — cada
 * uno corresponde a una etapa real del trámite, no a una sección del producto.
 */
export function BarraInferior({ value, avisos = 0, onChange }: BarraInferiorProps) {
  return (
    <BottomNavigation
      value={value}
      onChange={onChange}
      showLabels
      sx={{
        position: 'sticky',
        bottom: 0,
        boxShadow: 'var(--shadow-md)',
        backgroundColor: 'var(--surface-raised)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        '& .Mui-selected': { color: 'var(--brand)', fontWeight: 700 },
      }}
    >
      <BottomNavigationAction label="Hablar" value="hablar" icon={<Icono nombre="chat" />} />
      <BottomNavigationAction label="Mi plan" value="plan" icon={<Icono nombre="casa" />} />
      <BottomNavigationAction label="Documentos" value="documentos" icon={<Icono nombre="papel" />} />
      <BottomNavigationAction
        label="Avisos"
        value="avisos"
        icon={
          <Badge
            badgeContent={avisos}
            max={9}
            sx={{ '& .MuiBadge-badge': { backgroundColor: 'var(--warning)', color: 'var(--ink-on-fill)' } }}
          >
            <Icono nombre="campana" />
          </Badge>
        }
      />
    </BottomNavigation>
  );
}
```

- [ ] **Step 4: Ejecutar y verificar que pasa**

Run: `npm run test -w web`
Expected: PASS.

- [ ] **Step 5: Agregar al catálogo**

En `web/src/dev/Catalogo.tsx`, agrega `import { BarraInferior } from '../components/organisms/BarraInferior/BarraInferior';` y esta sección:

```tsx
      <section>
        <Typography variant="overline">BarraInferior</Typography>
        <div style={{ margin: '16px -20px 0', maxWidth: 360 }}>
          <BarraInferior value="plan" avisos={2} onChange={() => {}} />
        </div>
      </section>
```

- [ ] **Step 6: Captura de verificación visual**

Run: `node web/e2e/capturar.mjs /catalogo 19-barrainferior`
Expected: PNG generado. Verifica: los cuatro destinos con su etiqueta siempre visible, "Mi plan" (activo) en azul y negrita, y "Avisos" con una insignia numérica (no un punto vacío) con el número 2.

- [ ] **Step 7: Commit**

```bash
git add web/src/components/organisms/BarraInferior web/src/dev/Catalogo.tsx
git commit -m "feat(web): organismo BarraInferior"
```

---

### Task 20: Organismo `BloqueHero`

Cabecera de pantalla con los bloques de color de la portada. La usan `PantallaBienvenida` (Task 27) y `PantallaResultado` (Task 29).

**Files:**
- Create: `web/src/components/organisms/BloqueHero/BloqueHero.tsx`
- Test: `web/src/components/organisms/BloqueHero/BloqueHero.test.tsx`
- Modify: `web/src/dev/Catalogo.tsx`

**Interfaces:**
- Consumes: `Franja` de `../Franja/Franja` (Task 16).
- Produces: `BloqueHero(props: { titulo: string; bajada?: string; chips?: string[] }): JSX.Element` desde `web/src/components/organisms/BloqueHero/BloqueHero.tsx`.

- [ ] **Step 1: Test (falla primero)**

Create `web/src/components/organisms/BloqueHero/BloqueHero.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BloqueHero } from './BloqueHero';

describe('BloqueHero', () => {
  it('muestra el título y la bajada', () => {
    render(<BloqueHero titulo="Calificas para dos programas" bajada="Revisa el detalle de cada uno." />);
    expect(screen.getByText('Calificas para dos programas')).toBeInTheDocument();
    expect(screen.getByText('Revisa el detalle de cada uno.')).toBeInTheDocument();
  });

  it('muestra los chips de programas', () => {
    render(<BloqueHero titulo="Averigua a qué subsidio puedes postular" chips={['DS49', 'DS1', 'DS19', 'DS52']} />);
    expect(screen.getByText('DS49')).toBeInTheDocument();
    expect(screen.getByText('DS52')).toBeInTheDocument();
  });

  it('lleva la franja de marca al pie', () => {
    render(<BloqueHero titulo="Rumbo a Casa" />);
    expect(screen.getByTestId('franja')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Ejecutar y verificar que falla**

Run: `npm run test -w web`
Expected: FAIL — `./BloqueHero` no existe.

- [ ] **Step 3: Implementar**

Create `web/src/components/organisms/BloqueHero/BloqueHero.tsx`:

```tsx
import { Box, Typography, Stack, Chip } from '@mui/material';
import { Franja } from '../Franja/Franja';

export interface BloqueHeroProps {
  titulo: string;
  bajada?: string;
  chips?: string[];
}

/**
 * Cabecera de pantalla con los bloques de color de la portada: fondo `surface-brand`, franja de
 * marca al pie, título y bajada en `ink-on-brand`.
 */
export function BloqueHero({ titulo, bajada, chips }: BloqueHeroProps) {
  return (
    <Box sx={{ backgroundColor: 'var(--surface-brand)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
      <Stack spacing={2} sx={{ p: 'var(--space-6)' }}>
        <Typography
          sx={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: '30px',
            lineHeight: '36px',
            letterSpacing: '-0.015em',
            color: 'var(--ink-on-brand)',
          }}
        >
          {titulo}
        </Typography>
        {bajada && (
          <Typography
            sx={{
              fontFamily: 'var(--font-sans)',
              fontSize: '18px',
              color: 'var(--ink-on-brand)',
              maxWidth: 'var(--size-measure)',
            }}
          >
            {bajada}
          </Typography>
        )}
        {chips && chips.length > 0 && (
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
            {chips.map((c) => (
              <Chip
                key={c}
                label={c}
                sx={{ backgroundColor: 'var(--surface-brand-soft)', color: 'var(--ink-brand)', fontWeight: 600 }}
              />
            ))}
          </Stack>
        )}
      </Stack>
      <Franja tono="brand" alto={96} borde="abajo" />
    </Box>
  );
}
```

- [ ] **Step 4: Ejecutar y verificar que pasa**

Run: `npm run test -w web`
Expected: PASS.

- [ ] **Step 5: Agregar al catálogo**

En `web/src/dev/Catalogo.tsx`, agrega `import { BloqueHero } from '../components/organisms/BloqueHero/BloqueHero';` y esta sección:

```tsx
      <section>
        <Typography variant="overline">BloqueHero</Typography>
        <div style={{ marginTop: 16 }}>
          <BloqueHero
            titulo="Averigua a qué subsidio de vivienda puedes postular"
            bajada="Cuéntanos de tu familia en unos 5 minutos."
            chips={['DS49', 'DS1', 'DS19', 'DS52']}
          />
        </div>
      </section>
```

- [ ] **Step 6: Captura de verificación visual**

Run: `node web/e2e/capturar.mjs /catalogo 20-bloquehero`
Expected: PNG generado. Verifica: bloque azul con esquinas redondeadas, título grande en Bricolage Grotesque, los 4 chips de programa en celeste sobre el azul, y la franja decorativa cerrando el bloque por abajo.

- [ ] **Step 7: Commit**

```bash
git add web/src/components/organisms/BloqueHero web/src/dev/Catalogo.tsx
git commit -m "feat(web): organismo BloqueHero"
```

---

### Task 21: Organismo `TarjetaPrograma`

La unidad de la pantalla de resultados. Como en `Alerta` y `BurbujaChat`, `accion` en `index.d.ts` es solo una etiqueta sin manejador — se agrega `onAccion?: () => void`.

**Files:**
- Create: `web/src/components/organisms/TarjetaPrograma/TarjetaPrograma.tsx`
- Test: `web/src/components/organisms/TarjetaPrograma/TarjetaPrograma.test.tsx`
- Modify: `web/src/dev/Catalogo.tsx`

**Interfaces:**
- Consumes: `SelloElegibilidad`, `EstadoElegibilidad` de `../../molecules/SelloElegibilidad/SelloElegibilidad` (Task 9); `Boton` de `../../atoms/Boton/Boton` (Task 6).
- Produces: `TarjetaPrograma(props: { sigla: string; nombreComun: string; estado: EstadoElegibilidad; razon: string; regla?: string; llamado?: string; serviu?: string; accion?: string; onAccion?: () => void; variante?: 'contained' | 'outlined' }): JSX.Element` desde `web/src/components/organisms/TarjetaPrograma/TarjetaPrograma.tsx`.

- [ ] **Step 1: Test (falla primero)**

Create `web/src/components/organisms/TarjetaPrograma/TarjetaPrograma.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TarjetaPrograma } from './TarjetaPrograma';

describe('TarjetaPrograma', () => {
  it('el título junta la sigla y el nombre común', () => {
    render(
      <TarjetaPrograma
        sigla="DS49"
        nombreComun="Casa propia sin crédito"
        estado="califica"
        razon="Cumples los requisitos."
      />,
    );
    expect(screen.getByText('DS49 — Casa propia sin crédito')).toBeInTheDocument();
  });

  it('muestra la razón y la regla citada', () => {
    render(
      <TarjetaPrograma
        sigla="DS49"
        nombreComun="Casa propia sin crédito"
        estado="califica"
        razon="Cumples los requisitos de DS49."
        regla="D.S. N°49 (V. y U.) de 2011"
      />,
    );
    expect(screen.getByText('Cumples los requisitos de DS49.')).toBeInTheDocument();
    expect(screen.getByText('Fuente: D.S. N°49 (V. y U.) de 2011')).toBeInTheDocument();
  });

  it('la acción llama a onAccion', async () => {
    const onAccion = vi.fn();
    render(
      <TarjetaPrograma
        sigla="DS49"
        nombreComun="Casa propia sin crédito"
        estado="califica"
        razon="Cumples."
        accion="Ver los documentos"
        onAccion={onAccion}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Ver los documentos' }));
    expect(onAccion).toHaveBeenCalledOnce();
  });

  it('sin accion, no muestra ningún botón', () => {
    render(<TarjetaPrograma sigla="DS52" nombreComun="Arriendo" estado="noAplica" razon="Ya tienes vivienda propia." />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Ejecutar y verificar que falla**

Run: `npm run test -w web`
Expected: FAIL — `./TarjetaPrograma` no existe.

- [ ] **Step 3: Implementar**

Create `web/src/components/organisms/TarjetaPrograma/TarjetaPrograma.tsx`:

```tsx
import { Card, CardContent, CardActions, Stack, Typography } from '@mui/material';
import { SelloElegibilidad, type EstadoElegibilidad } from '../../molecules/SelloElegibilidad/SelloElegibilidad';
import { Boton } from '../../atoms/Boton/Boton';

export interface TarjetaProgramaProps {
  sigla: string;
  nombreComun: string;
  estado: EstadoElegibilidad;
  razon: string;
  regla?: string;
  llamado?: string;
  serviu?: string;
  accion?: string;
  onAccion?: () => void;
  variante?: 'contained' | 'outlined';
}

/**
 * Un programa del MINVU con el resultado de la persona. Cuatro cosas en el mismo orden: qué es
 * el programa, cómo le fue, por qué, y qué sigue. El sello va arriba a la derecha, visible sin
 * desplazar.
 */
export function TarjetaPrograma({
  sigla,
  nombreComun,
  estado,
  razon,
  regla,
  llamado,
  serviu,
  accion,
  onAccion,
  variante = 'contained',
}: TarjetaProgramaProps) {
  return (
    <Card variant="outlined" sx={{ borderColor: 'var(--border)' }}>
      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
          <Typography
            sx={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '20px', color: 'var(--ink-strong)' }}
          >
            {sigla} — {nombreComun}
          </Typography>
          <SelloElegibilidad estado={estado} compacto />
        </Stack>
        <Typography sx={{ fontFamily: 'var(--font-sans)', fontSize: '16px', color: 'var(--ink)' }}>{razon}</Typography>
        {regla && (
          <Typography
            sx={{
              fontFamily: 'var(--font-sans)',
              fontSize: '14px',
              color: 'var(--ink-muted)',
              borderLeft: '2px solid var(--border)',
              pl: 1,
            }}
          >
            Fuente: {regla}
          </Typography>
        )}
        {(llamado || serviu) && (
          <Typography sx={{ fontFamily: 'var(--font-mono)', fontSize: '15px', color: 'var(--ink-muted)' }}>
            {[llamado, serviu].filter(Boolean).join(' · ')}
          </Typography>
        )}
      </CardContent>
      {accion && (
        <CardActions sx={{ px: 2, pb: 2 }}>
          <Boton variant={variante} onClick={onAccion} fullWidth>
            {accion}
          </Boton>
        </CardActions>
      )}
    </Card>
  );
}
```

- [ ] **Step 4: Ejecutar y verificar que pasa**

Run: `npm run test -w web`
Expected: PASS.

- [ ] **Step 5: Agregar al catálogo**

En `web/src/dev/Catalogo.tsx`, agrega `import { TarjetaPrograma } from '../components/organisms/TarjetaPrograma/TarjetaPrograma';` y esta sección:

```tsx
      <section>
        <Typography variant="overline">TarjetaPrograma</Typography>
        <Stack spacing={2} sx={{ mt: 2 }}>
          <TarjetaPrograma
            sigla="DS49"
            nombreComun="Casa propia sin crédito"
            estado="califica"
            razon="Cumples los requisitos de DS49: RSH ≤40%, ahorro ≥10 UF, no propietario."
            regla="D.S. N°49 (V. y U.) de 2011"
            accion="Ver los documentos"
            onAccion={() => {}}
          />
          <TarjetaPrograma
            sigla="DS1"
            nombreComun="Sectores medios"
            estado="falta"
            razon="Falta saber tu ahorro acreditado."
            regla="D.S. N°1 de 2011, Res. Ex. N°669/2026"
            accion="Ver cómo alcanzarlo"
            onAccion={() => {}}
          />
        </Stack>
      </section>
```

- [ ] **Step 6: Captura de verificación visual**

Run: `node web/e2e/capturar.mjs /catalogo 21-tarjetaprograma`
Expected: PNG generado. Verifica: el sello queda arriba a la derecha en la misma línea del título, la fuente aparece con una barra vertical a la izquierda por debajo de la razón, y el botón de acción ocupa el ancho completo de la tarjeta.

- [ ] **Step 7: Commit**

```bash
git add web/src/components/organisms/TarjetaPrograma web/src/dev/Catalogo.tsx
git commit -m "feat(web): organismo TarjetaPrograma"
```

---

### Task 22: Organismo `ChecklistDocumentos`

`index.d.ts` nombra los campos del ítem más simple que la prosa del README: `nombre` (no `nombreComun`), `oficial` (no `nombreOficial`), `donde`, `vence` (no `venceEl`), `listo` (no `estado`) — se sigue el tipo publicado. No incluye `onToggle`; se agrega igual que en tasks anteriores, porque una casilla sin manejador no sirve de nada.

**Files:**
- Create: `web/src/components/organisms/ChecklistDocumentos/ChecklistDocumentos.tsx`
- Test: `web/src/components/organisms/ChecklistDocumentos/ChecklistDocumentos.test.tsx`
- Modify: `web/src/dev/Catalogo.tsx`

**Interfaces:**
- Consumes: `Icono` de `../../atoms/Icono/Icono` (Task 5).
- Produces: `DocumentoChecklist { nombre: string; oficial?: string; donde?: string; vence?: string; listo?: boolean }`, `ChecklistDocumentos(props: { programa?: string; items: DocumentoChecklist[]; onToggle?: (indice: number) => void }): JSX.Element` desde `web/src/components/organisms/ChecklistDocumentos/ChecklistDocumentos.tsx`.

- [ ] **Step 1: Test (falla primero)**

Create `web/src/components/organisms/ChecklistDocumentos/ChecklistDocumentos.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChecklistDocumentos } from './ChecklistDocumentos';

const items = [
  { nombre: 'Tu cédula', oficial: 'Cédula de identidad vigente', listo: true },
  { nombre: 'Cartola Hogar', donde: 'En línea, gratis, en registrosocial.gob.cl', listo: false },
  { nombre: 'Certificado de ahorro', vence: '30 sep 2026', listo: false },
];

describe('ChecklistDocumentos', () => {
  it('muestra el progreso en texto, no solo en barra', () => {
    render(<ChecklistDocumentos items={items} />);
    expect(screen.getByText('1 de 3 listos')).toBeInTheDocument();
  });

  it('el nombre común va primero y el oficial abajo en letra chica', () => {
    render(<ChecklistDocumentos items={items} />);
    expect(screen.getByText('Tu cédula')).toBeInTheDocument();
    expect(screen.getByText('Cédula de identidad vigente')).toBeInTheDocument();
  });

  it('un documento pendiente con vencimiento muestra la fecha completa', () => {
    render(<ChecklistDocumentos items={items} />);
    expect(screen.getByText('Vence: 30 sep 2026')).toBeInTheDocument();
  });

  it('marcar la casilla llama a onToggle con el índice', async () => {
    const onToggle = vi.fn();
    render(<ChecklistDocumentos items={items} onToggle={onToggle} />);
    await userEvent.click(screen.getByRole('checkbox', { name: /Cartola Hogar/ }));
    expect(onToggle).toHaveBeenCalledWith(1);
  });

  it('dice que la app no guarda los documentos', () => {
    render(<ChecklistDocumentos items={items} />);
    expect(screen.getByText(/La app no guarda tus documentos/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Ejecutar y verificar que falla**

Run: `npm run test -w web`
Expected: FAIL — `./ChecklistDocumentos` no existe.

- [ ] **Step 3: Implementar**

Create `web/src/components/organisms/ChecklistDocumentos/ChecklistDocumentos.tsx`:

```tsx
import { List, ListItem, ListItemIcon, ListItemText, Checkbox, Typography, LinearProgress, Stack } from '@mui/material';
import { Icono } from '../../atoms/Icono/Icono';

export interface DocumentoChecklist {
  nombre: string;
  oficial?: string;
  donde?: string;
  vence?: string;
  listo?: boolean;
}

export interface ChecklistDocumentosProps {
  programa?: string;
  items: DocumentoChecklist[];
  onToggle?: (indice: number) => void;
}

/**
 * La lista de papeles que la persona debe juntar. Cada fila responde tres cosas: qué papel es,
 * dónde se consigue y si ya lo tiene. La app no guarda los documentos — la casilla es un
 * recordatorio de la persona.
 */
export function ChecklistDocumentos({ programa, items, onToggle }: ChecklistDocumentosProps) {
  const listos = items.filter((i) => i.listo).length;
  return (
    <Stack spacing={1.5}>
      {programa && (
        <Typography
          sx={{
            fontFamily: 'var(--font-sans)',
            fontSize: '13px',
            fontWeight: 600,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            color: 'var(--ink-muted)',
          }}
        >
          {programa}
        </Typography>
      )}
      <Stack direction="row" alignItems="center" spacing={1.5}>
        <Typography sx={{ fontFamily: 'var(--font-mono)', fontSize: '15px', color: 'var(--ink-muted)', whiteSpace: 'nowrap' }}>
          {listos} de {items.length} listos
        </Typography>
        <LinearProgress
          variant="determinate"
          value={items.length ? (listos / items.length) * 100 : 0}
          sx={{
            flex: 1,
            height: 8,
            borderRadius: 'var(--radius-pill)',
            backgroundColor: 'var(--surface-sunken)',
            '& .MuiLinearProgress-bar': { backgroundColor: 'var(--accent)' },
          }}
        />
      </Stack>
      <List sx={{ backgroundColor: 'var(--surface-sunken)', borderRadius: 'var(--radius-md)', p: 0.5 }}>
        {items.map((item, indice) => {
          const vencePronto = !item.listo && Boolean(item.vence);
          return (
            <ListItem key={item.nombre} sx={{ alignItems: 'flex-start' }}>
              <ListItemIcon sx={{ minWidth: 'var(--size-touch)' }}>
                <Checkbox
                  checked={Boolean(item.listo)}
                  onChange={() => onToggle?.(indice)}
                  icon={<Icono nombre="menos" />}
                  checkedIcon={<Icono nombre="check" />}
                  inputProps={{ 'aria-label': item.nombre }}
                  sx={{ color: 'var(--border-strong)', '&.Mui-checked': { color: 'var(--success)' } }}
                />
              </ListItemIcon>
              <ListItemText
                primary={item.nombre}
                primaryTypographyProps={{
                  sx: { fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '16px', color: 'var(--ink-strong)' },
                }}
                secondary={
                  <>
                    {item.oficial && (
                      <Typography component="span" display="block" sx={{ fontSize: '14px', color: 'var(--ink-muted)' }}>
                        {item.oficial}
                      </Typography>
                    )}
                    {item.donde && (
                      <Typography component="span" display="block" sx={{ fontSize: '14px', color: 'var(--ink-muted)' }}>
                        {item.donde}
                      </Typography>
                    )}
                    {vencePronto && (
                      <Typography
                        component="span"
                        display="block"
                        sx={{ fontSize: '14px', color: 'var(--ink-warning)', fontWeight: 600 }}
                      >
                        Vence: {item.vence}
                      </Typography>
                    )}
                  </>
                }
              />
            </ListItem>
          );
        })}
      </List>
      <Typography sx={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--ink-muted)' }}>
        La app no guarda tus documentos. La casilla es solo un recordatorio tuyo.
      </Typography>
    </Stack>
  );
}
```

- [ ] **Step 4: Ejecutar y verificar que pasa**

Run: `npm run test -w web`
Expected: PASS.

- [ ] **Step 5: Agregar al catálogo**

En `web/src/dev/Catalogo.tsx`, agrega `import { ChecklistDocumentos } from '../components/organisms/ChecklistDocumentos/ChecklistDocumentos';` y esta sección:

```tsx
      <section>
        <Typography variant="overline">ChecklistDocumentos</Typography>
        <div style={{ marginTop: 16 }}>
          <ChecklistDocumentos
            programa="DS49"
            items={[
              { nombre: 'Tu cédula', oficial: 'Cédula de identidad vigente', listo: true },
              { nombre: 'Cartola Hogar', donde: 'En línea, gratis, en registrosocial.gob.cl', listo: false },
              { nombre: 'Certificado de ahorro', vence: '30 sep 2026', listo: false },
            ]}
            onToggle={() => {}}
          />
        </div>
      </section>
```

- [ ] **Step 6: Captura de verificación visual**

Run: `node web/e2e/capturar.mjs /catalogo 22-checklistdocumentos`
Expected: PNG generado. Verifica: "1 de 3 listos" junto a una barra de avance en terracota, la fila lista con check verde, "Certificado de ahorro" muestra su fecha de vencimiento en tono de advertencia, y la nota al pie sobre que la app no guarda los documentos.

- [ ] **Step 7: Commit**

```bash
git add web/src/components/organisms/ChecklistDocumentos web/src/dev/Catalogo.tsx
git commit -m "feat(web): organismo ChecklistDocumentos"
```

---

### Task 23: Organismo `LineaDeLlamados`

Ningún dato real de llamados (fechas de apertura/cierre/Serviu) existe hoy en el backend — este componente se construye fiel a su contrato y, cuando se use en Task 31, cada llamado usará el propio texto de repliegue del design system («Sin fecha publicada», «Por confirmar con el Serviu») en vez de una fecha inventada.

**Files:**
- Create: `web/src/components/organisms/LineaDeLlamados/LineaDeLlamados.tsx`
- Test: `web/src/components/organisms/LineaDeLlamados/LineaDeLlamados.test.tsx`
- Modify: `web/src/dev/Catalogo.tsx`

**Interfaces:**
- Consumes: `Boton` de `../../atoms/Boton/Boton` (Task 6).
- Produces: `LlamadoItem { programa: string; fechas: string; serviu: string; estado: 'cerrado' | 'abierto' | 'porVenir'; porConfirmar?: boolean; contador?: string; accion?: string }`, `LineaDeLlamados(props: { titulo?: string; llamados: LlamadoItem[]; onAccion?: (indice: number) => void }): JSX.Element` desde `web/src/components/organisms/LineaDeLlamados/LineaDeLlamados.tsx`.

- [ ] **Step 1: Test (falla primero)**

Create `web/src/components/organisms/LineaDeLlamados/LineaDeLlamados.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LineaDeLlamados } from './LineaDeLlamados';

const llamados = [
  { programa: 'DS49', fechas: '3 mar 2026 – 30 mar 2026', serviu: 'Serviu Metropolitana', estado: 'cerrado' as const },
  {
    programa: 'DS1',
    fechas: 'Sin fecha publicada',
    serviu: 'Por confirmar con tu Serviu regional',
    estado: 'porVenir' as const,
    porConfirmar: true,
    contador: 'Aún sin fecha',
    accion: 'Avisarme',
  },
];

describe('LineaDeLlamados', () => {
  it('muestra apertura, cierre y Serviu juntos, para cada llamado', () => {
    render(<LineaDeLlamados llamados={llamados} />);
    expect(screen.getByText('3 mar 2026 – 30 mar 2026 · Serviu Metropolitana')).toBeInTheDocument();
  });

  it('un llamado cerrado se muestra atenuado pero nunca se esconde', () => {
    render(<LineaDeLlamados llamados={llamados} />);
    expect(screen.getByText('DS49')).toBeInTheDocument();
  });

  it('una fecha por confirmar lo dice explícitamente', () => {
    render(<LineaDeLlamados llamados={llamados} />);
    expect(screen.getByText('Por confirmar con el Serviu.')).toBeInTheDocument();
  });

  it('la acción de recordatorio llama a onAccion con el índice', async () => {
    const onAccion = vi.fn();
    render(<LineaDeLlamados llamados={llamados} onAccion={onAccion} />);
    await userEvent.click(screen.getByRole('button', { name: 'Avisarme' }));
    expect(onAccion).toHaveBeenCalledWith(1);
  });
});
```

- [ ] **Step 2: Ejecutar y verificar que falla**

Run: `npm run test -w web`
Expected: FAIL — `./LineaDeLlamados` no existe.

- [ ] **Step 3: Implementar**

Create `web/src/components/organisms/LineaDeLlamados/LineaDeLlamados.tsx`:

```tsx
import { Stack, Typography, Box } from '@mui/material';
import { Boton } from '../../atoms/Boton/Boton';

export interface LlamadoItem {
  programa: string;
  fechas: string;
  serviu: string;
  estado: 'cerrado' | 'abierto' | 'porVenir';
  porConfirmar?: boolean;
  contador?: string;
  accion?: string;
}

export interface LineaDeLlamadosProps {
  titulo?: string;
  llamados: LlamadoItem[];
  onAccion?: (indice: number) => void;
}

const COLOR_ESTADO: Record<LlamadoItem['estado'], string> = {
  cerrado: 'var(--ink-muted)',
  abierto: 'var(--brand)',
  porVenir: 'var(--border-strong)',
};

/**
 * El calendario de llamados de un programa, en una línea de tiempo vertical. Cada llamado
 * muestra apertura, cierre y Serviu regional juntos — un llamado sin región está mal mostrado.
 * El cerrado se muestra atenuado pero legible, nunca se esconde.
 */
export function LineaDeLlamados({ titulo, llamados, onAccion }: LineaDeLlamadosProps) {
  return (
    <Stack spacing={2}>
      {titulo && (
        <Typography sx={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '20px', color: 'var(--ink-strong)' }}>
          {titulo}
        </Typography>
      )}
      {llamados.map((l, indice) => (
        <Stack key={`${l.programa}-${indice}`} direction="row" spacing={1.5}>
          <Box
            sx={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              backgroundColor: COLOR_ESTADO[l.estado],
              mt: '6px',
              flexShrink: 0,
            }}
          />
          <Stack spacing={0.25} sx={{ flex: 1, opacity: l.estado === 'cerrado' ? 0.7 : 1 }}>
            <Typography
              sx={{
                fontFamily: 'var(--font-sans)',
                fontWeight: 600,
                fontSize: '16px',
                color: l.estado === 'cerrado' ? 'var(--ink-muted)' : 'var(--ink-strong)',
              }}
            >
              {l.programa}
            </Typography>
            <Typography sx={{ fontFamily: 'var(--font-mono)', fontSize: '15px', color: 'var(--ink-muted)' }}>
              {l.fechas} · {l.serviu}
            </Typography>
            {l.porConfirmar && (
              <Typography
                sx={{ fontFamily: 'var(--font-sans)', fontSize: '14px', color: 'var(--ink-muted)', fontStyle: 'italic' }}
              >
                Por confirmar con el Serviu.
              </Typography>
            )}
            {l.contador && (
              <Typography sx={{ fontFamily: 'var(--font-mono)', fontSize: '15px', color: 'var(--ink-warning)', fontWeight: 600 }}>
                {l.contador}
              </Typography>
            )}
            {l.accion && (
              <Boton variant="text" size="small" sx={{ alignSelf: 'flex-start', px: 0 }} onClick={() => onAccion?.(indice)}>
                {l.accion}
              </Boton>
            )}
          </Stack>
        </Stack>
      ))}
    </Stack>
  );
}
```

- [ ] **Step 4: Ejecutar y verificar que pasa**

Run: `npm run test -w web`
Expected: PASS.

- [ ] **Step 5: Agregar al catálogo**

En `web/src/dev/Catalogo.tsx`, agrega `import { LineaDeLlamados } from '../components/organisms/LineaDeLlamados/LineaDeLlamados';` y esta sección:

```tsx
      <section>
        <Typography variant="overline">LineaDeLlamados</Typography>
        <div style={{ marginTop: 16 }}>
          <LineaDeLlamados
            titulo="Próximos llamados"
            llamados={[
              { programa: 'DS49', fechas: '3 mar 2026 – 30 mar 2026', serviu: 'Serviu Metropolitana', estado: 'cerrado' },
              {
                programa: 'DS1',
                fechas: 'Sin fecha publicada',
                serviu: 'Por confirmar con tu Serviu regional',
                estado: 'porVenir',
                porConfirmar: true,
                accion: 'Avisarme cuando se publique',
              },
            ]}
            onAccion={() => {}}
          />
        </div>
      </section>
```

- [ ] **Step 6: Captura de verificación visual**

Run: `node web/e2e/capturar.mjs /catalogo 23-lineadellamados`
Expected: PNG generado. Verifica: el llamado cerrado se ve atenuado (punto gris) pero legible, el segundo llamado dice claramente "Por confirmar con el Serviu" en vez de mostrar una fecha inventada, y el botón "Avisarme..." queda visible al final de esa fila.

- [ ] **Step 7: Commit**

```bash
git add web/src/components/organisms/LineaDeLlamados web/src/dev/Catalogo.tsx
git commit -m "feat(web): organismo LineaDeLlamados"
```

---

### Task 24: Organismo `TarjetaPorQue` (solo de fixture — sin datos reales, ver Global Constraints)

El motor de reglas del backend devuelve un solo `motivo` por programa, no un arreglo `reglas` evaluadas una por una con el dato de la persona (`tuDato` es obligatorio en `index.d.ts` y hoy no hay de dónde sacarlo). Se construye el componente fiel a su contrato y se prueba con datos de fixture; **no se conecta a la API en este plan** — eso requiere extender `backend/src/rules-engine` para que cada `evaluarDSxx` devuelva su lista de sub-reglas evaluadas, no solo el primer motivo que falla. Se avisa de nuevo en el cierre (Task 32).

**Files:**
- Create: `web/src/components/organisms/TarjetaPorQue/TarjetaPorQue.tsx`
- Test: `web/src/components/organisms/TarjetaPorQue/TarjetaPorQue.test.tsx`
- Modify: `web/src/dev/Catalogo.tsx`

**Interfaces:**
- Consumes: `Icono` de `../../atoms/Icono/Icono` (Task 5).
- Produces: `ReglaEvaluada { enunciado: string; tuDato: string; cumple: boolean; fuente: string; arreglo?: string }`, `TarjetaPorQue(props: { titulo: string; reglas: ReglaEvaluada[]; pie?: string }): JSX.Element` desde `web/src/components/organisms/TarjetaPorQue/TarjetaPorQue.tsx`.

- [ ] **Step 1: Test (falla primero)**

Create `web/src/components/organisms/TarjetaPorQue/TarjetaPorQue.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TarjetaPorQue } from './TarjetaPorQue';

const reglas = [
  {
    enunciado: 'Tramo del Registro Social de Hogares de 40% o menos.',
    tuDato: '30,4%',
    cumple: true,
    fuente: 'D.S. N°49, artículo 4',
  },
  {
    enunciado: 'Ahorro mínimo de 10 UF.',
    tuDato: '8 UF',
    cumple: false,
    fuente: 'D.S. N°49, artículo 5',
    arreglo: 'Ahorra 2 UF más antes del cierre del llamado.',
  },
];

describe('TarjetaPorQue', () => {
  it('arranca cerrada', () => {
    render(<TarjetaPorQue titulo="Por qué calificas para DS49" reglas={reglas} />);
    expect(screen.getByRole('button', { name: /Por qué calificas para DS49/ })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });

  it('cada fila muestra el enunciado, el dato de la persona y la fuente', async () => {
    render(<TarjetaPorQue titulo="Por qué calificas para DS49" reglas={reglas} />);
    await userEvent.click(screen.getByRole('button', { name: /Por qué calificas para DS49/ }));
    expect(screen.getByText('Tramo del Registro Social de Hogares de 40% o menos.')).toBeInTheDocument();
    expect(screen.getByText('Tu dato: 30,4%')).toBeInTheDocument();
    expect(screen.getByText('Fuente: D.S. N°49, artículo 4')).toBeInTheDocument();
  });

  it('una regla que no se cumple ofrece un arreglo cuando es alcanzable', async () => {
    render(<TarjetaPorQue titulo="Por qué calificas para DS49" reglas={reglas} />);
    await userEvent.click(screen.getByRole('button', { name: /Por qué calificas para DS49/ }));
    expect(screen.getByText('Ahorra 2 UF más antes del cierre del llamado.')).toBeInTheDocument();
  });

  it('muestra con qué versión de reglas se calculó, en el pie', async () => {
    render(
      <TarjetaPorQue titulo="Por qué calificas para DS49" reglas={reglas} pie="Reglas al 22 de septiembre de 2026." />,
    );
    await userEvent.click(screen.getByRole('button', { name: /Por qué calificas para DS49/ }));
    expect(screen.getByText('Reglas al 22 de septiembre de 2026.')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Ejecutar y verificar que falla**

Run: `npm run test -w web`
Expected: FAIL — `./TarjetaPorQue` no existe.

- [ ] **Step 3: Implementar**

Create `web/src/components/organisms/TarjetaPorQue/TarjetaPorQue.tsx`:

```tsx
import { Card, Accordion, AccordionSummary, AccordionDetails, Stack, Typography } from '@mui/material';
import { Icono } from '../../atoms/Icono/Icono';

export interface ReglaEvaluada {
  enunciado: string;
  tuDato: string;
  cumple: boolean;
  fuente: string;
  arreglo?: string;
}

export interface TarjetaPorQueProps {
  titulo: string;
  reglas: ReglaEvaluada[];
  /** Con qué versión de reglas se calculó. */
  pie?: string;
}

/**
 * La explicación de un resultado, regla por regla. Arranca cerrada. Todo dato viene del motor
 * determinista — este componente no recibe texto generado por el modelo.
 */
export function TarjetaPorQue({ titulo, reglas, pie }: TarjetaPorQueProps) {
  return (
    <Card variant="outlined" sx={{ borderColor: 'var(--border)' }}>
      <Accordion disableGutters sx={{ boxShadow: 'none', '&::before': { display: 'none' } }}>
        <AccordionSummary expandIcon={<Icono nombre="abajo" />}>
          <Typography sx={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '16px' }}>{titulo}</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={2}>
            {reglas.map((r, i) => (
              <Stack
                key={i}
                spacing={0.5}
                sx={{ borderTop: i > 0 ? '1px solid var(--border)' : undefined, pt: i > 0 ? 1.5 : 0 }}
              >
                <Stack direction="row" spacing={1} alignItems="flex-start">
                  <Icono
                    nombre={r.cumple ? 'check' : 'cerrar'}
                    tamano={18}
                    sx={{ color: r.cumple ? 'var(--success)' : 'var(--ink-muted)', mt: '2px' }}
                  />
                  <Typography sx={{ fontFamily: 'var(--font-sans)', fontSize: '16px', color: 'var(--ink)' }}>
                    {r.enunciado}
                  </Typography>
                </Stack>
                <Typography sx={{ fontFamily: 'var(--font-mono)', fontSize: '15px', color: 'var(--ink-muted)', pl: '26px' }}>
                  Tu dato: {r.tuDato}
                </Typography>
                <Typography sx={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--ink-muted)', pl: '26px' }}>
                  Fuente: {r.fuente}
                </Typography>
                {r.arreglo && (
                  <Typography sx={{ fontFamily: 'var(--font-sans)', fontSize: '14px', color: 'var(--ink-brand)', pl: '26px' }}>
                    {r.arreglo}
                  </Typography>
                )}
              </Stack>
            ))}
            {pie && (
              <Typography sx={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--ink-muted)' }}>
                {pie}
              </Typography>
            )}
          </Stack>
        </AccordionDetails>
      </Accordion>
    </Card>
  );
}
```

- [ ] **Step 4: Ejecutar y verificar que pasa**

Run: `npm run test -w web`
Expected: PASS.

- [ ] **Step 5: Agregar al catálogo**

En `web/src/dev/Catalogo.tsx`, agrega `import { TarjetaPorQue } from '../components/organisms/TarjetaPorQue/TarjetaPorQue';` y esta sección (con la nota de que es solo de fixture):

```tsx
      <section>
        <Typography variant="overline">TarjetaPorQue (fixture — sin conexión a datos reales aún)</Typography>
        <div style={{ marginTop: 16 }}>
          <TarjetaPorQue
            titulo="Por qué calificas para DS49"
            reglas={[
              {
                enunciado: 'Tramo del Registro Social de Hogares de 40% o menos.',
                tuDato: '30,4%',
                cumple: true,
                fuente: 'D.S. N°49, artículo 4',
              },
              {
                enunciado: 'Ahorro mínimo de 10 UF.',
                tuDato: '8 UF',
                cumple: false,
                fuente: 'D.S. N°49, artículo 5',
                arreglo: 'Ahorra 2 UF más antes del cierre del llamado.',
              },
            ]}
            pie="Reglas al 22 de septiembre de 2026."
          />
        </div>
      </section>
```

- [ ] **Step 6: Captura de verificación visual**

Run: `node web/e2e/capturar.mjs /catalogo 24-tarjetaporque`
Expected: PNG generado. Antes de capturar, abre manualmente el acordeón en el navegador (o ajusta temporalmente el catálogo para que arranque abierto) para confirmar que cada fila muestra el ícono de cumple/no cumple, el dato de la persona en monoespaciada, y la fuente por fila (no una sola al pie).

- [ ] **Step 7: Commit**

```bash
git add web/src/components/organisms/TarjetaPorQue web/src/dev/Catalogo.tsx
git commit -m "feat(web): organismo TarjetaPorQue (fixture, sin conexion a datos reales)"
```

---

### Task 25: Cliente de `/api/chat` y contexto de sesión

El corazón del estado de la app: el cliente HTTP que nunca lanza (todo error vuelve tipado) y el contexto de React que guarda transcripción, perfil, resultados y plan en `localStorage`, degradando a memoria si el navegador lo bloquea. Cubre los puntos 1 y 4 de Review Focus.

**Files:**
- Create: `web/src/api/chatClient.ts`
- Test: `web/src/api/chatClient.test.ts`
- Create: `web/src/state/SesionContext.tsx`
- Test: `web/src/state/SesionContext.test.tsx`

**Interfaces:**
- Consumes: `Perfil`, `ResultadoPrograma`, `PlanPrograma`, `Programa`, `EstadoElegibilidad`, `PERFIL_DESCONOCIDO`, `evaluarTodosLosProgramas`, `generarPlanPapeles` de `../types/dominio` (Task 1).
- Produces: `enviarMensaje(sessionId: string, mensaje: string): Promise<ChatResultado>` desde `web/src/api/chatClient.ts`, con `ChatResultado = ChatOk | ChatError`. `SesionProvider`, `useSesion(): SesionContextValue` desde `web/src/state/SesionContext.tsx` — toda pantalla que hable con la API o lea el perfil/resultados/plan pasa por aquí, nunca hace su propio `fetch`.

- [ ] **Step 1: Test del cliente HTTP (falla primero)**

Create `web/src/api/chatClient.test.ts`:

```ts
import { describe, it, expect, vi, afterEach } from 'vitest';
import { enviarMensaje } from './chatClient';

function mockFetch(status: number, body: unknown) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      json: async () => body,
    }),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('enviarMensaje', () => {
  it('200: devuelve respuesta, perfil, resultados y plan', async () => {
    mockFetch(200, { respuesta: 'Hola', perfil: {}, resultados: [], plan: [] });
    const r = await enviarMensaje('id-1', 'Hola');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.respuesta).toBe('Hola');
  });

  it('429: expone el mensaje exacto del backend sobre el límite de mensajes', async () => {
    mockFetch(429, {
      error: 'limite_mensajes',
      mensaje: 'Esta conversación llegó a su límite de mensajes. Puedes empezar una nueva.',
    });
    const r = await enviarMensaje('id-1', 'Hola');
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.codigo).toBe('limite_mensajes');
      expect(r.mensaje).toBe('Esta conversación llegó a su límite de mensajes. Puedes empezar una nueva.');
    }
  });

  it('503: identifica el fallo del asistente para que la pantalla ofrezca el modo demo', async () => {
    mockFetch(503, {
      error: 'asistente_no_disponible',
      mensaje: 'El asistente no está disponible en este momento. Puedes probar el modo demo.',
    });
    const r = await enviarMensaje('id-1', 'Hola');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.codigo).toBe('asistente_no_disponible');
  });

  it('500: cae a error_interno', async () => {
    mockFetch(500, { error: 'error_interno' });
    const r = await enviarMensaje('id-1', 'Hola');
    if (!r.ok) expect(r.codigo).toBe('error_interno');
  });

  it('sin red: nunca lanza, vuelve como codigo "red"', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    const r = await enviarMensaje('id-1', 'Hola');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.codigo).toBe('red');
  });
});
```

- [ ] **Step 2: Ejecutar y verificar que falla**

Run: `npm run test -w web`
Expected: FAIL — `./chatClient` no existe.

- [ ] **Step 3: Implementar el cliente**

Create `web/src/api/chatClient.ts`:

```ts
import type { Perfil, ResultadoPrograma, PlanPrograma } from '../types/dominio';

export interface ChatOk {
  ok: true;
  respuesta: string;
  perfil: Perfil;
  resultados: ResultadoPrograma[];
  plan: PlanPrograma[];
}

export type ChatErrorCodigo =
  | 'solicitud_invalida'
  | 'limite_mensajes'
  | 'asistente_no_disponible'
  | 'error_interno'
  | 'red';

export interface ChatError {
  ok: false;
  status: number;
  codigo: ChatErrorCodigo;
  mensaje?: string;
}

export type ChatResultado = ChatOk | ChatError;

/**
 * Cliente de `POST /api/chat`. Nunca lanza: todo error de red o del servidor vuelve como
 * `{ ok: false }`, para que la pantalla decida cómo mostrarlo — nunca depende de un catch
 * genérico que oculte el 429/503 documentado por el backend.
 */
export async function enviarMensaje(sessionId: string, mensaje: string): Promise<ChatResultado> {
  let res: Response;
  try {
    res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ sessionId, mensaje }),
    });
  } catch {
    return { ok: false, status: 0, codigo: 'red' };
  }

  const cuerpo = (await res.json().catch(() => ({}))) as Record<string, unknown>;

  if (res.ok) {
    return {
      ok: true,
      respuesta: cuerpo.respuesta as string,
      perfil: cuerpo.perfil as Perfil,
      resultados: cuerpo.resultados as ResultadoPrograma[],
      plan: cuerpo.plan as PlanPrograma[],
    };
  }

  return {
    ok: false,
    status: res.status,
    codigo: (cuerpo.error as ChatErrorCodigo) ?? 'error_interno',
    mensaje: cuerpo.mensaje as string | undefined,
  };
}
```

- [ ] **Step 4: Ejecutar y verificar que pasa**

Run: `npm run test -w web`
Expected: PASS.

- [ ] **Step 5: Test del contexto de sesión (falla primero)**

Create `web/src/state/SesionContext.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SesionProvider, useSesion } from './SesionContext';
import * as chatClient from '../api/chatClient';
import { PERFIL_DESCONOCIDO } from '../types/dominio';

function Sonda() {
  const s = useSesion();
  return (
    <div>
      <div data-testid="transcript-length">{s.transcript.length}</div>
      <div data-testid="error">{s.error?.codigo ?? ''}</div>
      <button onClick={() => s.enviarTurno('Hola')}>enviar</button>
      <button onClick={() => s.borrarDatos()}>borrar</button>
    </div>
  );
}

describe('SesionProvider', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('genera un sessionId nuevo en la primera visita y lo guarda', () => {
    render(
      <SesionProvider>
        <Sonda />
      </SesionProvider>,
    );
    expect(window.localStorage.getItem('rumbo-sesion')).toBeTruthy();
  });

  it('al enviar un turno, agrega el mensaje de la persona y luego la respuesta del agente', async () => {
    vi.spyOn(chatClient, 'enviarMensaje').mockResolvedValue({
      ok: true,
      respuesta: 'Hola, ¿en qué región vives?',
      perfil: PERFIL_DESCONOCIDO,
      resultados: [],
      plan: [],
    });
    render(
      <SesionProvider>
        <Sonda />
      </SesionProvider>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'enviar' }));
    await waitFor(() => expect(screen.getByTestId('transcript-length')).toHaveTextContent('2'));
  });

  it('un error del backend queda expuesto, nunca se pierde en silencio', async () => {
    vi.spyOn(chatClient, 'enviarMensaje').mockResolvedValue({
      ok: false,
      status: 503,
      codigo: 'asistente_no_disponible',
      mensaje: 'El asistente no está disponible en este momento. Puedes probar el modo demo.',
    });
    render(
      <SesionProvider>
        <Sonda />
      </SesionProvider>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'enviar' }));
    await waitFor(() => expect(screen.getByTestId('error')).toHaveTextContent('asistente_no_disponible'));
  });

  it('borrar los datos limpia localStorage y arranca una sesión nueva', async () => {
    render(
      <SesionProvider>
        <Sonda />
      </SesionProvider>,
    );
    const idAntes = JSON.parse(window.localStorage.getItem('rumbo-sesion')!).sessionId;
    await userEvent.click(screen.getByRole('button', { name: 'borrar' }));
    await waitFor(() => {
      const idDespues = JSON.parse(window.localStorage.getItem('rumbo-sesion')!).sessionId;
      expect(idDespues).not.toBe(idAntes);
    });
  });

  it('si localStorage lanza (modo privado), la sesión sigue funcionando en memoria', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    expect(() =>
      render(
        <SesionProvider>
          <Sonda />
        </SesionProvider>,
      ),
    ).not.toThrow();
  });
});
```

- [ ] **Step 6: Ejecutar y verificar que falla**

Run: `npm run test -w web`
Expected: FAIL — `./SesionContext` no existe.

- [ ] **Step 7: Implementar el contexto**

Create `web/src/state/SesionContext.tsx`:

```tsx
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { enviarMensaje, type ChatError } from '../api/chatClient';
import {
  PERFIL_DESCONOCIDO,
  evaluarTodosLosProgramas,
  generarPlanPapeles,
  type Perfil,
  type ResultadoPrograma,
  type PlanPrograma,
  type Programa,
  type EstadoElegibilidad as EstadoBackend,
} from '../types/dominio';

export interface TurnoChat {
  id: string;
  autor: 'agente' | 'persona';
  texto: string;
  dictado?: boolean;
}

export interface EventoSello {
  id: string;
  programa: Programa;
  estado: EstadoBackend;
}

export interface EstadoSeguimiento {
  etapa: 'papeles' | 'postule' | 'evaluacion' | 'resultado';
  folio?: string;
}

export interface EstadoSesion {
  sessionId: string;
  transcript: TurnoChat[];
  eventos: EventoSello[];
  perfil: Perfil;
  resultados: ResultadoPrograma[];
  plan: PlanPrograma[];
  documentosListos: Record<string, boolean>;
  seguimiento: EstadoSeguimiento;
  esDemo: boolean;
}

const CLAVE_STORAGE = 'rumbo-sesion';

function crearId(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
}

function sesionNueva(): EstadoSesion {
  return {
    sessionId: crearId(),
    transcript: [],
    eventos: [],
    perfil: PERFIL_DESCONOCIDO,
    resultados: [],
    plan: [],
    documentosListos: {},
    seguimiento: { etapa: 'papeles' },
    esDemo: false,
  };
}

function leerStorage(): EstadoSesion | undefined {
  try {
    const bruto = window.localStorage.getItem(CLAVE_STORAGE);
    return bruto ? (JSON.parse(bruto) as EstadoSesion) : undefined;
  } catch {
    return undefined;
  }
}

function escribirStorage(estado: EstadoSesion) {
  try {
    window.localStorage.setItem(CLAVE_STORAGE, JSON.stringify(estado));
  } catch {
    // localStorage bloqueado (modo privado, cuotas): la sesión sigue en memoria, sin persistir.
  }
}

export interface SesionContextValue extends EstadoSesion {
  cargando: boolean;
  error?: ChatError;
  enviarTurno: (mensaje: string) => Promise<void>;
  activarDemo: (perfilDemo: Perfil) => void;
  marcarDocumento: (clave: string, listo: boolean) => void;
  marcarEtapa: (etapa: EstadoSeguimiento['etapa']) => void;
  guardarFolio: (folio: string) => void;
  borrarDatos: () => void;
}

const SesionContext = createContext<SesionContextValue | undefined>(undefined);

export function SesionProvider({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<EstadoSesion>(() => leerStorage() ?? sesionNueva());
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<ChatError | undefined>();

  useEffect(() => {
    escribirStorage(estado);
  }, [estado]);

  const enviarTurno = async (mensaje: string) => {
    const idPersona = crearId();
    setEstado((prev) => ({
      ...prev,
      transcript: [...prev.transcript, { id: idPersona, autor: 'persona', texto: mensaje }],
    }));
    setCargando(true);
    setError(undefined);
    const resultado = await enviarMensaje(estado.sessionId, mensaje);
    setCargando(false);
    if (!resultado.ok) {
      setError(resultado);
      return;
    }
    setEstado((prev) => {
      const eventosNuevos: EventoSello[] = resultado.resultados
        .filter((r) => prev.resultados.find((p) => p.programa === r.programa)?.estado !== r.estado)
        .map((r) => ({ id: crearId(), programa: r.programa, estado: r.estado }));
      return {
        ...prev,
        transcript: [...prev.transcript, { id: crearId(), autor: 'agente', texto: resultado.respuesta }],
        eventos: [...prev.eventos, ...eventosNuevos],
        perfil: resultado.perfil,
        resultados: resultado.resultados,
        plan: resultado.plan,
      };
    });
  };

  const activarDemo = (perfilDemo: Perfil) => {
    const resultados = evaluarTodosLosProgramas(perfilDemo);
    const plan = generarPlanPapeles(resultados);
    setEstado((prev) => ({
      ...prev,
      esDemo: true,
      perfil: perfilDemo,
      resultados,
      plan,
      eventos: resultados.map((r) => ({ id: crearId(), programa: r.programa, estado: r.estado })),
      transcript: [
        ...prev.transcript,
        {
          id: crearId(),
          autor: 'agente',
          texto: 'Activamos el modo demo con una familia ficticia para que puedas ver cómo funciona Rumbo a Casa.',
        },
      ],
    }));
    setError(undefined);
  };

  const marcarDocumento = (clave: string, listo: boolean) => {
    setEstado((prev) => ({ ...prev, documentosListos: { ...prev.documentosListos, [clave]: listo } }));
  };

  const marcarEtapa = (etapa: EstadoSeguimiento['etapa']) => {
    setEstado((prev) => ({ ...prev, seguimiento: { ...prev.seguimiento, etapa } }));
  };

  const guardarFolio = (folio: string) => {
    setEstado((prev) => ({ ...prev, seguimiento: { ...prev.seguimiento, folio } }));
  };

  const borrarDatos = () => {
    try {
      window.localStorage.removeItem(CLAVE_STORAGE);
    } catch {
      // nada que limpiar si localStorage no está disponible
    }
    setEstado(sesionNueva());
    setError(undefined);
  };

  return (
    <SesionContext.Provider
      value={{
        ...estado,
        cargando,
        error,
        enviarTurno,
        activarDemo,
        marcarDocumento,
        marcarEtapa,
        guardarFolio,
        borrarDatos,
      }}
    >
      {children}
    </SesionContext.Provider>
  );
}

export function useSesion(): SesionContextValue {
  const ctx = useContext(SesionContext);
  if (!ctx) throw new Error('useSesion debe usarse dentro de <SesionProvider>');
  return ctx;
}
```

- [ ] **Step 8: Ejecutar y verificar que todo pasa**

Run: `npm run test -w web`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add web/src/api web/src/state
git commit -m "feat(web): cliente de /api/chat y contexto de sesion con persistencia local"
```

---

### Task 26: Plantilla `AppShell` y enrutamiento real

Reemplaza el enrutamiento manual temporal de Task 4 por `react-router-dom`. Crea pantallas de relleno mínimas y reales (no marcadores de posición: cada una ya renderiza algo, solo que aún no es el contenido final) para que la app compile y navegue de punta a punta desde ahora — las Tasks 27-31 las reemplazan una por una con la implementación completa.

**Files:**
- Create: `web/src/components/templates/AppShell/AppShell.tsx`
- Test: `web/src/components/templates/AppShell/AppShell.test.tsx`
- Create: `web/src/screens/PantallaBienvenida/PantallaBienvenida.tsx`
- Create: `web/src/screens/PantallaEntrevista/PantallaEntrevista.tsx`
- Create: `web/src/screens/PantallaResultado/PantallaResultado.tsx`
- Create: `web/src/screens/PantallaPlan/PantallaPlan.tsx`
- Create: `web/src/screens/PantallaDocumentos/PantallaDocumentos.tsx`
- Create: `web/src/screens/PantallaSeguimiento/PantallaSeguimiento.tsx`
- Modify: `web/src/App.tsx`

**Interfaces:**
- Consumes: `CabeceraApp` (Task 18), `BarraInferior`, `DestinoBarraInferior` (Task 19), `SesionProvider` (Task 25).
- Produces: `AppShell(props: { titulo: string; destino: DestinoBarraInferior; avisos?: number; atras?: boolean; children: ReactNode }): JSX.Element` desde `web/src/components/templates/AppShell/AppShell.tsx`. Rutas: `/` (bienvenida, sin `AppShell`), `/hablar`, `/resultado`, `/plan/:programa`, `/documentos`, `/avisos`, `/catalogo`.

- [ ] **Step 1: Test de `AppShell` (falla primero)**

Create `web/src/components/templates/AppShell/AppShell.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AppShell } from './AppShell';

function conEnrutamiento(inicial: string) {
  return render(
    <MemoryRouter initialEntries={[inicial]}>
      <Routes>
        <Route
          path="/hablar"
          element={
            <AppShell titulo="Hablemos" destino="hablar">
              contenido hablar
            </AppShell>
          }
        />
        <Route
          path="/documentos"
          element={
            <AppShell titulo="Tus documentos" destino="documentos">
              contenido documentos
            </AppShell>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe('AppShell', () => {
  it('muestra el título en la cabecera y el contenido de la pantalla', () => {
    conEnrutamiento('/hablar');
    expect(screen.getByText('Hablemos')).toBeInTheDocument();
    expect(screen.getByText('contenido hablar')).toBeInTheDocument();
  });

  it('navega al tocar un destino de la barra inferior', async () => {
    conEnrutamiento('/hablar');
    await userEvent.click(screen.getByRole('button', { name: /Documentos/ }));
    expect(await screen.findByText('contenido documentos')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Ejecutar y verificar que falla**

Run: `npm run test -w web`
Expected: FAIL — `./AppShell` no existe.

- [ ] **Step 3: Implementar `AppShell`**

Create `web/src/components/templates/AppShell/AppShell.tsx`:

```tsx
import type { ReactNode } from 'react';
import { Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { CabeceraApp } from '../../organisms/CabeceraApp/CabeceraApp';
import { BarraInferior, type DestinoBarraInferior } from '../../organisms/BarraInferior/BarraInferior';

const RUTA_DESTINO: Record<DestinoBarraInferior, string> = {
  hablar: '/hablar',
  plan: '/resultado',
  documentos: '/documentos',
  avisos: '/avisos',
};

export interface AppShellProps {
  titulo: string;
  destino: DestinoBarraInferior;
  avisos?: number;
  atras?: boolean;
  children: ReactNode;
}

/**
 * Armazón de pantalla: cabecera fija arriba, contenido con margen lateral, barra de navegación
 * fija abajo. `space-7` de relleno inferior para que el último bloque no quede tapado por la barra.
 */
export function AppShell({ titulo, destino, avisos = 0, atras = false, children }: AppShellProps) {
  const navigate = useNavigate();
  return (
    <Box sx={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--surface-base)' }}>
      <CabeceraApp titulo={titulo} atras={atras} onAtras={() => navigate(-1)} />
      <Box component="main" sx={{ flex: 1, px: 'var(--space-4)', pt: 'var(--space-5)', pb: 'var(--space-7)' }}>
        {children}
      </Box>
      <BarraInferior
        value={destino}
        avisos={avisos}
        onChange={(_e, v) => navigate(RUTA_DESTINO[v as DestinoBarraInferior])}
      />
    </Box>
  );
}
```

- [ ] **Step 4: Ejecutar y verificar que pasa**

Run: `npm run test -w web`
Expected: PASS.

- [ ] **Step 5: Crear las seis pantallas como relleno mínimo real**

Create `web/src/screens/PantallaBienvenida/PantallaBienvenida.tsx`:

```tsx
/** Reemplazada por completo en Task 27. */
export function PantallaBienvenida() {
  return <div>Bienvenida — en construcción.</div>;
}
```

Create `web/src/screens/PantallaEntrevista/PantallaEntrevista.tsx`:

```tsx
import { AppShell } from '../../components/templates/AppShell/AppShell';

/** Reemplazada por completo en Task 28. */
export function PantallaEntrevista() {
  return (
    <AppShell titulo="Hablemos" destino="hablar">
      Entrevista — en construcción.
    </AppShell>
  );
}
```

Create `web/src/screens/PantallaResultado/PantallaResultado.tsx`:

```tsx
import { AppShell } from '../../components/templates/AppShell/AppShell';

/** Reemplazada por completo en Task 29. */
export function PantallaResultado() {
  return (
    <AppShell titulo="Tu resultado" destino="plan" atras>
      Resultado — en construcción.
    </AppShell>
  );
}
```

Create `web/src/screens/PantallaPlan/PantallaPlan.tsx`:

```tsx
import { AppShell } from '../../components/templates/AppShell/AppShell';

/** Reemplazada por completo en Task 30. */
export function PantallaPlan() {
  return (
    <AppShell titulo="Tu plan" destino="plan" atras>
      Plan — en construcción.
    </AppShell>
  );
}
```

Create `web/src/screens/PantallaDocumentos/PantallaDocumentos.tsx`:

```tsx
import { AppShell } from '../../components/templates/AppShell/AppShell';

/** Reemplazada por completo en Task 31. */
export function PantallaDocumentos() {
  return (
    <AppShell titulo="Tus documentos" destino="documentos">
      Documentos — en construcción.
    </AppShell>
  );
}
```

Create `web/src/screens/PantallaSeguimiento/PantallaSeguimiento.tsx`:

```tsx
import { AppShell } from '../../components/templates/AppShell/AppShell';

/** Reemplazada por completo en Task 31. */
export function PantallaSeguimiento() {
  return (
    <AppShell titulo="Avisos" destino="avisos">
      Seguimiento — en construcción.
    </AppShell>
  );
}
```

- [ ] **Step 6: Enrutamiento real en `App.tsx`**

Replace `web/src/App.tsx` (reemplaza la versión temporal de Task 4):

```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SesionProvider } from './state/SesionContext';
import { Catalogo } from './dev/Catalogo';
import { PantallaBienvenida } from './screens/PantallaBienvenida/PantallaBienvenida';
import { PantallaEntrevista } from './screens/PantallaEntrevista/PantallaEntrevista';
import { PantallaResultado } from './screens/PantallaResultado/PantallaResultado';
import { PantallaPlan } from './screens/PantallaPlan/PantallaPlan';
import { PantallaDocumentos } from './screens/PantallaDocumentos/PantallaDocumentos';
import { PantallaSeguimiento } from './screens/PantallaSeguimiento/PantallaSeguimiento';

export function App() {
  return (
    <SesionProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<PantallaBienvenida />} />
          <Route path="/hablar" element={<PantallaEntrevista />} />
          <Route path="/resultado" element={<PantallaResultado />} />
          <Route path="/plan/:programa" element={<PantallaPlan />} />
          <Route path="/documentos" element={<PantallaDocumentos />} />
          <Route path="/avisos" element={<PantallaSeguimiento />} />
          <Route path="/catalogo" element={<Catalogo />} />
        </Routes>
      </BrowserRouter>
    </SesionProvider>
  );
}
```

- [ ] **Step 7: Verificar que el catálogo y las pantallas siguen sirviendo**

Run: `node web/e2e/capturar.mjs /catalogo 26a-catalogo-tras-enrutamiento` y `node web/e2e/capturar.mjs /hablar 26b-hablar-stub` y `node web/e2e/capturar.mjs / 26c-bienvenida-stub`
Expected: los tres PNG se generan sin error 404 ni pantalla en blanco. `/hablar` debe mostrarse con la cabecera azul y la barra inferior ya funcionando (aunque el contenido diga "en construcción").

- [ ] **Step 8: Commit**

```bash
git add web/src/components/templates web/src/screens web/src/App.tsx
git commit -m "feat(web): plantilla AppShell y enrutamiento real con react-router"
```

---

### Task 27: Pantalla `PantallaBienvenida`

No usa `AppShell` ni `CabeceraApp`: es la única pantalla con el logotipo completo arriba y sin barra inferior. El "bloques de color de la portada" que menciona el README de `PantallaResultado` (Task 29, vía `BloqueHero`) es la `Franja` tocando el borde inferior de esta pantalla — se compone directo con `Franja`, no envolviendo el texto en `BloqueHero`, porque esta pantalla no mete la promesa dentro de un bloque azul: el fondo se mantiene `surface-base` y solo la banda del pie es de marca.

**Files:**
- Modify: `web/src/screens/PantallaBienvenida/PantallaBienvenida.tsx`
- Test: `web/src/screens/PantallaBienvenida/PantallaBienvenida.test.tsx`

**Interfaces:**
- Consumes: `Logotipo` (Task 17), `Franja` (Task 16), `Boton` (Task 6), `useSesion` (Task 25).

- [ ] **Step 1: Test (falla primero)**

Create `web/src/screens/PantallaBienvenida/PantallaBienvenida.test.tsx`:

```tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { PantallaBienvenida } from './PantallaBienvenida';
import { SesionProvider } from '../../state/SesionContext';

function renderPantalla() {
  return render(
    <SesionProvider>
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<PantallaBienvenida />} />
          <Route path="/hablar" element={<div>pantalla hablar</div>} />
        </Routes>
      </MemoryRouter>
    </SesionProvider>,
  );
}

describe('PantallaBienvenida', () => {
  beforeEach(() => window.localStorage.clear());

  it('muestra la promesa con el tiempo que toma', () => {
    renderPantalla();
    expect(screen.getByText('Averigua a qué subsidio de vivienda puedes postular')).toBeInTheDocument();
    expect(screen.getByText('Cuéntanos de tu familia en unos 5 minutos.')).toBeInTheDocument();
  });

  it('nombra los cuatro programas como chips informativos', () => {
    renderPantalla();
    expect(screen.getByText('DS49')).toBeInTheDocument();
    expect(screen.getByText('DS52')).toBeInTheDocument();
  });

  it('sin sesión previa, ofrece Empezar y ambos botones llevan a la entrevista', async () => {
    renderPantalla();
    await userEvent.click(screen.getByRole('button', { name: 'Empezar' }));
    expect(await screen.findByText('pantalla hablar')).toBeInTheDocument();
  });

  it('siempre muestra la frase de confianza completa', () => {
    renderPantalla();
    expect(
      screen.getByText(
        'Herramienta independiente, no oficial. Nunca te pediremos tu Clave Única. Puedes borrar tus datos cuando quieras.',
      ),
    ).toBeInTheDocument();
  });

  it('nunca pide correo, registro ni Clave Única: no hay ningún campo de texto', () => {
    renderPantalla();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Ejecutar y verificar que falla**

Run: `npm run test -w web`
Expected: FAIL — el placeholder de Task 26 no tiene ni la promesa ni los botones que el test busca.

- [ ] **Step 3: Implementar**

Replace `web/src/screens/PantallaBienvenida/PantallaBienvenida.tsx`:

```tsx
import { Box, Stack, Typography, Chip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Logotipo } from '../../components/organisms/Logotipo/Logotipo';
import { Franja } from '../../components/organisms/Franja/Franja';
import { Boton } from '../../components/atoms/Boton/Boton';
import { useSesion } from '../../state/SesionContext';

const PROGRAMAS = ['DS49', 'DS1', 'DS19', 'DS52'];

/**
 * Primera de las cinco pantallas: la promesa, las dos formas de empezar, y la aclaración de que
 * esto no es un sitio del Estado. No pide nada — no hay registro, correo ni Clave Única.
 */
export function PantallaBienvenida() {
  const navigate = useNavigate();
  const { transcript, borrarDatos } = useSesion();
  const tieneSesionPrevia = transcript.length > 0;

  return (
    <Box sx={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--surface-base)' }}>
      <Box sx={{ p: 'var(--space-4)' }}>
        <Logotipo disposicion="horizontal" alto={32} />
      </Box>

      <Stack spacing={5} sx={{ flex: 1, px: 'var(--space-4)', pt: 'var(--space-6)' }}>
        <Stack spacing={2}>
          <Typography
            sx={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: '40px',
              lineHeight: '44px',
              letterSpacing: '-0.02em',
              color: 'var(--ink-strong)',
            }}
          >
            Averigua a qué subsidio de vivienda puedes postular
          </Typography>
          <Typography sx={{ fontFamily: 'var(--font-sans)', fontSize: '18px', color: 'var(--ink)' }}>
            Cuéntanos de tu familia en unos 5 minutos.
          </Typography>
        </Stack>

        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
          {PROGRAMAS.map((p) => (
            <Chip
              key={p}
              label={p}
              sx={{ backgroundColor: 'var(--surface-brand-soft)', color: 'var(--ink-brand)', fontWeight: 600 }}
            />
          ))}
        </Stack>

        <Stack spacing={2} sx={{ mt: 'auto', pb: 'var(--space-6)' }}>
          {tieneSesionPrevia ? (
            <>
              <Boton onClick={() => navigate('/hablar')}>Seguir donde quedaste</Boton>
              <Boton variant="text" onClick={borrarDatos}>
                Empezar de nuevo
              </Boton>
            </>
          ) : (
            <>
              <Boton onClick={() => navigate('/hablar')}>Empezar</Boton>
              <Boton variant="outlined" color="secondary" icono="mic" onClick={() => navigate('/hablar')}>
                Prefiero hablar
              </Boton>
            </>
          )}
          <Typography sx={{ fontFamily: 'var(--font-sans)', fontSize: '14px', color: 'var(--ink-muted)' }}>
            Herramienta independiente, no oficial. Nunca te pediremos tu Clave Única. Puedes borrar tus datos cuando
            quieras.
          </Typography>
        </Stack>
      </Stack>

      <Franja tono="brand" alto={96} borde="abajo" />
    </Box>
  );
}
```

- [ ] **Step 4: Ejecutar y verificar que pasa**

Run: `npm run test -w web`
Expected: PASS.

- [ ] **Step 5: Captura de verificación visual**

Run: `node web/e2e/capturar.mjs / 27-pantallabienvenida`
Expected: PNG generado. Verifica: el logotipo completo arriba (símbolo + nombre en Bricolage Grotesque), la promesa en tamaño grande, los 4 chips de programa, "Empezar" como botón principal de ancho completo, "Prefiero hablar" en outlined terracota con ícono de micrófono, la frase de confianza legible, y la franja de marca cerrando la pantalla por abajo sin nada encima.

- [ ] **Step 6: Commit**

```bash
git add web/src/screens/PantallaBienvenida
git commit -m "feat(web): pantalla PantallaBienvenida"
```

---

### Task 28: Pantalla `PantallaEntrevista` (chat real + modo demo)

La pantalla más grande del plan: cablea `SesionContext` a la conversación real, bloquea mensajes inválidos antes de llamar al backend (Review Focus #3), muestra los cuatro códigos de error documentados (Review Focus #1) y ofrece el modo demo reutilizando el motor de reglas real del backend en el navegador — nunca datos inventados.

**Files:**
- Create: `web/src/screens/PantallaEntrevista/pasos.ts`
- Test: `web/src/screens/PantallaEntrevista/pasos.test.ts`
- Create: `web/src/lib/perfilDemo.ts`
- Test: `web/src/lib/perfilDemo.test.ts`
- Modify: `web/src/screens/PantallaEntrevista/PantallaEntrevista.tsx`
- Test: `web/src/screens/PantallaEntrevista/PantallaEntrevista.test.tsx`

**Interfaces:**
- Consumes: `AppShell` (Task 26), `PasoAPaso` (Task 13), `BurbujaChat`/`Pensando` (Task 15), `SelloElegibilidad` (Task 9), `Alerta` (Task 11), `CampoTexto` (Task 8), `Boton` (Task 6), `useSesion` (Task 25), `mapEstado` (Task 9), `evaluarTodosLosProgramas` (Task 1).
- Produces: `GRUPOS_ENTREVISTA`, `pasoActivo(perfil: Perfil): number` desde `web/src/screens/PantallaEntrevista/pasos.ts`. `PERFIL_DEMO: Perfil` desde `web/src/lib/perfilDemo.ts` — cualquier pantalla que active el modo demo usa este mismo perfil.

- [ ] **Step 1: Test de los pasos de la entrevista (falla primero)**

Create `web/src/screens/PantallaEntrevista/pasos.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { GRUPOS_ENTREVISTA, pasoActivo } from './pasos';
import { PERFIL_DESCONOCIDO } from '../../types/dominio';

describe('pasoActivo', () => {
  it('cubre los 13 campos del perfil entre los 5 grupos, sin dejar ninguno fuera', () => {
    const todos = GRUPOS_ENTREVISTA.flatMap((g) => g.campos);
    expect(new Set(todos).size).toBe(13);
  });

  it('con el perfil vacío, el paso activo es el primero', () => {
    expect(pasoActivo(PERFIL_DESCONOCIDO)).toBe(0);
  });

  it('cuando el primer grupo está completo, avanza al segundo', () => {
    const perfil = {
      ...PERFIL_DESCONOCIDO,
      postulanteEdad: 29,
      integrantesGrupoFamiliar: [],
      excepcionPostulacionIndividualDS49: false as const,
    };
    expect(pasoActivo(perfil)).toBe(1);
  });

  it('con todos los campos conocidos, se queda en el último paso', () => {
    const perfil = {
      postulanteEdad: 29,
      region: 'Metropolitana' as const,
      zonaEspecial: 'ninguna' as const,
      tramoRSH: 30,
      tienePropiedad: false as const,
      ahorroUF: 15,
      antiguedadCuentaAhorroMeses: 14,
      ingresoFamiliarMensualUF: 12.69,
      ingresoFamiliarMensualCLP: 520000,
      integrantesGrupoFamiliar: [],
      excepcionPostulacionIndividualDS49: false as const,
      subsidioPrevio: 'ninguno' as const,
      objetivo: 'comprar' as const,
    };
    expect(pasoActivo(perfil)).toBe(4);
  });
});
```

- [ ] **Step 2: Ejecutar y verificar que falla**

Run: `npm run test -w web`
Expected: FAIL — `./pasos` no existe.

- [ ] **Step 3: Implementar el mapeo de pasos**

Create `web/src/screens/PantallaEntrevista/pasos.ts`:

```ts
import type { Perfil } from '../../types/dominio';

/**
 * Agrupa los 13 campos del perfil en 5 pasos del mundo de la persona, no del motor de reglas.
 * Debe cubrir cada campo de `Perfil` exactamente una vez — ver el test de este archivo.
 */
export const GRUPOS_ENTREVISTA: ReadonlyArray<{ etiqueta: string; campos: (keyof Perfil)[] }> = [
  {
    etiqueta: 'Familia',
    campos: ['postulanteEdad', 'integrantesGrupoFamiliar', 'excepcionPostulacionIndividualDS49'],
  },
  { etiqueta: 'Vivienda', campos: ['tienePropiedad', 'objetivo', 'subsidioPrevio'] },
  { etiqueta: 'Ahorro', campos: ['ahorroUF', 'antiguedadCuentaAhorroMeses'] },
  { etiqueta: 'Ingreso', campos: ['ingresoFamiliarMensualCLP', 'ingresoFamiliarMensualUF', 'tramoRSH'] },
  { etiqueta: 'Región', campos: ['region', 'zonaEspecial'] },
];

/** El primer grupo con un campo todavía 'desconocido'; si todos están completos, el último. */
export function pasoActivo(perfil: Perfil): number {
  const indice = GRUPOS_ENTREVISTA.findIndex((g) => g.campos.some((c) => perfil[c] === 'desconocido'));
  return indice === -1 ? GRUPOS_ENTREVISTA.length - 1 : indice;
}
```

- [ ] **Step 4: Test del perfil de demo (falla primero)**

Create `web/src/lib/perfilDemo.test.ts`:

```ts
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
```

- [ ] **Step 5: Ejecutar y verificar que falla**

Run: `npm run test -w web`
Expected: FAIL — `./perfilDemo` no existe (los tests de `pasos.ts` del Step 1 ya deberían pasar).

- [ ] **Step 6: Implementar el perfil de demo**

Create `web/src/lib/perfilDemo.ts`:

```ts
import type { Perfil } from '../types/dominio';

/**
 * Familia ficticia para el modo demo: un perfil completo (ningún campo 'desconocido'), para que
 * los 4 programas queden con una determinación real del motor de reglas — nunca datos de una
 * persona real, y nunca un resultado inventado a mano.
 */
export const PERFIL_DEMO: Perfil = {
  postulanteEdad: 29,
  region: 'Metropolitana',
  zonaEspecial: 'ninguna',
  tramoRSH: 30,
  tienePropiedad: false,
  ahorroUF: 15,
  antiguedadCuentaAhorroMeses: 14,
  ingresoFamiliarMensualUF: 12.69,
  ingresoFamiliarMensualCLP: 520000,
  integrantesGrupoFamiliar: [
    { edad: 31, discapacidadCertificada: false },
    { edad: 4, discapacidadCertificada: false },
  ],
  excepcionPostulacionIndividualDS49: false,
  subsidioPrevio: 'ninguno',
  objetivo: 'comprar',
};
```

- [ ] **Step 7: Ejecutar y verificar que pasa**

Run: `npm run test -w web`
Expected: PASS.

- [ ] **Step 8: Test de la pantalla (falla primero)**

Create `web/src/screens/PantallaEntrevista/PantallaEntrevista.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { PantallaEntrevista } from './PantallaEntrevista';
import { SesionProvider } from '../../state/SesionContext';
import * as chatClient from '../../api/chatClient';
import { PERFIL_DESCONOCIDO } from '../../types/dominio';

function renderPantalla() {
  return render(
    <SesionProvider>
      <MemoryRouter initialEntries={['/hablar']}>
        <PantallaEntrevista />
      </MemoryRouter>
    </SesionProvider>,
  );
}

describe('PantallaEntrevista', () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it('el botón de enviar está deshabilitado con el mensaje vacío', () => {
    renderPantalla();
    expect(screen.getByRole('button', { name: 'Enviar' })).toBeDisabled();
  });

  it('bloquea el envío de más de 2000 caracteres, sin depender del backend', () => {
    renderPantalla();
    const campo = screen.getByLabelText('Escribe tu respuesta');
    fireEvent.change(campo, { target: { value: 'a'.repeat(2001) } });
    expect(screen.getByRole('button', { name: 'Enviar' })).toBeDisabled();
    expect(screen.getByText('Máximo 2000 caracteres.')).toBeInTheDocument();
  });

  it('envía el mensaje y muestra primero el turno de la persona, luego el del agente', async () => {
    vi.spyOn(chatClient, 'enviarMensaje').mockResolvedValue({
      ok: true,
      respuesta: 'Hola, ¿en qué región vives?',
      perfil: PERFIL_DESCONOCIDO,
      resultados: [],
      plan: [],
    });
    renderPantalla();
    await userEvent.type(screen.getByLabelText('Escribe tu respuesta'), 'Hola');
    await userEvent.click(screen.getByRole('button', { name: 'Enviar' }));
    expect(screen.getByText('Hola')).toBeInTheDocument();
    expect(await screen.findByText('Hola, ¿en qué región vives?')).toBeInTheDocument();
  });

  it('un 429 muestra el mensaje exacto del backend sobre el límite de mensajes', async () => {
    vi.spyOn(chatClient, 'enviarMensaje').mockResolvedValue({
      ok: false,
      status: 429,
      codigo: 'limite_mensajes',
      mensaje: 'Esta conversación llegó a su límite de mensajes. Puedes empezar una nueva.',
    });
    renderPantalla();
    await userEvent.type(screen.getByLabelText('Escribe tu respuesta'), 'Hola');
    await userEvent.click(screen.getByRole('button', { name: 'Enviar' }));
    expect(
      await screen.findByText('Esta conversación llegó a su límite de mensajes. Puedes empezar una nueva.'),
    ).toBeInTheDocument();
  });

  it('un 503 ofrece el modo demo, que llena resultados reales sin llamar a la API', async () => {
    vi.spyOn(chatClient, 'enviarMensaje').mockResolvedValue({
      ok: false,
      status: 503,
      codigo: 'asistente_no_disponible',
      mensaje: 'El asistente no está disponible en este momento. Puedes probar el modo demo.',
    });
    renderPantalla();
    await userEvent.type(screen.getByLabelText('Escribe tu respuesta'), 'Hola');
    await userEvent.click(screen.getByRole('button', { name: 'Enviar' }));
    const botonDemo = await screen.findByRole('button', { name: 'Probar modo demo' });
    await userEvent.click(botonDemo);
    expect((await screen.findAllByText(/Califica|No aplica|Falta un dato/)).length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 9: Ejecutar y verificar que falla**

Run: `npm run test -w web`
Expected: FAIL — el placeholder de Task 26 no tiene entrevista real.

- [ ] **Step 10: Implementar la pantalla**

Replace `web/src/screens/PantallaEntrevista/PantallaEntrevista.tsx`:

```tsx
import { useState } from 'react';
import { Stack, Box } from '@mui/material';
import { AppShell } from '../../components/templates/AppShell/AppShell';
import { PasoAPaso } from '../../components/molecules/PasoAPaso/PasoAPaso';
import { BurbujaChat } from '../../components/molecules/BurbujaChat/BurbujaChat';
import { Pensando } from '../../components/molecules/BurbujaChat/Pensando';
import { SelloElegibilidad } from '../../components/molecules/SelloElegibilidad/SelloElegibilidad';
import { Alerta } from '../../components/molecules/Alerta/Alerta';
import { CampoTexto } from '../../components/atoms/CampoTexto/CampoTexto';
import { Boton } from '../../components/atoms/Boton/Boton';
import { useSesion } from '../../state/SesionContext';
import { mapEstado } from '../../lib/estado';
import { PERFIL_DEMO } from '../../lib/perfilDemo';
import { GRUPOS_ENTREVISTA, pasoActivo } from './pasos';

const LIMITE_MENSAJE = 2000;

/**
 * Segunda de las cinco pantallas: la conversación donde se recogen los datos. Bloquea mensajes
 * inválidos antes de llamar al backend y ofrece el modo demo si el asistente falla.
 */
export function PantallaEntrevista() {
  const { transcript, eventos, perfil, cargando, error, enviarTurno, activarDemo } = useSesion();
  const [borrador, setBorrador] = useState('');

  const mensajeValido = borrador.trim().length > 0 && borrador.length <= LIMITE_MENSAJE;

  const enviar = () => {
    if (!mensajeValido || cargando) return;
    const texto = borrador;
    setBorrador('');
    void enviarTurno(texto);
  };

  return (
    <AppShell titulo="Hablemos" destino="hablar">
      <Stack spacing={3}>
        <PasoAPaso pasos={GRUPOS_ENTREVISTA.map((g) => g.etiqueta)} activo={pasoActivo(perfil)} />

        <Stack spacing={2}>
          {transcript.map((turno) => (
            <BurbujaChat
              key={turno.id}
              autor={turno.autor}
              escuchable={turno.autor === 'agente'}
              dictado={turno.dictado}
            >
              {turno.texto}
            </BurbujaChat>
          ))}
          {eventos.map((evento) => (
            <SelloElegibilidad key={evento.id} estado={mapEstado(evento.estado)} programa={evento.programa} />
          ))}
          {cargando && <Pensando>Revisando tu respuesta</Pensando>}
        </Stack>

        {error && (
          <Alerta
            severity={error.codigo === 'limite_mensajes' ? 'warning' : 'error'}
            accion={error.codigo === 'asistente_no_disponible' ? 'Probar modo demo' : undefined}
            onAccion={() => activarDemo(PERFIL_DEMO)}
          >
            {error.mensaje ?? 'Algo no funcionó. Intenta de nuevo en un momento.'}
          </Alerta>
        )}

        <Box sx={{ position: 'sticky', bottom: 'var(--size-touch)', backgroundColor: 'var(--surface-raised)', pt: 2 }}>
          <Stack direction="row" spacing={1} alignItems="flex-end">
            <Box sx={{ flex: 1 }}>
              <CampoTexto
                pregunta="Escribe tu respuesta"
                value={borrador}
                onChange={(e) => setBorrador(e.target.value)}
                dictado
                error={borrador.length > LIMITE_MENSAJE ? `Máximo ${LIMITE_MENSAJE} caracteres.` : undefined}
              />
            </Box>
            <Boton onClick={enviar} loading={cargando} disabled={!mensajeValido}>
              Enviar
            </Boton>
          </Stack>
        </Box>
      </Stack>
    </AppShell>
  );
}
```

- [ ] **Step 11: Ejecutar y verificar que pasa**

Run: `npm run test -w web`
Expected: PASS.

- [ ] **Step 12: Captura de verificación visual**

Run: `node web/e2e/capturar.mjs /hablar 28-pantallaentrevista`
Expected: PNG generado (contra el servidor de desarrollo; sin backend real desplegado, la pantalla muestra el estado inicial — sin turnos ni error — lo cual es correcto de verificar: cabecera azul, `PasoAPaso` en "Paso 1 de 5", el campo de mensaje fijo al pie con su botón de micrófono, y "Enviar" deshabilitado).

- [ ] **Step 13: Commit**

```bash
git add web/src/screens/PantallaEntrevista web/src/lib/perfilDemo.ts web/src/lib/perfilDemo.test.ts
git commit -m "feat(web): pantalla PantallaEntrevista con chat real y modo demo"
```

---

### Task 29: Pantalla `PantallaResultado`

Cubre el punto 5 de Review Focus: agrupa y ordena `elegible → falta_dato → no_elegible` para cualquier combinación, no solo el caso feliz. También corrige una calidad de dato del backend sin tocarlo: `regla.fuente` de `backend/src/rules-engine/*.ts` es una ruta de archivo interna del repo (`"docs/programas-subsidio.md, sección DS49"`), no una cita presentable — la pantalla solo muestra `regla.decreto` y `regla.fechaConsulta`, nunca `regla.fuente`.

**Files:**
- Create: `web/src/lib/fecha.ts`
- Test: `web/src/lib/fecha.test.ts`
- Modify: `web/src/screens/PantallaResultado/PantallaResultado.tsx`
- Test: `web/src/screens/PantallaResultado/PantallaResultado.test.tsx`

**Interfaces:**
- Consumes: `AppShell` (Task 26), `BloqueHero` (Task 20), `TarjetaPrograma` (Task 21), `useSesion` (Task 25), `mapEstado` (Task 9).
- Produces: `formatoFechaCorta(iso: string): string` desde `web/src/lib/fecha.ts` (formato «22 sep 2026»).

- [ ] **Step 1: Test del formateador de fecha (falla primero)**

Create `web/src/lib/fecha.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { formatoFechaCorta } from './fecha';

describe('formatoFechaCorta', () => {
  it('formatea una fecha ISO al formato corto de tarjeta del design system', () => {
    expect(formatoFechaCorta('2026-09-22')).toBe('22 sep 2026');
  });

  it('con un texto que no es una fecha ISO, lo devuelve tal cual en vez de romper', () => {
    expect(formatoFechaCorta('sin fecha')).toBe('sin fecha');
  });
});
```

- [ ] **Step 2: Ejecutar y verificar que falla**

Run: `npm run test -w web`
Expected: FAIL — `./fecha` no existe.

- [ ] **Step 3: Implementar**

Create `web/src/lib/fecha.ts`:

```ts
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/** 'YYYY-MM-DD' → '22 sep 2026', el formato corto de tarjeta que usa el design system. */
export function formatoFechaCorta(iso: string): string {
  const [anio, mes, dia] = iso.split('-').map(Number);
  if (!anio || !mes || !dia) return iso;
  return `${dia} ${MESES[mes - 1]} ${anio}`;
}
```

- [ ] **Step 4: Ejecutar y verificar que pasa**

Run: `npm run test -w web`
Expected: PASS.

- [ ] **Step 5: Test de la pantalla (falla primero)**

Create `web/src/screens/PantallaResultado/PantallaResultado.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { PantallaResultado } from './PantallaResultado';
import { PERFIL_DESCONOCIDO, type ResultadoPrograma } from '../../types/dominio';
import * as SesionContextModulo from '../../state/SesionContext';

const REGLA = {
  decreto: 'D.S. N°49 (V. y U.) de 2011',
  fuente: 'docs/programas-subsidio.md, sección DS49',
  fechaConsulta: '2026-09-22',
};

function mockSesion(resultados: ResultadoPrograma[]) {
  vi.spyOn(SesionContextModulo, 'useSesion').mockReturnValue({
    sessionId: 'sesion-test',
    transcript: [],
    eventos: [],
    perfil: PERFIL_DESCONOCIDO,
    resultados,
    plan: [],
    documentosListos: {},
    seguimiento: { etapa: 'papeles' },
    esDemo: false,
    cargando: false,
    error: undefined,
    enviarTurno: vi.fn(),
    activarDemo: vi.fn(),
    marcarDocumento: vi.fn(),
    marcarEtapa: vi.fn(),
    guardarFolio: vi.fn(),
    borrarDatos: vi.fn(),
  });
}

function renderPantalla() {
  return render(
    <MemoryRouter initialEntries={['/resultado']}>
      <Routes>
        <Route path="/resultado" element={<PantallaResultado />} />
        <Route path="/plan/:programa" element={<div>pantalla plan</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('PantallaResultado', () => {
  it('ordena elegible, luego falta_dato, luego no_elegible, sin importar el orden de llegada', () => {
    mockSesion([
      { programa: 'DS52', estado: 'no_elegible', motivo: 'Ya tienes vivienda propia.', regla: REGLA },
      { programa: 'DS1', estado: 'elegible', motivo: 'Cumples los requisitos.', regla: REGLA },
      {
        programa: 'DS19',
        estado: 'falta_dato',
        motivo: 'Falta tu subsidio previo.',
        regla: REGLA,
        camposFaltantes: ['subsidioPrevio'],
      },
      { programa: 'DS49', estado: 'elegible', motivo: 'Cumples los requisitos.', regla: REGLA },
    ]);
    renderPantalla();
    const titulos = screen.getAllByText(/^DS\d+ —/).map((el) => el.textContent);
    expect(titulos).toEqual([
      'DS1 — Sectores medios',
      'DS49 — Casa propia sin crédito',
      'DS19 — Integración social',
      'DS52 — Arriendo',
    ]);
  });

  it('sin resultados, invita a volver a la entrevista en vez de mostrar una lista vacía muda', () => {
    mockSesion([]);
    renderPantalla();
    expect(screen.getByText(/Todavía no tenemos datos suficientes/)).toBeInTheDocument();
  });

  it('muestra el decreto y la fecha, nunca la ruta de archivo interna de "fuente"', () => {
    mockSesion([{ programa: 'DS49', estado: 'elegible', motivo: 'Cumples.', regla: REGLA }]);
    renderPantalla();
    expect(screen.getByText('Fuente: D.S. N°49 (V. y U.) de 2011 · 22 sep 2026')).toBeInTheDocument();
    expect(screen.queryByText(/programas-subsidio\.md/)).not.toBeInTheDocument();
  });

  it('la acción de un programa elegible lleva a su plan', async () => {
    mockSesion([{ programa: 'DS49', estado: 'elegible', motivo: 'Cumples.', regla: REGLA }]);
    renderPantalla();
    await userEvent.click(screen.getByRole('button', { name: 'Ver los documentos' }));
    expect(await screen.findByText('pantalla plan')).toBeInTheDocument();
  });
});
```

- [ ] **Step 6: Ejecutar y verificar que falla**

Run: `npm run test -w web`
Expected: FAIL — el placeholder de Task 26 no tiene la lista de resultados.

- [ ] **Step 7: Implementar la pantalla**

Replace `web/src/screens/PantallaResultado/PantallaResultado.tsx`:

```tsx
import { Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../../components/templates/AppShell/AppShell';
import { BloqueHero } from '../../components/organisms/BloqueHero/BloqueHero';
import { TarjetaPrograma } from '../../components/organisms/TarjetaPrograma/TarjetaPrograma';
import { useSesion } from '../../state/SesionContext';
import { mapEstado } from '../../lib/estado';
import { formatoFechaCorta } from '../../lib/fecha';
import type { EstadoElegibilidad as EstadoBackend, Programa } from '../../types/dominio';

const NOMBRE_COMUN: Record<Programa, string> = {
  DS49: 'Casa propia sin crédito',
  DS1: 'Sectores medios',
  DS19: 'Integración social',
  DS52: 'Arriendo',
};

const ORDEN_ESTADO: EstadoBackend[] = ['elegible', 'falta_dato', 'no_elegible'];

/**
 * Tercera pantalla: todos los programas evaluados en una lista, cada uno con su sello, su razón
 * y su regla citada. Muestra los cuatro, no solo los que califican — saber por qué algo no
 * aplica es parte de entender el laberinto.
 */
export function PantallaResultado() {
  const navigate = useNavigate();
  const { perfil, resultados } = useSesion();

  const ordenados = [...resultados].sort(
    (a, b) => ORDEN_ESTADO.indexOf(a.estado) - ORDEN_ESTADO.indexOf(b.estado),
  );
  const calificaCount = resultados.filter((r) => r.estado === 'elegible').length;
  const personas =
    perfil.integrantesGrupoFamiliar !== 'desconocido' ? perfil.integrantesGrupoFamiliar.length + 1 : undefined;

  return (
    <AppShell titulo="Tu resultado" destino="plan" atras>
      <Stack spacing={3}>
        <BloqueHero
          titulo={
            calificaCount > 0
              ? `Calificas para ${calificaCount} programa${calificaCount > 1 ? 's' : ''}`
              : 'Revisamos tus cuatro programas'
          }
          bajada={personas ? `${personas} personas` : undefined}
        />

        {resultados.length === 0 && (
          <Typography sx={{ fontFamily: 'var(--font-sans)', color: 'var(--ink-muted)' }}>
            Todavía no tenemos datos suficientes. Vuelve a la entrevista para seguir contándonos.
          </Typography>
        )}

        {ordenados.map((r) => (
          <TarjetaPrograma
            key={r.programa}
            sigla={r.programa}
            nombreComun={NOMBRE_COMUN[r.programa]}
            estado={mapEstado(r.estado)}
            razon={r.motivo}
            regla={`${r.regla.decreto} · ${formatoFechaCorta(r.regla.fechaConsulta)}`}
            accion={
              r.estado === 'elegible'
                ? 'Ver los documentos'
                : r.estado === 'falta_dato'
                  ? 'Ver cómo alcanzarlo'
                  : undefined
            }
            onAccion={() => navigate(`/plan/${r.programa}`)}
          />
        ))}
      </Stack>
    </AppShell>
  );
}
```

- [ ] **Step 8: Ejecutar y verificar que pasa**

Run: `npm run test -w web`
Expected: PASS.

- [ ] **Step 9: Captura de verificación visual**

Run: `node web/e2e/capturar.mjs /resultado 29-pantallaresultado`
Expected: PNG generado (sin sesión previa, se ve la invitación a volver a la entrevista — correcto de verificar en este punto).

- [ ] **Step 10: Commit**

```bash
git add web/src/lib/fecha.ts web/src/lib/fecha.test.ts web/src/screens/PantallaResultado
git commit -m "feat(web): pantalla PantallaResultado con orden correcto para cualquier combinacion de estados"
```

---

### Task 30: Pantalla `PantallaPlan`

Los cuatro pasos fijos del design system, adaptados a lo que el backend realmente entrega: paso 1 cita `resultado.motivo` y `resultado.regla` (sin `TarjetaPorQue`, que no tiene datos reales — ver Task 24); paso 2 usa `ChecklistDocumentos` mapeando `PlanPrograma.documentos` (`nombre`/`detalle?`) a `nombreComun`/`donde`, con el estado de cada casilla guardado en el contexto de sesión; paso 3 usa `LineaDeLlamados` con el texto de repliegue («Sin fecha publicada») porque no existe ninguna fecha real de llamado; paso 4 muestra `AvisoLimite` con salida y un botón interno (no un enlace externo) para pasar al seguimiento.

**Files:**
- Modify: `web/src/screens/PantallaPlan/PantallaPlan.tsx`
- Test: `web/src/screens/PantallaPlan/PantallaPlan.test.tsx`

**Interfaces:**
- Consumes: `AppShell` (Task 26), `ChecklistDocumentos` (Task 22), `LineaDeLlamados` (Task 23), `AvisoLimite` (Task 12), `Alerta` (Task 11), `Boton` (Task 6), `useSesion` (Task 25), `formatoFechaCorta` (Task 29).

- [ ] **Step 1: Test (falla primero)**

Create `web/src/screens/PantallaPlan/PantallaPlan.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { PantallaPlan } from './PantallaPlan';
import { PERFIL_DESCONOCIDO } from '../../types/dominio';
import * as SesionContextModulo from '../../state/SesionContext';

const REGLA = {
  decreto: 'D.S. N°49 (V. y U.) de 2011',
  fuente: 'docs/programas-subsidio.md, sección DS49',
  fechaConsulta: '2026-09-22',
};

function mockSesion(overrides: Partial<ReturnType<typeof SesionContextModulo.useSesion>> = {}) {
  const marcarDocumento = vi.fn();
  vi.spyOn(SesionContextModulo, 'useSesion').mockReturnValue({
    sessionId: 'sesion-test',
    transcript: [],
    eventos: [],
    perfil: PERFIL_DESCONOCIDO,
    resultados: [],
    plan: [],
    documentosListos: {},
    seguimiento: { etapa: 'papeles' },
    esDemo: false,
    cargando: false,
    error: undefined,
    enviarTurno: vi.fn(),
    activarDemo: vi.fn(),
    marcarDocumento,
    marcarEtapa: vi.fn(),
    guardarFolio: vi.fn(),
    borrarDatos: vi.fn(),
    ...overrides,
  });
  return { marcarDocumento };
}

function renderPantalla(ruta: string) {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <Routes>
        <Route path="/plan/:programa" element={<PantallaPlan />} />
        <Route path="/avisos" element={<div>pantalla avisos</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('PantallaPlan', () => {
  it('con un programa que no existe en la URL, avisa en vez de romper', () => {
    mockSesion();
    renderPantalla('/plan/DS99');
    expect(screen.getByText('No reconocemos ese programa. Vuelve a tu resultado.')).toBeInTheDocument();
  });

  it('paso 1 cita la regla real del motor, nunca un texto inventado', () => {
    mockSesion({
      resultados: [{ programa: 'DS49', estado: 'elegible', motivo: 'Cumples los requisitos.', regla: REGLA }],
    });
    renderPantalla('/plan/DS49');
    expect(screen.getByText(/Cumples los requisitos\./)).toBeInTheDocument();
    expect(screen.getByText(/D\.S\. N°49 \(V\. y U\.\) de 2011/)).toBeInTheDocument();
  });

  it('paso 2 lista los documentos del plan y marca la casilla con la clave correcta', async () => {
    const { marcarDocumento } = mockSesion({
      resultados: [{ programa: 'DS49', estado: 'elegible', motivo: 'Cumples.', regla: REGLA }],
      plan: [
        {
          programa: 'DS49',
          documentos: [{ nombre: 'Tu cédula', detalle: 'Cédula vigente' }],
          fuente: 'Formularios oficiales DS49',
        },
      ],
    });
    renderPantalla('/plan/DS49');
    await userEvent.click(screen.getByRole('checkbox', { name: 'Tu cédula' }));
    expect(marcarDocumento).toHaveBeenCalledWith('DS49:Tu cédula', true);
  });

  it('paso 3 nunca inventa una fecha de llamado: usa el texto de repliegue del design system', () => {
    mockSesion({ resultados: [{ programa: 'DS49', estado: 'elegible', motivo: 'Cumples.', regla: REGLA }] });
    renderPantalla('/plan/DS49');
    expect(screen.getByText('Sin fecha publicada · Por confirmar con tu Serviu regional')).toBeInTheDocument();
  });

  it('paso 4 muestra el enlace de salida y deja marcar que ya postuló', async () => {
    mockSesion({ resultados: [{ programa: 'DS49', estado: 'elegible', motivo: 'Cumples.', regla: REGLA }] });
    renderPantalla('/plan/DS49');
    expect(screen.getByRole('link', { name: /postulacionenlinea\.minvu\.cl/ })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Ya postulé' }));
    expect(await screen.findByText('pantalla avisos')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Ejecutar y verificar que falla**

Run: `npm run test -w web`
Expected: FAIL — el placeholder de Task 26 no tiene los cuatro pasos.

- [ ] **Step 3: Implementar**

Replace `web/src/screens/PantallaPlan/PantallaPlan.tsx`:

```tsx
import { useParams, useNavigate } from 'react-router-dom';
import { Stack, Typography } from '@mui/material';
import { AppShell } from '../../components/templates/AppShell/AppShell';
import {
  ChecklistDocumentos,
  type DocumentoChecklist,
} from '../../components/organisms/ChecklistDocumentos/ChecklistDocumentos';
import { LineaDeLlamados } from '../../components/organisms/LineaDeLlamados/LineaDeLlamados';
import { AvisoLimite } from '../../components/molecules/AvisoLimite/AvisoLimite';
import { Alerta } from '../../components/molecules/Alerta/Alerta';
import { Boton } from '../../components/atoms/Boton/Boton';
import { useSesion } from '../../state/SesionContext';
import { formatoFechaCorta } from '../../lib/fecha';
import type { Programa } from '../../types/dominio';

const NOMBRE_COMUN: Record<Programa, string> = {
  DS49: 'Casa propia sin crédito',
  DS1: 'Sectores medios',
  DS19: 'Integración social',
  DS52: 'Arriendo',
};

const PROGRAMAS_VALIDOS: Programa[] = ['DS49', 'DS1', 'DS19', 'DS52'];
const esPrograma = (p: string | undefined): p is Programa => PROGRAMAS_VALIDOS.includes(p as Programa);

const ESTILO_TITULO_PASO = {
  fontFamily: 'var(--font-display)',
  fontWeight: 700,
  fontSize: '24px',
  lineHeight: '30px',
  color: 'var(--ink-strong)',
} as const;

/**
 * Cuarta pantalla: el plan de un programa en cuatro pasos numerados, siempre los mismos. El
 * cuarto es siempre salir al sitio del MINVU.
 */
export function PantallaPlan() {
  const { programa } = useParams<{ programa: string }>();
  const navigate = useNavigate();
  const { resultados, plan, documentosListos, marcarDocumento } = useSesion();

  if (!esPrograma(programa)) {
    return (
      <AppShell titulo="Tu plan" destino="plan" atras>
        <Typography sx={{ fontFamily: 'var(--font-sans)', color: 'var(--ink-muted)' }}>
          No reconocemos ese programa. Vuelve a tu resultado.
        </Typography>
      </AppShell>
    );
  }

  const resultado = resultados.find((r) => r.programa === programa);
  const planPrograma = plan.find((p) => p.programa === programa);

  const items: DocumentoChecklist[] = (planPrograma?.documentos ?? []).map((d) => ({
    nombre: d.nombre,
    donde: d.detalle,
    listo: Boolean(documentosListos[`${programa}:${d.nombre}`]),
  }));

  return (
    <AppShell titulo={`Tu plan · ${programa}`} destino="plan" atras>
      <Stack spacing={5}>
        <Stack spacing={1}>
          <Typography sx={ESTILO_TITULO_PASO}>1. Revisa por qué calificas</Typography>
          {resultado ? (
            <Alerta severity="success">
              {resultado.motivo} — Fuente: {resultado.regla.decreto} · {formatoFechaCorta(resultado.regla.fechaConsulta)}
            </Alerta>
          ) : (
            <Typography sx={{ color: 'var(--ink-muted)' }}>Todavía no evaluamos este programa.</Typography>
          )}
        </Stack>

        <Stack spacing={1}>
          <Typography sx={ESTILO_TITULO_PASO}>2. Reúne tus documentos</Typography>
          {items.length > 0 ? (
            <ChecklistDocumentos
              programa={`${programa} — ${NOMBRE_COMUN[programa]}`}
              items={items}
              onToggle={(indice) => marcarDocumento(`${programa}:${items[indice].nombre}`, !items[indice].listo)}
            />
          ) : (
            <Typography sx={{ color: 'var(--ink-muted)' }}>
              Calificas primero para ver tu lista de documentos.
            </Typography>
          )}
        </Stack>

        <Stack spacing={1}>
          <Typography sx={ESTILO_TITULO_PASO}>3. Guarda la fecha del llamado</Typography>
          <LineaDeLlamados
            llamados={[
              {
                programa: `${programa} — ${NOMBRE_COMUN[programa]}`,
                fechas: 'Sin fecha publicada',
                serviu: 'Por confirmar con tu Serviu regional',
                estado: 'porVenir',
                porConfirmar: true,
              },
            ]}
          />
        </Stack>

        <Stack spacing={2}>
          <Typography sx={ESTILO_TITULO_PASO}>4. Postula en el sitio del MINVU</Typography>
          <AvisoLimite conSalida />
          <Boton variant="outlined" onClick={() => navigate('/avisos')}>
            Ya postulé
          </Boton>
        </Stack>
      </Stack>
    </AppShell>
  );
}
```

- [ ] **Step 4: Ejecutar y verificar que pasa**

Run: `npm run test -w web`
Expected: PASS.

- [ ] **Step 5: Captura de verificación visual**

Run: `node web/e2e/capturar.mjs /plan/DS49 30-pantallaplan`
Expected: PNG generado (sin sesión previa, el paso 1 y 2 muestran su mensaje de "todavía no" — correcto de verificar aquí; el paso 3 y 4 sí se ven completos porque no dependen de datos de sesión).

- [ ] **Step 6: Commit**

```bash
git add web/src/screens/PantallaPlan
git commit -m "feat(web): pantalla PantallaPlan con los cuatro pasos fijos"
```

---

### Task 31: Pantallas `PantallaSeguimiento` (Avisos) y `PantallaDocumentos`

Cierra el mapeo de los 4 destinos de `BarraInferior` (Task 19): `avisos` → `PantallaSeguimiento`, `documentos` → `PantallaDocumentos` (el checklist agregado de todos los programas donde la persona califica). Ambas comparten la misma clave de documento (`"<programa>:<nombre>"`) que `PantallaPlan` (Task 30), así que marcar un documento en una pantalla se refleja en la otra.

**Files:**
- Modify: `web/src/screens/PantallaSeguimiento/PantallaSeguimiento.tsx`
- Test: `web/src/screens/PantallaSeguimiento/PantallaSeguimiento.test.tsx`
- Modify: `web/src/screens/PantallaDocumentos/PantallaDocumentos.tsx`
- Test: `web/src/screens/PantallaDocumentos/PantallaDocumentos.test.tsx`

**Interfaces:**
- Consumes: `AppShell` (Task 26), `OpcionTarjeta` (Task 10), `CampoTexto` (Task 8), `Boton` (Task 6), `ChecklistDocumentos` (Task 22), `useSesion` (Task 25), `formatoFechaCorta` (Task 29).

- [ ] **Step 1: Test de `PantallaSeguimiento` (falla primero)**

Create `web/src/screens/PantallaSeguimiento/PantallaSeguimiento.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { PantallaSeguimiento } from './PantallaSeguimiento';
import { PERFIL_DESCONOCIDO } from '../../types/dominio';
import * as SesionContextModulo from '../../state/SesionContext';

function mockSesion(overrides: Partial<ReturnType<typeof SesionContextModulo.useSesion>> = {}) {
  const marcarEtapa = vi.fn();
  const guardarFolio = vi.fn();
  vi.spyOn(SesionContextModulo, 'useSesion').mockReturnValue({
    sessionId: 'sesion-test',
    transcript: [],
    eventos: [],
    perfil: PERFIL_DESCONOCIDO,
    resultados: [],
    plan: [],
    documentosListos: {},
    seguimiento: { etapa: 'papeles' },
    esDemo: false,
    cargando: false,
    error: undefined,
    enviarTurno: vi.fn(),
    activarDemo: vi.fn(),
    marcarDocumento: vi.fn(),
    marcarEtapa,
    guardarFolio,
    borrarDatos: vi.fn(),
    ...overrides,
  });
  return { marcarEtapa, guardarFolio };
}

function renderPantalla() {
  return render(
    <MemoryRouter initialEntries={['/avisos']}>
      <PantallaSeguimiento />
    </MemoryRouter>,
  );
}

describe('PantallaSeguimiento', () => {
  it('sin fecha real de llamado, dice "Sin fecha publicada" en vez de inventar una', () => {
    mockSesion();
    renderPantalla();
    expect(screen.getByText('Sin fecha publicada')).toBeInTheDocument();
    expect(screen.getByText(/Fecha prevista/)).toBeInTheDocument();
  });

  it('elegir una etapa llama a marcarEtapa', async () => {
    const { marcarEtapa } = mockSesion();
    renderPantalla();
    await userEvent.click(screen.getByText('Postulé'));
    expect(marcarEtapa).toHaveBeenCalledWith('postule');
  });

  it('en la etapa "papeles" no pide folio todavía', () => {
    mockSesion({ seguimiento: { etapa: 'papeles' } });
    renderPantalla();
    expect(screen.queryByLabelText('¿Cuál es tu número de folio?')).not.toBeInTheDocument();
  });

  it('tras postular, pide el folio y lo guarda', async () => {
    const { guardarFolio } = mockSesion({ seguimiento: { etapa: 'postule' } });
    renderPantalla();
    await userEvent.type(screen.getByLabelText('¿Cuál es tu número de folio?'), '12345');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar folio' }));
    expect(guardarFolio).toHaveBeenCalledWith('12345');
  });

  it('dice que el estado no se consulta solo', () => {
    mockSesion();
    renderPantalla();
    expect(screen.getByText(/El estado no se consulta solo/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Ejecutar y verificar que falla**

Run: `npm run test -w web`
Expected: FAIL — el placeholder de Task 26 no tiene el seguimiento real.

- [ ] **Step 3: Implementar `PantallaSeguimiento`**

Replace `web/src/screens/PantallaSeguimiento/PantallaSeguimiento.tsx`:

```tsx
import { useState } from 'react';
import { Stack, Typography, Box } from '@mui/material';
import { AppShell } from '../../components/templates/AppShell/AppShell';
import { OpcionTarjeta } from '../../components/molecules/OpcionTarjeta/OpcionTarjeta';
import { CampoTexto } from '../../components/atoms/CampoTexto/CampoTexto';
import { Boton } from '../../components/atoms/Boton/Boton';
import { useSesion } from '../../state/SesionContext';
import { formatoFechaCorta } from '../../lib/fecha';

const ETAPAS = [
  { value: 'papeles', titulo: 'Reuniendo documentos', detalle: 'Todavía estás juntando tus papeles.' },
  { value: 'postule', titulo: 'Postulé', detalle: 'Ya entregaste tu postulación en el sitio del MINVU.' },
  { value: 'evaluacion', titulo: 'En evaluación', detalle: 'El Serviu está revisando tu postulación.' },
  { value: 'resultado', titulo: 'Resultado publicado', detalle: 'Ya salió el resultado de tu postulación.' },
];

/**
 * Quinta pantalla: el próximo llamado y la etapa en que está la persona. No hay consulta
 * automática de estado — la persona marca la etapa y la app se lo recuerda.
 */
export function PantallaSeguimiento() {
  const { resultados, seguimiento, marcarEtapa, guardarFolio } = useSesion();
  const [folioBorrador, setFolioBorrador] = useState(seguimiento.folio ?? '');

  const fechaReglas = resultados[0]?.regla.fechaConsulta;

  return (
    <AppShell titulo="Avisos" destino="avisos">
      <Stack spacing={4}>
        {fechaReglas && (
          <Typography sx={{ fontFamily: 'var(--font-sans)', fontSize: '14px', color: 'var(--ink-muted)' }}>
            Reglas al {formatoFechaCorta(fechaReglas)}
          </Typography>
        )}

        <Box sx={{ backgroundColor: 'var(--surface-brand-soft)', borderRadius: 'var(--radius-md)', p: 'var(--space-4)' }}>
          <Typography
            sx={{
              fontFamily: 'var(--font-sans)',
              fontSize: '13px',
              fontWeight: 600,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color: 'var(--ink-brand)',
            }}
          >
            Próximo llamado
          </Typography>
          <Typography
            sx={{
              fontFamily: 'var(--font-display)',
              fontWeight: 600,
              fontSize: '24px',
              lineHeight: '30px',
              color: 'var(--ink-brand)',
              mt: 0.5,
            }}
          >
            Sin fecha publicada
          </Typography>
          <Typography sx={{ fontFamily: 'var(--font-sans)', fontSize: '14px', color: 'var(--ink-brand)', mt: 0.5 }}>
            Fecha prevista. Te confirmamos cuando el Serviu la publique.
          </Typography>
        </Box>

        <Stack spacing={2}>
          <Typography sx={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '18px', color: 'var(--ink-strong)' }}>
            ¿En qué etapa estás?
          </Typography>
          <OpcionTarjeta
            name="etapa-seguimiento"
            value={seguimiento.etapa}
            onChange={(e) => marcarEtapa(e.target.value as typeof seguimiento.etapa)}
            opciones={ETAPAS}
          />
        </Stack>

        {seguimiento.etapa !== 'papeles' && (
          <Stack spacing={1.5}>
            <CampoTexto
              pregunta="¿Cuál es tu número de folio?"
              ayuda="Lo entrega el sitio del MINVU al terminar tu postulación."
              value={folioBorrador}
              onChange={(e) => setFolioBorrador(e.target.value)}
            />
            <Boton variant="outlined" onClick={() => guardarFolio(folioBorrador)} disabled={!folioBorrador.trim()}>
              Guardar folio
            </Boton>
          </Stack>
        )}

        <Typography sx={{ fontFamily: 'var(--font-sans)', fontSize: '14px', color: 'var(--ink-muted)' }}>
          El estado no se consulta solo: tú marcas la etapa y nosotros te recordamos lo que falta.
        </Typography>
      </Stack>
    </AppShell>
  );
}
```

- [ ] **Step 4: Ejecutar y verificar que `PantallaSeguimiento` pasa**

Run: `npm run test -w web`
Expected: PASS para los tests de `PantallaSeguimiento` (los de `PantallaDocumentos` siguen fallando — se implementa a continuación).

- [ ] **Step 5: Test de `PantallaDocumentos` (falla primero)**

Create `web/src/screens/PantallaDocumentos/PantallaDocumentos.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { PantallaDocumentos } from './PantallaDocumentos';
import { PERFIL_DESCONOCIDO } from '../../types/dominio';
import * as SesionContextModulo from '../../state/SesionContext';

function mockSesion(overrides: Partial<ReturnType<typeof SesionContextModulo.useSesion>> = {}) {
  const marcarDocumento = vi.fn();
  vi.spyOn(SesionContextModulo, 'useSesion').mockReturnValue({
    sessionId: 'sesion-test',
    transcript: [],
    eventos: [],
    perfil: PERFIL_DESCONOCIDO,
    resultados: [],
    plan: [],
    documentosListos: {},
    seguimiento: { etapa: 'papeles' },
    esDemo: false,
    cargando: false,
    error: undefined,
    enviarTurno: vi.fn(),
    activarDemo: vi.fn(),
    marcarDocumento,
    marcarEtapa: vi.fn(),
    guardarFolio: vi.fn(),
    borrarDatos: vi.fn(),
    ...overrides,
  });
  return { marcarDocumento };
}

function renderPantalla() {
  return render(
    <MemoryRouter initialEntries={['/documentos']}>
      <PantallaDocumentos />
    </MemoryRouter>,
  );
}

describe('PantallaDocumentos', () => {
  it('sin ningún programa elegible, invita a volver a la entrevista', () => {
    mockSesion();
    renderPantalla();
    expect(screen.getByText(/Todavía no calificas para ningún programa/)).toBeInTheDocument();
  });

  it('agrupa los documentos de cada programa elegible por separado', () => {
    mockSesion({
      plan: [
        { programa: 'DS49', documentos: [{ nombre: 'Tu cédula' }], fuente: 'x' },
        { programa: 'DS52', documentos: [{ nombre: 'Formulario A-01' }], fuente: 'y' },
      ],
    });
    renderPantalla();
    expect(screen.getByText('DS49 — Casa propia sin crédito')).toBeInTheDocument();
    expect(screen.getByText('DS52 — Arriendo')).toBeInTheDocument();
  });

  it('usa la misma clave de documento que PantallaPlan, para compartir el progreso entre pantallas', async () => {
    const { marcarDocumento } = mockSesion({
      plan: [{ programa: 'DS49', documentos: [{ nombre: 'Tu cédula' }], fuente: 'x' }],
    });
    renderPantalla();
    await userEvent.click(screen.getByRole('checkbox', { name: 'Tu cédula' }));
    expect(marcarDocumento).toHaveBeenCalledWith('DS49:Tu cédula', true);
  });
});
```

- [ ] **Step 6: Ejecutar y verificar que falla**

Run: `npm run test -w web`
Expected: FAIL — el placeholder de Task 26 no tiene el checklist agregado.

- [ ] **Step 7: Implementar `PantallaDocumentos`**

Replace `web/src/screens/PantallaDocumentos/PantallaDocumentos.tsx`:

```tsx
import { Stack, Typography } from '@mui/material';
import { AppShell } from '../../components/templates/AppShell/AppShell';
import {
  ChecklistDocumentos,
  type DocumentoChecklist,
} from '../../components/organisms/ChecklistDocumentos/ChecklistDocumentos';
import { useSesion } from '../../state/SesionContext';
import type { Programa } from '../../types/dominio';

const NOMBRE_COMUN: Record<Programa, string> = {
  DS49: 'Casa propia sin crédito',
  DS1: 'Sectores medios',
  DS19: 'Integración social',
  DS52: 'Arriendo',
};

/** Los documentos de todos los programas donde la persona califica, agrupados por programa. */
export function PantallaDocumentos() {
  const { plan, documentosListos, marcarDocumento } = useSesion();

  if (plan.length === 0) {
    return (
      <AppShell titulo="Tus documentos" destino="documentos">
        <Typography sx={{ fontFamily: 'var(--font-sans)', color: 'var(--ink-muted)' }}>
          Todavía no calificas para ningún programa. Vuelve a la entrevista para seguir contándonos.
        </Typography>
      </AppShell>
    );
  }

  return (
    <AppShell titulo="Tus documentos" destino="documentos">
      <Stack spacing={5}>
        {plan.map((p) => {
          const items: DocumentoChecklist[] = p.documentos.map((d) => ({
            nombre: d.nombre,
            donde: d.detalle,
            listo: Boolean(documentosListos[`${p.programa}:${d.nombre}`]),
          }));
          return (
            <ChecklistDocumentos
              key={p.programa}
              programa={`${p.programa} — ${NOMBRE_COMUN[p.programa]}`}
              items={items}
              onToggle={(indice) => marcarDocumento(`${p.programa}:${items[indice].nombre}`, !items[indice].listo)}
            />
          );
        })}
      </Stack>
    </AppShell>
  );
}
```

- [ ] **Step 8: Ejecutar y verificar que todo pasa**

Run: `npm run test -w web`
Expected: PASS.

- [ ] **Step 9: Capturas de verificación visual**

Run: `node web/e2e/capturar.mjs /avisos 31a-pantallaseguimiento` y `node web/e2e/capturar.mjs /documentos 31b-pantalladocumentos`
Expected: dos PNG generados. `/avisos` muestra "Sin fecha publicada" en el bloque azul suave y las cuatro tarjetas de etapa; `/documentos` muestra el mensaje de "todavía no calificas" (correcto sin sesión previa).

- [ ] **Step 10: Commit**

```bash
git add web/src/screens/PantallaSeguimiento web/src/screens/PantallaDocumentos
git commit -m "feat(web): pantallas PantallaSeguimiento y PantallaDocumentos"
```

---

### Task 32: Verificación end-to-end y build de producción

Sin un backend real corriendo en local, `POST /api/chat` no tiene a dónde ir bajo `npm run dev` (Vite no lo proxea a nada). Este task usa `page.route()` de Playwright para interceptar esa llamada con una respuesta de fixture realista — la misma técnica de "sustituir solo la red, nunca la interfaz" que usan los tests de pantalla desde Task 28 en adelante — y así recorrer el flujo completo con clics reales sobre la app real.

**Files:**
- Create: `web/e2e/flujo-demo.mjs`

**Interfaces:** Ninguna nueva — este task solo verifica lo construido.

- [ ] **Step 1: Ejecutar toda la suite de pruebas**

Run: `npm test` (desde la raíz del repo; corre `backend` y `web` por `--workspaces`)
Expected: PASS en ambos workspaces. Si algo falla, corrígelo antes de seguir — no se avanza con pruebas rotas.

- [ ] **Step 2: Escribir el script de flujo completo**

Create `web/e2e/flujo-demo.mjs`:

```js
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const base = process.env.BASE_URL ?? 'http://localhost:5173';
const carpeta = new URL('./capturas/', import.meta.url);
await mkdir(carpeta, { recursive: true });

const REGLA = (decreto) => ({ decreto, fuente: 'docs/programas-subsidio.md', fechaConsulta: '2026-09-22' });

const RESPUESTA_CHAT = {
  respuesta: 'Anotado. Calificas para DS49 y te falta un dato para DS1.',
  perfil: {
    postulanteEdad: 29,
    region: 'Metropolitana',
    zonaEspecial: 'ninguna',
    tramoRSH: 30,
    tienePropiedad: false,
    ahorroUF: 15,
    antiguedadCuentaAhorroMeses: 14,
    ingresoFamiliarMensualUF: 12.69,
    ingresoFamiliarMensualCLP: 520000,
    integrantesGrupoFamiliar: [{ edad: 31, discapacidadCertificada: false }],
    excepcionPostulacionIndividualDS49: false,
    subsidioPrevio: 'ninguno',
    objetivo: 'comprar',
  },
  resultados: [
    { programa: 'DS49', estado: 'elegible', motivo: 'Cumples los requisitos de DS49.', regla: REGLA('D.S. N°49 (V. y U.) de 2011') },
    {
      programa: 'DS1',
      estado: 'falta_dato',
      motivo: 'Faltan datos para evaluar DS1.',
      camposFaltantes: ['ingresoFamiliarMensualUF'],
      regla: REGLA('D.S. N°1 de 2011'),
    },
    { programa: 'DS19', estado: 'no_elegible', motivo: 'No cumple la ruta A ni B.', regla: REGLA('D.S. N°19 de 2016') },
    { programa: 'DS52', estado: 'no_elegible', motivo: 'Ingreso fuera de rango.', regla: REGLA('D.S. N°52 de 2013') },
  ],
  plan: [
    {
      programa: 'DS49',
      documentos: [{ nombre: 'Cédula de identidad vigente' }, { nombre: 'Cartola Hogar del RSH' }],
      fuente: 'Formularios oficiales DS49',
    },
  ],
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 360, height: 800 } });

await page.route('**/api/chat', (route) =>
  route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(RESPUESTA_CHAT) }),
);

async function capturar(nombre) {
  const destino = fileURLToPath(new URL(`./${nombre}.png`, carpeta));
  await page.screenshot({ path: destino, fullPage: true });
  console.log(`Guardado ${destino}`);
}

await page.goto(base + '/', { waitUntil: 'networkidle' });
await capturar('32a-bienvenida');

await page.getByRole('button', { name: 'Empezar' }).click();
await page.getByLabel('Escribe tu respuesta').fill('Somos 4 personas, no tenemos casa propia.');
await page.getByRole('button', { name: 'Enviar' }).click();
await page.waitForSelector('text=Anotado. Calificas para DS49');
await capturar('32b-entrevista-con-respuesta');

await page.getByRole('button', { name: /Mi plan/ }).click();
await page.waitForURL('**/resultado');
await capturar('32c-resultado');

await page.getByRole('button', { name: 'Ver los documentos' }).click();
await page.waitForURL('**/plan/DS49');
await capturar('32d-plan');

await page.getByRole('button', { name: /Documentos/ }).click();
await page.waitForURL('**/documentos');
await capturar('32e-documentos');

await page.getByRole('button', { name: /Avisos/ }).click();
await page.waitForURL('**/avisos');
await page.getByText('Postulé').click();
await capturar('32f-avisos');

await browser.close();
console.log('Flujo completo capturado en web/e2e/capturas/32*.png');
```

- [ ] **Step 3: Ejecutar el flujo completo**

Run: `node web/e2e/flujo-demo.mjs` (con `npm run dev -w web` todavía corriendo desde Task 4)
Expected: el script corre sin errores y deja 6 capturas `32a`…`32f` en `web/e2e/capturas/`.

- [ ] **Step 4: Revisar las 6 capturas una por una**

Abre cada PNG con la herramienta de lectura de archivos y verifica contra el design system:
- `32a`: bienvenida completa, sin campos de texto.
- `32b`: burbuja de la persona a la derecha, burbuja del agente a la izquierda con "Escuchar", y el sello `DS49 · Califica` apareciendo tras la respuesta (evento derivado del cambio de estado, no del texto del modelo).
- `32c`: `TarjetaPrograma` de los 4 programas, ordenados DS49 (califica) → DS1 (falta) → DS19/DS52 (no aplica).
- `32d`: los 4 pasos del plan de DS49, con el paso 1 citando la regla real y el paso 4 con el enlace a `postulacionenlinea.minvu.cl`.
- `32e`: el checklist de documentos de DS49.
- `32f`: "Postulé" seleccionado y el campo de folio visible.

Si algo no calza con el design system (color, espacio, copy), es un bug — vuelve a la task del componente responsable y corrígelo antes de seguir.

- [ ] **Step 5: Build de producción**

Run: `npm run build:web` (desde la raíz; corre `tsc --noEmit && vite build` dentro de `web`)
Expected: compila sin errores de tipos y genera `web/dist/`.

- [ ] **Step 6: Commit**

```bash
git add web/e2e/flujo-demo.mjs
git commit -m "test(web): script de verificacion end-to-end con Playwright"
```

- [ ] **Step 7: Avisar al usuario lo que queda fuera de este plan**

Al terminar, informa explícitamente estos puntos — no son bugs de esta implementación, son huecos reales entre el design system (pensado como sistema completo) y lo que el backend de este hackathon entrega hoy:

1. **`TarjetaPorQue` sin datos reales** (Task 24): el motor de reglas del backend necesitaría devolver un arreglo de sub-reglas evaluadas (con el dato de la persona) en vez de un solo `motivo`, para que el desglose regla-por-regla se pueda mostrar de verdad.
2. **Sin fechas de llamado reales** (Tasks 23, 30, 31): `ResultadoPrograma` no trae `apertura`/`cierre`/`serviu`. Toda la interfaz usa el texto de repliegue del propio design system («Sin fecha publicada») en vez de inventar una fecha.
3. **Dictado por voz sin Web Speech API real** (Task 8): `CampoTexto` muestra el botón de micrófono como afordancia visual (así lo define `index.d.ts` del design system), pero no reconoce voz — cablear eso es trabajo aparte.
4. **Sin la opción en inglés** que pide el spec técnico (`docs/superpowers/specs/2026-09-20-rumbo-a-casa-design.md`): este plan construyó solo la versión en español.
5. **Sin descarga `.ics`**: el spec la menciona como parte del plan de papeles, pero `backend/src/chat/papeles.ts` todavía no la genera — no hay nada que la interfaz pueda consumir todavía.
6. **`PasoAPaso` en `PantallaEntrevista` no permite volver a un paso ya contestado** (Task 13 lo construye con esa capacidad, vía `onActivarPaso`, pero Task 28 no la conecta): la entrevista es una conversación libre con el modelo, no un formulario por campos, así que "volver al paso 2" no tiene un mecanismo honesto sin que el backend soporte rebobinar la conversación. Hoy, para corregir un dato, la persona se lo vuelve a decir al agente en el chat.

---

## Cierre del plan

Con las 32 tareas completas, `web/` pasa de un esqueleto con un solo `fetch` a las cinco pantallas del flujo (`Bienvenida`, `Entrevista`, `Resultado`, `Plan`, `Seguimiento`) más `Documentos`, organizadas en atomic design (`atoms/molecules/organisms/templates` bajo `web/src/components/`, pantallas en `web/src/screens/`), con un tema MUI real construido desde los tokens del design system, conectadas a la API real del backend con manejo explícito de sus 4 códigos de error y un modo demo que reutiliza el motor de reglas real. La página `/catalogo` queda como una guía de estilo viva con los 25 componentes construidos.

