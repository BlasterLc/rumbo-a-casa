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

// Responsivo: en un ancho de escritorio, la columna se centra sobre surface-sunken en vez de
// estirarse a todo el ancho — nunca un layout de escritorio nuevo.
await page.setViewportSize({ width: 1024, height: 800 });
await capturar('33h-avisos-ancho-escritorio');

await browser.close();
console.log('Flujo completo capturado en web/e2e/capturas/33*.png');
