import { expect, test } from '@playwright/test';
import { readFile, readdir } from 'node:fs/promises';
const aliases = { bg: '#f9f6eb', surface: '#f4edd7', ink: '#180e0b', 'ink-soft': '#683b31', border: '#452721', accent: '#821719', 'accent-hover': '#ad1f21', highlight: '#d5522a', crown: '#c7a638', 'neutral-land': '#dec0ba' };
const rgb = (hex: string) => 'rgb(' + hex.slice(1).match(/../g)!.map(v => parseInt(v, 16)).join(', ') + ')';

test('estilo: diez alias, tres fuentes, componentes y esquema claro', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  await page.goto('/estilo', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Sistema de diseño', exact: true })).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator('.token-sample')).toHaveCount(10);
  for (const [name, hex] of Object.entries(aliases)) {
    const muestra = page.locator('.token-sample').filter({ has: page.getByText(name, { exact: true }) });
    await expect(muestra.locator('code')).toHaveText(hex);
    await expect(muestra.locator('.token-color')).toHaveCSS('background-color', rgb(hex));
  }
  await expect(page.locator('html')).toHaveCSS('color-scheme', 'light');
  await expect(page.locator('body')).toHaveCSS('font-family', /Nunito/);
  await expect(page.locator('.brand h1')).toHaveCSS('font-family', /Macondo/);
  await expect(page.locator('.page-title')).toHaveCSS('font-family', /Macondo/);
  const specimens = await page.locator('.font-display').evaluateAll(nodes => nodes.map(n => ({ font: getComputedStyle(n).fontFamily, size: parseFloat(getComputedStyle(n).fontSize), weight: getComputedStyle(n).fontWeight })));
  expect(specimens.every(s => s.font.includes('Macondo') && s.size >= 24 && s.weight === '400')).toBe(true);
  await expect(page.locator('.design-button')).toHaveCSS('background-color', rgb(aliases.accent));
  await page.screenshot({ path: 'test-results/estilo-' + test.info().project.name + '.png', animations: 'disabled' });
  await page.locator('.component-examples').scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'test-results/componentes-' + test.info().project.name + '.png', animations: 'disabled' });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth && document.querySelector('.content-page')!.scrollWidth <= document.querySelector('.content-page')!.clientWidth)).toBe(true);
});

test('Casas: colores propios, Macondo regular y navegación intacta', async ({ page }) => {
  const casas = JSON.parse(await readFile(new URL('../src/data/desarrolladoras.json', import.meta.url), 'utf8'));
  await page.goto('/desarrolladoras', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Casas', exact: true })).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  for (const casa of casas) {
    const card = page.getByRole('link', { name: 'Ver ' + casa.nombre + ' en el mapa', exact: true });
    await expect(card.locator('.company-card-top')).toHaveCSS('background-color', rgb(casa.color));
    await expect(card.locator('h3')).toHaveCSS('font-family', /Macondo/);
    await expect(card.locator('h3')).toHaveCSS('font-weight', '400');
  }
  await page.locator('.company-card').first().click();
  await expect(page.locator('.mapa')).toHaveAttribute('data-rendered', 'true', { timeout: 30000 });
  await expect(page.locator('.rank-row.is-leader')).toHaveCount(1);
  await expect(page.locator('.rank-row.is-leader .rank-position')).toHaveCSS('background-color', rgb(aliases.crown));
  await expect(page.locator('.detail-sheet .house-name')).toHaveCSS('font-weight', '400');
});

test('producción no incluye la página de estilo ni sus muestras', async ({ page }) => {
  await page.goto(new URL('/estilo', process.env.E2E_PROD_URL ?? 'http://127.0.0.1:5174').href, { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Este territorio no existe.' })).toBeVisible();
  await expect(page.locator('.style-guide')).toHaveCount(0);
  for (const file of await readdir('dist/assets')) {
    if (!file.endsWith('.js')) continue;
    const contenido = await readFile('dist/assets/' + file, 'utf8');
    expect(contenido).not.toContain('LABORATORIO VISUAL');
    expect(contenido).not.toContain('Tokens semánticos');
  }
});
