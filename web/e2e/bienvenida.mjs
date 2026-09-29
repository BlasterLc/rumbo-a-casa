// Verifica la Bienvenida en un navegador real, en escritorio y en móvil: que estén las secciones,
// que el acordeón abra y cierre, que los botones lleven a donde dicen, que no haya scroll
// horizontal y que la cabecera use el logo real. Guarda capturas en e2e/capturas/.
//   npm run dev   (en otra terminal)   y luego   node e2e/bienvenida.mjs
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const base = process.env.BASE_URL ?? 'http://localhost:5173';
const carpeta = new URL('./capturas/', import.meta.url);
await mkdir(carpeta, { recursive: true });

let fallos = 0;
function comprobar(ok, mensaje) {
  console.log(`${ok ? 'OK   ' : 'FALLO'} ${mensaje}`);
  if (!ok) fallos += 1;
}

const browser = await chromium.launch();

for (const [nombre, viewport] of [
  ['escritorio', { width: 1280, height: 900 }],
  ['movil', { width: 390, height: 844 }],
]) {
  console.log(`\n== ${nombre} (${viewport.width}px) ==`);
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const errores = [];
  page.on('pageerror', (e) => errores.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errores.push(m.text()));
  await page.goto(base + '/', { waitUntil: 'networkidle' });

  comprobar(await page.getByRole('heading', { level: 1, name: /Averigua a qué subsidio/ }).isVisible(), 'el h1 con la promesa es visible');
  comprobar(await page.getByRole('img', { name: 'Rumbo a Casa' }).first().isVisible(), 'la cabecera muestra el logo real (símbolo)');
  comprobar(await page.getByRole('heading', { level: 2, name: 'Tú postulas. Nosotros te preparamos.' }).isVisible(), 'panel azul "Tú postulas"');
  comprobar(await page.getByRole('heading', { level: 3, name: 'Mira tu resultado' }).isVisible(), 'las tarjetas de pasos están');
  comprobar(await page.getByRole('heading', { level: 2, name: 'Cada quien hace su parte, sin sorpresas' }).isVisible(), 'sección "Cómo trabajamos contigo"');
  comprobar(await page.getByRole('heading', { level: 2, name: 'Lo que la gente nos pregunta' }).isVisible(), 'sección de preguntas frecuentes');
  comprobar(await page.getByRole('heading', { level: 2, name: '¿Vemos a qué puedes postular?' }).isVisible(), 'franja final');
  comprobar((await page.getByRole('button', { name: 'Empezar' }).count()) === 2, 'hay dos botones Empezar (hero y franja final)');

  // Sin scroll horizontal.
  const desborde = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  comprobar(desborde <= 0, `sin scroll horizontal (desborde ${desborde}px)`);

  // Acordeón.
  const pregunta = page.getByRole('button', { name: '¿Me piden mi Clave Única?' });
  await pregunta.scrollIntoViewIfNeeded();
  comprobar((await pregunta.getAttribute('aria-expanded')) === 'false', 'la pregunta empieza cerrada');
  await pregunta.click();
  await page.getByText(/Nunca\. Solo la usas tú/).waitFor({ state: 'visible' });
  comprobar((await pregunta.getAttribute('aria-expanded')) === 'true', 'al tocar la pregunta se abre la respuesta');
  await pregunta.click();
  await page.getByText(/Nunca\. Solo la usas tú/).waitFor({ state: 'hidden' });
  comprobar((await pregunta.getAttribute('aria-expanded')) === 'false', 'al volver a tocarla se cierra');

  // Idioma.
  await page.getByRole('button', { name: 'English' }).click();
  comprobar(await page.getByRole('heading', { level: 2, name: 'What people ask us' }).isVisible(), 'cambiar a inglés traduce las secciones nuevas');
  await page.getByRole('button', { name: 'Español' }).click();

  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: fileURLToPath(new URL(`./bienvenida-${nombre}.png`, carpeta)), fullPage: true });

  // El botón de la franja final lleva a la entrevista.
  await page.getByRole('button', { name: 'Empezar' }).last().click();
  await page.waitForURL('**/hablar');
  comprobar(page.url().endsWith('/hablar'), 'Empezar (franja final) lleva a /hablar');

  comprobar(errores.length === 0, `sin errores de consola${errores.length ? ': ' + errores.join(' | ') : ''}`);
  await context.close();
}

await browser.close();
console.log(fallos === 0 ? '\nTodo bien.' : `\n${fallos} comprobación(es) fallaron.`);
process.exit(fallos === 0 ? 0 : 1);
