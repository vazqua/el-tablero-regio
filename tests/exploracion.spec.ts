import { expect, test, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import type { Desarrollo } from '../src/types';

const datos = JSON.parse(await readFile(new URL('../src/data/desarrollos.json', import.meta.url), 'utf8')) as Desarrollo[];

async function listo(page: Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.mapa')).toHaveAttribute('data-rendered', 'true', { timeout: 30000 });
  await expect(page.locator('.calculation-state')).toHaveAttribute('data-calculating', 'false');
}

async function panel(page: Page) {
  if (test.info().project.name === 'movil') await page.getByRole('button', { name: 'Abrir La Corona y simbología' }).click();
}

test('resaltado: combina tipos y municipio, conserva dominio y admite cero resultados', async ({ page }) => {
  await listo(page);
  await panel(page);
  const porcentajes = await page.locator('.rank-value').allTextContents();
  await page.getByRole('tab', { name: 'Simbología' }).click();
  const filtros = page.getByRole('region', { name: 'Filtros de Bastiones' });
  await filtros.getByRole('button', { name: 'Industrial', exact: true }).click();
  await filtros.getByRole('button', { name: 'Oficinas', exact: true }).click();
  await filtros.getByRole('combobox', { name: 'Municipio' }).selectOption('Apodaca');
  const ids = datos.filter(d => ['industrial', 'oficinas'].includes(d.tipo) && d.municipio === 'Apodaca').map(d => d.id).sort();
  await expect(filtros.getByRole('status')).toHaveText(`${ids.length} de ${datos.length} Bastiones destacados`);
  expect(await page.locator('.development-marker.is-highlighted').evaluateAll(nodes => nodes.map(n => (n as HTMLElement).dataset.desarrollo).sort())).toEqual(ids);
  await expect(page.locator('.development-marker.is-dimmed')).toHaveCount(datos.length - ids.length);
  await expect(page.locator('.development-marker')).toHaveCount(datos.length);
  await expect(filtros.getByRole('button', { name: 'Industrial', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.locator('.ranking-scroll').evaluate(n => { n.scrollTop = 0; });
  await page.screenshot({ path: `test-results/exploration-filters-${test.info().project.name}.png` });

  if (test.info().project.name === 'movil') {
    await filtros.getByRole('button', { name: 'Ver mapa', exact: true }).click();
    await expect(page.locator('.map-stage')).not.toHaveAttribute('inert', '');
    await expect(page.locator('.mobile-filter-count')).toHaveText(String(ids.length));
    await panel(page);
  }
  await filtros.getByRole('combobox', { name: 'Municipio' }).selectOption('Ciénega de Flores');
  await expect(filtros.getByRole('status')).toHaveText('Sin coincidencias');
  await expect(page.locator('.development-marker.is-highlighted')).toHaveCount(0);
  await expect(page.locator('.development-marker.is-dimmed')).toHaveCount(datos.length);

  // Una selección explícita sigue visible aunque esté fuera del filtro.
  if (test.info().project.name === 'movil') await filtros.getByRole('button', { name: 'Ver mapa', exact: true }).click();
  await page.getByRole('textbox', { name: 'Buscar Bastión' }).fill('Armida');
  await page.locator('.search-results button').first().click();
  await expect(page.locator('.development-marker.is-selected')).not.toHaveClass(/is-dimmed/);
  await expect(page.locator('.development-marker.is-selected')).toHaveCSS('opacity', '1');
  await page.getByRole('button', { name: 'Cerrar detalle' }).click();
  await panel(page);
  await filtros.getByRole('button', { name: 'Limpiar filtros' }).click();
  await expect(page.locator('.development-marker.is-dimmed')).toHaveCount(0);
  await expect(page.locator('.development-marker.is-highlighted')).toHaveCount(0);
  await expect(filtros.getByRole('combobox')).toHaveValue('');
  await page.getByRole('tab', { name: 'La Corona', exact: true }).click();
  expect(await page.locator('.rank-value').allTextContents()).toEqual(porcentajes);
});

test('sugerencias: diez distintas, cambio a los 75 segundos y pausas de lectura', async ({ page }) => {
  await page.clock.install();
  await listo(page);
  await panel(page);
  const sugerencia = page.getByRole('region', { name: 'Sugerencia de exploración' });
  const texto = sugerencia.locator('p');
  const vistas = new Set([await texto.textContent()]);
  for (let i = 0; i < 9; i++) {
    await sugerencia.getByRole('button', { name: 'Otra sugerencia' }).click();
    vistas.add(await texto.textContent());
  }
  expect(vistas.size).toBe(10);
  await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
  await page.mouse.move(0, 0);
  const inicial = await texto.textContent();
  await page.clock.fastForward(74000);
  await expect(texto).toHaveText(inicial!);
  await page.keyboard.press('Shift');
  await page.clock.fastForward(74000);
  await expect(texto).toHaveText(inicial!);
  await page.clock.fastForward(2000);
  await expect(texto).not.toHaveText(inicial!);

  await sugerencia.hover();
  const leyendo = await texto.textContent();
  await page.clock.fastForward(90000);
  await expect(texto).toHaveText(leyendo!);
  await page.mouse.move(0, 0);
  await page.clock.fastForward(76000);
  await expect(texto).not.toHaveText(leyendo!);

  await sugerencia.getByRole('button', { name: 'Pausar sugerencias automáticas' }).click();
  await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
  await page.mouse.move(0, 0);
  const pausada = await texto.textContent();
  await page.clock.fastForward(150000);
  await expect(texto).toHaveText(pausada!);
  await sugerencia.getByRole('button', { name: 'Reanudar sugerencias automáticas' }).click();
  await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
  await page.mouse.move(0, 0);
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.clock.fastForward(150000);
  await expect(texto).toHaveText(pausada!);
  await page.evaluate(() => {
    Reflect.deleteProperty(document, 'visibilityState');
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.clock.fastForward(76000);
  await expect(texto).not.toHaveText(pausada!);
  const antesDeFiltrar = await texto.textContent();
  await page.getByRole('tab', { name: 'Simbología', exact: true }).click();
  await expect(sugerencia).toBeHidden();
  await page.clock.fastForward(150000);
  await page.getByRole('tab', { name: 'La Corona', exact: true }).click();
  await expect(texto).toHaveText(antesDeFiltrar!);
});

test('perspectiva inicial, restablecimiento y castillo octagonal en la ficha', async ({ page }) => {
  await listo(page);
  const pitch = test.info().project.name === 'movil' ? '30.0' : '45.0';
  await expect(page.locator('.mapa')).toHaveAttribute('data-pitch', pitch);
  const mapa = (await page.locator('.mapa').boundingBox())!;
  const x = mapa.x + mapa.width * .45, y = mapa.y + mapa.height * .4;
  await page.mouse.move(x, y);
  await page.mouse.down({ button: 'right' });
  await page.mouse.move(x + 40, y + 65, { steps: 10 });
  await page.mouse.up({ button: 'right' });
  await expect(page.locator('.mapa')).not.toHaveAttribute('data-pitch', pitch);
  await page.getByRole('button', { name: 'Vista metropolitana' }).click();
  await expect(page.locator('.mapa')).toHaveAttribute('data-pitch', pitch);
  await page.screenshot({ path: `test-results/exploration-perspective-${test.info().project.name}.png` });

  await page.getByRole('textbox', { name: 'Buscar Bastión' }).fill('Fashion Drive');
  await page.locator('.search-results button').first().click();
  await page.locator('.company-link').click();
  const ampliar = page.getByRole('button', { name: 'Ampliar ficha' });
  if (await ampliar.isVisible()) await ampliar.click();
  const castillo = page.locator('.castillo-ficha');
  await castillo.scrollIntoViewIfNeeded();
  await expect(castillo).toHaveCSS('clip-path', 'polygon(12% 0px, 88% 0px, 100% 12%, 100% 88%, 88% 100%, 12% 100%, 0px 88%, 0px 12%)');
  const bounds = (await castillo.boundingBox())!;
  expect(Math.abs(bounds.width - bounds.height)).toBeLessThan(1);
  await page.screenshot({ path: `test-results/exploration-castle-${test.info().project.name}.png` });
});
