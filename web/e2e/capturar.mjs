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
