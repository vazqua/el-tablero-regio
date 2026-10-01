import { expect, test, type Page } from '@playwright/test';
import type { Desarrollo } from '../src/types';
import { readFile } from 'node:fs/promises';
const datos = JSON.parse(await readFile(new URL('../src/data/desarrollos.json', import.meta.url), 'utf8')) as Desarrollo[];
const empresas = JSON.parse(await readFile(new URL('../src/data/desarrolladoras.json', import.meta.url), 'utf8'));

async function listo(page: Page) {
  await expect(page.locator('.calculation-state')).toHaveAttribute('data-calculating', 'false', { timeout: 30000 });
  await expect(page.locator('.mapa')).toHaveAttribute('data-rendered', 'true', { timeout: 30000 });
}
async function abrirRanking(page: Page) {
  if (test.info().project.name === 'movil') await page.getByRole('button', { name: 'Abrir La Corona y leyenda' }).click();
}
async function cerrarRanking(page: Page) {
  if (test.info().project.name === 'movil') await page.getByRole('button', { name: 'Cerrar La Corona' }).click();
}
async function pixelesColoreados(page: Page) {
  await page.waitForFunction(() => {
    const gl = document.querySelector('canvas')?.getContext('webgl2');
    if (!gl) return false;
    const w = gl.drawingBufferWidth, h = gl.drawingBufferHeight;
    const p = new Uint8Array(w * h * 4);
    gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, p);
    let color = 0;
    for (let i = 0; i < p.length; i += 4) if (Math.max(p[i], p[i + 1], p[i + 2]) - Math.min(p[i], p[i + 1], p[i + 2]) > 45) color++;
    return color > 1500;
  });
}
test('datos reales: tablero, ranking, leyenda, fichas y búsqueda', async ({ page }) => {
  const errores: string[] = [];
  page.on('pageerror', e => errores.push(e.message));
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await listo(page);
  await expect(page.locator('.development-marker')).toHaveCount(datos.length);
  await expect(page.getByRole('button', { name: 'Exportar JSON' })).toHaveCount(0);
  await pixelesColoreados(page);
  await page.screenshot({ path: 'test-results/mapa-' + test.info().project.name + '.png' });
  await abrirRanking(page);
  await expect(page.locator('.rank-row')).toHaveCount(empresas.length);
  const valores = (await page.locator('.rank-value').allTextContents()).map(v => parseFloat(v));
  const libre = parseFloat((await page.locator('.free-territory strong').textContent())!);
  expect(valores.reduce((a, b) => a + b, libre)).toBeCloseTo(100, 0);
  expect(valores).toEqual([...valores].sort((a, b) => b - a));
  await page.getByRole('tab', { name: 'Leyenda' }).click();
  await expect(page.locator('.legend-companies button')).toHaveCount(empresas.length);
  await expect(page.getByRole('tabpanel', { name: 'Leyenda del mapa' }).getByText('Frontera en disputa', { exact: true })).toBeVisible();
  await page.getByRole('tab', { name: 'La Corona' }).click();
  await page.locator('.rank-row').first().click();
  await expect(page.getByRole('complementary', { name: 'Ficha de la Casa' })).toBeVisible();
  await page.getByRole('button', { name: 'Cerrar detalle' }).click();
  await page.getByRole('textbox', { name: 'Buscar Bastión' }).fill(datos[0].nombre);
  await page.locator('.search-results button').first().click();
  await expect(page.getByRole('heading', { name: datos[0].nombre, exact: true })).toBeVisible();
  await page.screenshot({ path: 'test-results/detalle-' + test.info().project.name + '.png', animations: 'disabled' });
  const detalle = (await page.locator('.detail-sheet').boundingBox())!;
  const slider = (await page.locator('.influence-control').boundingBox())!;
  expect(detalle.x + detalle.width <= slider.x || slider.x + slider.width <= detalle.x || detalle.y + detalle.height <= slider.y).toBe(true);
  await page.locator('.company-link').click();
  await expect(page.getByRole('complementary', { name: 'Ficha de la Casa' })).toBeVisible();
  await page.locator('.developments-list button').first().click();
  await expect(page.getByRole('complementary', { name: 'Ficha del Bastión' })).toBeVisible();
  await page.getByRole('button', { name: 'Cerrar detalle' }).click();
  await page.getByRole('button', { name: 'Vista metropolitana' }).click();
  await page.getByRole('button', { name: 'Ocultar Bastiones' }).click();
  await expect(page.locator('.development-marker:visible')).toHaveCount(0);
  await page.getByRole('button', { name: 'Mostrar Bastiones' }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errores).toEqual([]);
});

test('alcance en vivo: extremos, cambios rápidos y porcentajes actualizados', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await listo(page);
  await abrirRanking(page);
  const inicial = await page.locator('.free-territory strong').textContent();
  await cerrarRanking(page);
  const slider = page.getByRole('slider', { name: 'ALCANCE DE INFLUENCIA' });
  await slider.fill('0.5');
  await expect(page.locator('.calculation-state')).toHaveAttribute('data-factor', '0.5', { timeout: 30000 });
  await abrirRanking(page);
  const reducido = parseFloat((await page.locator('.free-territory strong').textContent())!);
  expect(reducido).toBeGreaterThan(parseFloat(inicial!));
  await cerrarRanking(page);
  for (const factor of ['1.25', '1.75', '2.5']) await slider.fill(factor);
  await expect(page.locator('.calculation-state')).toHaveAttribute('data-factor', '2.5', { timeout: 30000 });
  await expect(page.locator('.calculation-state')).toHaveAttribute('data-calculating', 'false');
  await abrirRanking(page);
  expect(parseFloat((await page.locator('.free-territory strong').textContent())!)).toBeLessThan(parseFloat(inicial!));
  await cerrarRanking(page);
  await pixelesColoreados(page);
  await expect(page.locator('.map-error')).toHaveCount(0);
});

test('territorio: hover y click, marcador con icono', async ({ page }) => {
  const muestra = [
    { ...datos[0], id: 'prueba-a', nombre: 'Prueba A', lat: 25.75, lng: -100.32, escala: 'hito' },
    { ...datos[0], id: 'prueba-b', nombre: 'Prueba B', desarrolladora: 'idei', lat: 25.75, lng: -100.28, escala: 'hito' },
  ];
  await page.route('**/src/data/desarrollos.json*', route => route.fulfill({ contentType: 'application/javascript', body: 'export default ' + JSON.stringify(muestra) }));
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await listo(page);
  const marker = page.getByRole('button', { name: 'Ver Prueba A', exact: true });
  await expect(marker.locator('svg')).toHaveCount(1);
  await marker.click();
  await expect(page.getByRole('heading', { name: 'Prueba A', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Cerrar detalle' }).click();
  const caja = (await marker.boundingBox())!;
  await page.getByRole('button', { name: 'Ocultar Bastiones' }).click();
  await page.mouse.move(caja.x + caja.width / 2, caja.y + caja.height / 2);
  await expect(page.getByRole('tooltip')).toContainText('del territorio');
  await page.mouse.click(caja.x + caja.width / 2, caja.y + caja.height / 2);
  await expect(page.getByRole('heading', { name: 'Prueba A', exact: true })).toBeVisible();
});

test('editor: ubicar, arrastrar y exportar sin modificar otros registros', async ({ page }) => {
  const muestra = datos.map(d => ({ ...d, lat: null, lng: null, verificado: false }));
  await page.route('**/src/data/desarrollos.json*', route => route.fulfill({ contentType: 'application/javascript', body: 'export default ' + JSON.stringify(muestra) }));
  await page.goto('/?edit=1', { waitUntil: 'domcontentloaded' });
  await page.getByLabel('Pendiente', { exact: true }).selectOption(datos[0].id);
  await expect(page.getByRole('button', { name: 'Ubicar en el centro' })).toBeEnabled();
  await page.getByRole('button', { name: 'Ubicar en el centro' }).click();
  const marcador = page.getByRole('button', { name: datos[0].nombre + ', confirmado', exact: true });
  await expect(marcador).toBeVisible();
  const caja = (await marcador.boundingBox())!;
  await page.mouse.move(caja.x + caja.width / 2, caja.y + caja.height / 2);
  await page.mouse.down();
  await page.mouse.move(caja.x + 55, caja.y + 30, { steps: 10 });
  await page.mouse.up();
  await expect(page.getByText(datos[0].nombre + ': ubicación actualizada.')).toBeVisible();
  await listo(page);
  const descarga = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar JSON' }).click();
  const archivo = await descarga;
  expect(archivo.suggestedFilename()).toBe('desarrollos.json');
  const exportado = JSON.parse(await readFile((await archivo.path())!, 'utf8')) as Desarrollo[];
  expect(exportado).toHaveLength(datos.length);
  expect(exportado[0].verificado).toBe(true);
  expect(exportado[0].lat).not.toBeNull();
  expect(exportado.slice(1)).toEqual(muestra.slice(1));
});
