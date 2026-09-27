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
await capturar('33a-bienvenida');

await page.getByRole('button', { name: 'Empezar' }).click();
await page.getByLabel('Escribe tu respuesta').fill('Somos 4 personas, no tenemos casa propia.');
await page.getByRole('button', { name: 'Enviar' }).click();
await page.waitForSelector('text=Anotado. Calificas para DS49');
await capturar('33b-entrevista-con-respuesta');

await page.getByRole('button', { name: /Mi plan/ }).click();
await page.waitForURL('**/resultado');
await capturar('33c-resultado');

await page.getByRole('button', { name: 'Ver los documentos' }).click();
await page.waitForURL('**/plan/DS49');
await capturar('33d-plan');

await page.getByRole('button', { name: /Documentos/ }).click();
await page.waitForURL('**/documentos');
await capturar('33e-documentos');

await page.getByRole('button', { name: /Avisos/ }).click();
await page.waitForURL('**/avisos');
await page.getByText('Postulé').click();
await capturar('33f-avisos');

// Idioma: tocar EN debe cambiar el texto en vivo, sin recargar ni perder la ruta.
await page.getByRole('button', { name: 'English' }).click();
await page.waitForSelector('text=Alerts');
await capturar('33g-avisos-en-ingles');

// Escritorio (≥ 900 px): navegación en la cabecera, contenido a 1120 px, dos columnas, sin barra
// inferior ni scroll horizontal. El idioma se restablece a español (el paso anterior lo dejó en inglés).
await page.evaluate(() => window.localStorage.setItem('rumbo-idioma', 'es'));
await page.setViewportSize({ width: 1280, height: 800 });

async function verificarEscritorio(nombre) {
  const desborda = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  if (desborda) throw new Error(`Hay scroll horizontal a 1280 px en ${nombre}`);
  const barraInferior = await page.locator('.MuiBottomNavigation-root').count();
  if (barraInferior !== 0) throw new Error(`La barra inferior no debe verse en escritorio (${nombre})`);
}

const PANTALLAS_ESCRITORIO = [
  ['/', '34a-escritorio-bienvenida'],
  ['/hablar', '34b-escritorio-entrevista'],
  ['/resultado', '34c-escritorio-resultado'],
  ['/plan/DS49', '34d-escritorio-plan'],
  ['/documentos', '34e-escritorio-documentos'],
  ['/avisos', '34f-escritorio-avisos'],
];

for (const [ruta, nombre] of PANTALLAS_ESCRITORIO) {
  await page.goto(base + ruta, { waitUntil: 'networkidle' });
  if (ruta !== '/') await page.getByRole('navigation', { name: 'Navegación principal' }).waitFor();
  await verificarEscritorio(nombre);
  await capturar(nombre);
}

const fondo = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
if (fondo !== 'rgb(247, 245, 241)') throw new Error(`El fondo del body debe ser surface-base, es ${fondo}`);

// Móvil no cambia: a 400 px sigue la barra inferior y no hay scroll horizontal.
await page.setViewportSize({ width: 400, height: 800 });
await page.goto(base + '/resultado', { waitUntil: 'networkidle' });
await capturar('34g-movil-resultado');
if (await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)) {
  throw new Error('Hay scroll horizontal a 400 px');
}
if ((await page.locator('.MuiBottomNavigation-root').count()) !== 1) {
  throw new Error('En móvil debe seguir la barra inferior');
}

await browser.close();
console.log('Flujo completo capturado en web/e2e/capturas/33*.png y 34*.png');
