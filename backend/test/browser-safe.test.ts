import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// La interfaz importa `@rumbo/backend/rules-engine` y `@rumbo/backend/chat/papeles` y los compila
// para el navegador. Estos archivos no pueden depender de Node, de AWS ni de nada fuera de esas dos
// carpetas. Si este test falla, la interfaz de la persona deja de compilar.

const SRC = fileURLToPath(new URL('../src/', import.meta.url));

const archivosMotor = readdirSync(`${SRC}rules-engine`)
  .filter((f) => f.endsWith('.ts'))
  .map((f) => `rules-engine/${f}`);

const ARCHIVOS = [...archivosMotor, 'chat/papeles.ts'];

const importsDe = (ruta: string) =>
  [...readFileSync(`${SRC}${ruta}`, 'utf8').matchAll(/from\s+['"]([^'"]+)['"]/g)].map((m) => m[1]);

describe('archivos que importa la interfaz', () => {
  it('encuentra los archivos del motor', () => {
    expect(archivosMotor).toEqual(expect.arrayContaining(['rules-engine/mensajes.ts', 'rules-engine/tipos.ts']));
  });

  it.each(ARCHIVOS)('%s no importa Node ni AWS', (ruta) => {
    for (const origen of importsDe(ruta)) {
      expect(origen, `${ruta} importa ${origen}`).not.toMatch(
        /^(node:|@aws-sdk\/|aws-lambda$|fs$|path$|crypto$|os$|child_process$|util$|url$)/,
      );
    }
  });

  it.each(ARCHIVOS)('%s solo importa zod, el propio motor o relativos permitidos', (ruta) => {
    for (const origen of importsDe(ruta)) {
      if (!origen.startsWith('.')) {
        expect(origen, `${ruta} importa ${origen}`).toBe('zod');
      } else if (ruta.startsWith('rules-engine/')) {
        expect(origen, `${ruta} importa ${origen}`).toMatch(/^\.\//);
      } else {
        expect(origen, `${ruta} importa ${origen}`).toBe('../rules-engine/index');
      }
    }
  });
});
