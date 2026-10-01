import { expect, test } from '@playwright/test';
import { readFile, readdir } from 'node:fs/promises';
import type { Desarrolladora } from '../src/types';
import { tintas, tintaSobre } from '../src/components/escudo/tintas';
const casas = JSON.parse(await readFile(new URL('../src/data/desarrolladoras.json', import.meta.url), 'utf8')) as Desarrolladora[];

test('armorial: 14 Casas, escalas, una tinta y SVG legible sin desbordar', async ({ page }) => {
  await page.goto('/escudos', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Los escudos', exact: true })).toBeVisible();
  await expect(page.locator('.armorial-card')).toHaveCount(14);
  await expect(page.locator('.shield-sizes .escudo')).toHaveCount(42);
  await expect(page.locator('.mono-sample .escudo')).toHaveCount(14);
  await expect(page.locator('.armorial-variants .estandarte')).toHaveCount(14);
  await expect(page.locator('.armorial-card text, .armorial-card image, .armorial-card filter, .armorial-card linearGradient')).toHaveCount(0);
  const medidas = await page.locator('.shield-sizes .escudo').evaluateAll(nodos => nodos.map(n => {
    const r = n.getBoundingClientRect();
    return [r.width, r.height];
  }));
  for (let i = 0; i < medidas.length; i++) {
    expect(medidas[i][1]).toBe([24, 48, 120][i % 3]);
    expect(medidas[i][0]).toBeCloseTo(medidas[i][1] * .8, 1);
  }
  // Rasterizar cada SVG real detecta recortes rotos, dibujos vacíos y colisiones de IDs.
  const pixeles = await page.locator('.shield-sizes .escudo').evaluateAll(async nodos => {
    const resultados = [];
    for (const nodo of nodos) {
      const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(nodo)], { type: 'image/svg+xml' }));
      const img = new Image(); img.src = url; await img.decode();
      const canvas = document.createElement('canvas');
      canvas.width = Math.ceil(img.width); canvas.height = img.height;
      const ctx = canvas.getContext('2d')!; ctx.drawImage(img, 0, 0);
      const datos = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let opacos = 0, claros = 0, oscuros = 0, hash = 0;
      for (let i = 0; i < datos.length; i += 4) {
        if (datos[i + 3] > 200) {
          opacos++;
          if (Math.min(datos[i], datos[i + 1], datos[i + 2]) > 210) claros++;
          if (Math.max(datos[i], datos[i + 1], datos[i + 2]) < 65) oscuros++;
        }
        hash = (Math.imul(hash, 31) + datos[i] + datos[i + 1] * 3 + datos[i + 2] * 7) | 0;
      }
      resultados.push({ casaId: nodo.getAttribute('data-casa'), alto: canvas.height, opacos, claros, oscuros, hash });
      URL.revokeObjectURL(url);
    }
    return resultados;
  });
  for (const p of pixeles) {
    expect(p.opacos).toBeGreaterThan(p.alto * p.alto * .45);
    // A 24 px el borde tiene antialiasing; se verifica la tinta de la figura.
    const tinta = tintaSobre(casas.find(c => c.id === p.casaId)!.color);
    expect(tinta === tintas.argen ? p.claros : p.oscuros, p.casaId!).toBeGreaterThan(5);
  }
  expect(new Set(pixeles.filter(p => p.alto === 24).map(p => p.hash)).size).toBe(14);
  const ids = await page.locator('.armorial-card [id]').evaluateAll(nodos => nodos.map(n => n.id));
  expect(new Set(ids).size).toBe(ids.length);
  await page.evaluate(() => document.fonts.ready);
  for (const index of [0, 3, 6, 9, 13]) {
    await page.locator('.armorial-card').nth(index).scrollIntoViewIfNeeded();
    await page.screenshot({ path: 'test-results/escudos-' + index + '-' + test.info().project.name + '.png' });
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth && document.querySelector('.content-page')!.scrollWidth <= document.querySelector('.content-page')!.clientWidth)).toBe(true);
});

test('estandarte: aparece anclado, no sigue al cursor y se retira al salir', async ({ page }) => {
  const datos = JSON.parse(await readFile(new URL('../src/data/desarrollos.json', import.meta.url), 'utf8'));
  const muestra = [{ ...datos[0], id: 'estandarte-prueba', nombre: 'Bastión de prueba', desarrolladora: 'gm-desarrollos', lat: 25.75, lng: -100.30, escala: 'hito' }];
  await page.route('**/src/data/desarrollos.json*', route => route.fulfill({ contentType: 'application/javascript', body: 'export default ' + JSON.stringify(muestra) }));
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.mapa')).toHaveAttribute('data-rendered', 'true', { timeout: 30000 });
  const marker = page.getByRole('button', { name: 'Ver Bastión de prueba', exact: true });
  const caja = (await marker.boundingBox())!;
  await page.getByRole('button', { name: 'Ocultar Bastiones' }).click();
  const x = caja.x + caja.width / 2, y = caja.y + caja.height / 2;
  await page.mouse.move(x + 12, y + 8);
  const bandera = page.locator('.territory-standard');
  await expect(bandera).toHaveCount(1);
  await expect(page.locator('.bastion-standard')).toHaveCount(muestra.length);
  await expect(page.getByRole('tooltip').locator('.castillo')).toHaveAttribute('data-casa', 'gm-desarrollos');
  await expect(page.getByRole('tooltip').locator('.estandarte')).toHaveCount(0);
  await expect(bandera.locator('svg')).toHaveAttribute('data-casa', 'gm-desarrollos');
  expect(Number(await bandera.getAttribute('data-lng'))).toBeCloseTo(-100.3, 3);
  expect(Number(await bandera.getAttribute('data-lat'))).toBeCloseTo(25.75, 3);
  await expect(bandera.locator('svg')).toHaveCSS('animation-duration', '0.15s');
  const inicial = await bandera.getAttribute('style');
  await page.mouse.move(x - 8, y + 10);
  await expect(bandera).toHaveAttribute('style', inicial!);
  const globo = (await page.locator('.territory-tooltip').boundingBox())!;
  for (const flag of await page.locator('.territory-standard, .bastion-standard').all()) {
    const b = (await flag.boundingBox())!;
    expect(globo.x + globo.width <= b.x || b.x + b.width <= globo.x || globo.y + globo.height <= b.y || b.y + b.height <= globo.y).toBe(true);
  }
  await page.screenshot({ path: 'test-results/estandarte-' + test.info().project.name + '.png', animations: 'disabled' });
  await page.mouse.move(10, 10);
  await expect(bandera).toHaveCount(0);
  await expect(page.locator('.bastion-standard')).toHaveCount(0);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.mouse.move(x + 12, y + 8);
  await expect(bandera.locator('svg')).toHaveCSS('animation-name', 'none');
  await page.mouse.click(x + 12, y + 8);
  await expect(bandera).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Bastión de prueba', exact: true })).toBeVisible();
});

test('producción no publica el armorial de desarrollo', async ({ page }) => {
  await page.goto(new URL('/escudos', process.env.E2E_PROD_URL ?? 'http://127.0.0.1:5174').href, { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Este territorio no existe.' })).toBeVisible();
  await expect(page.locator('.heraldry-guide')).toHaveCount(0);
  for (const file of await readdir('dist/assets')) {
    if (file.endsWith('.js')) expect(await readFile('dist/assets/' + file, 'utf8')).not.toContain('ARMORIAL REGIO');
  }
});
