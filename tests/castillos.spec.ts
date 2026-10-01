import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const casas = JSON.parse(await readFile(new URL('../src/data/desarrolladoras.json', import.meta.url), 'utf8'));
const datos = JSON.parse(await readFile(new URL('../src/data/desarrollos.json', import.meta.url), 'utf8'));

test('castillos: las 14 Casas conservan su escudo y muestran su imagen completa', async ({ page }) => {
  await page.goto('/desarrolladoras', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.company-card .castillo')).toHaveCount(casas.length);
  await expect(page.locator('.company-card .escudo')).toHaveCount(casas.length);
  for (const casa of casas) {
    const imagen = page.locator(`.company-card .castillo[data-casa="${casa.id}"]`);
    await imagen.scrollIntoViewIfNeeded();
    await expect(imagen).toHaveAttribute('src', new RegExp('/' + casa.id + '\\.png'));
    await expect.poll(() => imagen.evaluate((n: HTMLImageElement) => n.complete && n.naturalWidth > 0)).toBe(true);
    await expect(imagen).toHaveCSS('object-fit', 'contain');
  }
  await page.locator('.company-card').first().evaluate(n => n.scrollIntoView({ block: 'start' }));
  await page.screenshot({ path: 'test-results/castillos-catalogo-' + test.info().project.name + '.png' });
  expect(await page.locator('.content-page').evaluate(n => n.scrollWidth <= n.clientWidth)).toBe(true);
  await page.locator('.company-card').first().click();
  const ficha = page.getByRole('complementary', { name: 'Ficha de la Casa' });
  await expect(ficha.locator('.castillo')).toHaveAttribute('data-casa', casas[0].id);
  await expect(ficha.locator('.escudo')).toBeVisible();
  await expect(ficha.getByRole('heading', { level: 2 })).toBeInViewport();
  await expect.poll(() => ficha.locator('.castillo').evaluate((n: HTMLImageElement) => n.complete && n.naturalWidth > 0)).toBe(true);
  await page.screenshot({ path: 'test-results/castillos-ficha-' + test.info().project.name + '.png' });
});

test('castillos: el tooltip distingue Bastiones de la misma Casa sin sustituir banderas', async ({ page }) => {
  const muestra = [
    { ...datos[0], id: 'castillo-uno', nombre: 'Torre de prueba', desarrolladora: 'gm-desarrollos', lat: 25.75, lng: -100.32, escala: 'hito' },
    { ...datos[0], id: 'castillo-dos', nombre: 'Plaza de prueba', desarrolladora: 'gm-desarrollos', lat: 25.75, lng: -100.28, escala: 'hito' },
  ];
  await page.route('**/src/data/desarrollos.json*', route => route.fulfill({ contentType: 'application/javascript', body: 'export default ' + JSON.stringify(muestra) }));
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.mapa')).toHaveAttribute('data-rendered', 'true', { timeout: 30000 });
  for (const bastion of muestra) {
    await page.getByRole('button', { name: 'Ver ' + bastion.nombre, exact: true }).hover();
    const tooltip = page.getByRole('tooltip');
    await expect(tooltip.locator('strong')).toHaveText(bastion.nombre);
    await expect(tooltip.locator('.tooltip-casa')).toHaveText('GM Desarrollos');
    await expect(tooltip.locator('.castillo')).toHaveAttribute('data-casa', 'gm-desarrollos');
    await expect.poll(() => tooltip.locator('.castillo').evaluate((n: HTMLImageElement) => n.complete && n.naturalWidth > 0)).toBe(true);
    await expect(tooltip.locator('.estandarte')).toHaveCount(0);
    await expect(page.locator('.territory-standard')).toHaveCount(1);
    await expect(page.locator('.bastion-standard')).toHaveCount(2);
  }
  await page.screenshot({ path: 'test-results/castillos-tooltip-' + test.info().project.name + '.png' });
  await page.mouse.move(5, 5);
  await expect(page.getByRole('tooltip')).toHaveCount(0);
});
