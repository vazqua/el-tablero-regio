import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import type { Desarrolladora, Desarrollo } from '../src/types';
const empresas: Desarrolladora[] = JSON.parse(await readFile(new URL('../src/data/desarrolladoras.json', import.meta.url), 'utf8'));
const datos: Desarrollo[] = JSON.parse(await readFile(new URL('../src/data/desarrollos.json', import.meta.url), 'utf8'));

test('catálogo: datos completos, selección compartible, atenuación y vuelta', async ({ page }) => {
  const errores: string[] = [];
  page.on('pageerror', e => errores.push(e.message));
  await page.goto('/desarrolladoras', { waitUntil: 'domcontentloaded' });
  const nav = page.getByRole('navigation', { name: 'Navegación principal' });
  await expect(nav.getByRole('link', { name: 'Casas', exact: true })).toHaveAttribute('aria-current', 'page');
  await expect(page.locator('.company-card')).toHaveCount(empresas.length);
  await expect(page.getByRole('status')).toContainText('de tierras sin reclamar', { timeout: 30000 });
  for (const empresa of empresas) {
    const tarjeta = page.getByRole('link', { name: 'Ver ' + empresa.nombre + ' en el mapa', exact: true });
    await expect(tarjeta).toContainText(empresa.representante);
    await expect(tarjeta).toContainText(empresa.descripcion);
    await expect(tarjeta.locator('.company-projects li')).toHaveCount(datos.filter(d => d.desarrolladora === empresa.id).length);
  }
  await page.screenshot({ path: 'test-results/catalogo-' + test.info().project.name + '.png', animations: 'disabled' });
  const empresa = empresas[0];
  const tarjeta = page.getByRole('link', { name: 'Ver ' + empresa.nombre + ' en el mapa', exact: true });
  const dominio = await tarjeta.locator('.company-metrics strong').first().textContent();
  await tarjeta.click();
  await expect(page).toHaveURL(new RegExp('empresa=' + empresa.id));
  await expect(page.locator('.mapa')).toHaveAttribute('data-rendered', 'true', { timeout: 30000 });
  const contarColor = () => page.evaluate(() => {
    const gl = document.querySelector('canvas')!.getContext('webgl2')!;
    const pixels = new Uint8Array(gl.drawingBufferWidth * gl.drawingBufferHeight * 4);
    gl.readPixels(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    let total = 0;
    for (let i = 0; i < pixels.length; i += 4) if (Math.max(pixels[i], pixels[i + 1], pixels[i + 2]) - Math.min(pixels[i], pixels[i + 1], pixels[i + 2]) > 60) total++;
    return total;
  });
  await expect(page.locator('.detail-sheet h2')).toHaveText(empresa.nombre);
  await expect(page.locator('.company-stat strong')).toHaveText(dominio!);
  await expect(page.locator('.development-marker.is-dimmed')).toHaveCount(datos.filter(d => d.desarrolladora !== empresa.id).length);
  await expect(page.locator('.development-marker.is-dimmed').first()).toHaveCSS('opacity', '0.24');
  await page.screenshot({ path: 'test-results/seleccion-' + test.info().project.name + '.png', animations: 'disabled' });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('.detail-sheet h2')).toHaveText(empresa.nombre);
  await expect(page.locator('.mapa')).toHaveAttribute('data-rendered', 'true', { timeout: 30000 });
  await expect.poll(contarColor).toBeGreaterThan(50);
  const pixelesSeleccion = await contarColor();
  await page.getByRole('button', { name: 'Cerrar detalle' }).click();
  await expect.poll(contarColor).toBeGreaterThan(pixelesSeleccion * 1.5);
  await expect(page).not.toHaveURL(/empresa=/);
  await expect(page.locator('.development-marker.is-dimmed')).toHaveCount(0);
  await page.goBack({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('.detail-sheet h2')).toHaveText(empresa.nombre);
  await nav.getByRole('link', { name: 'Mapa', exact: true }).click();
  await expect(page.locator('.detail-sheet')).toHaveCount(0);
  expect(errores).toEqual([]);
});

test('alcance compartido, navegación con teclado y créditos', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.mapa')).toHaveAttribute('data-rendered', 'true', { timeout: 30000 });
  await page.getByRole('slider').fill('1.5');
  await expect(page.locator('.calculation-state')).toHaveAttribute('data-factor', '1.5', { timeout: 30000 });
  const nav = page.getByRole('navigation', { name: 'Navegación principal' });
  await nav.getByRole('link', { name: 'Casas', exact: true }).click();
  await expect(page.locator('.scope-label')).toContainText('1.5×');
  await nav.getByRole('link', { name: 'Créditos', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Créditos', exact: true })).toBeFocused();
  await expect(page.locator('.disclaimer')).toContainText('Sin afiliación');
  await expect(page).toHaveTitle('Créditos | El Tablero Regio');
  await expect(page.locator('.personal-links [aria-disabled="true"]')).toHaveCount(0);
  await expect(page.locator('.personal-links a')).toHaveCount(2);
  await expect(page.locator('.personal-links').getByRole('link', { name: 'GitHub @vazqua' })).toHaveAttribute('href', 'https://github.com/vazqua');
  await expect(page.locator('.personal-links').getByRole('link', { name: 'LinkedIn @davidvazquezmore' })).toHaveAttribute('href', 'https://www.linkedin.com/in/davidvazquezmore');
  await expect(page.locator('.stack-list li')).toHaveCount(9);
  await expect(page.locator('.stack-list')).toContainText('Railway');
  await expect(page.locator('.stack-list')).toContainText('Google Fonts');
  await page.screenshot({ path: 'test-results/creditos-' + test.info().project.name + '.png', animations: 'disabled' });
  await page.locator('summary').click();
  await expect(page.locator('.source-list li')).toHaveCount(datos.length);
  await expect(page.locator('.source-list')).toContainText(datos[0].fuente);
  await nav.getByRole('link', { name: 'Mapa', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('slider')).toHaveValue('1.5');
  await expect(page).toHaveTitle('Mapa | El Tablero Regio');
  await expect(page.locator('.mapa')).toHaveAttribute('data-rendered', 'true', { timeout: 30000 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('rutas desconocidas e identificadores inválidos no rompen el mapa', async ({ page }) => {
  await page.goto('/no-existe', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Este territorio no existe.' })).toBeVisible();
  await page.getByRole('link', { name: 'Volver al mapa', exact: true }).click();
  await expect(page.getByRole('slider')).toBeVisible();
  await page.goto('/?empresa=no-existe', { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('Esta Casa no está en el catálogo.', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Ver todo el mapa' }).click();
  await expect(page).not.toHaveURL(/empresa=/);
});

test('producción: entrada directa y recarga en ambas páginas', async ({ page }) => {
  for (const [ruta, nombre] of [['/desarrolladoras', 'Casas'], ['/creditos', 'Créditos']]) {
    await page.goto(new URL(ruta, process.env.E2E_PROD_URL ?? 'http://127.0.0.1:5174').href, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: nombre, exact: true })).toBeVisible();
    await expect(page).toHaveTitle(nombre + ' | El Tablero Regio');
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: nombre, exact: true })).toBeVisible();
  }
});
