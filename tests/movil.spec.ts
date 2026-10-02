import { expect, test, type Page, type Locator } from '@playwright/test';

async function dentroDePantalla(page: Page, elemento: Locator) {
  const caja = (await elemento.boundingBox())!;
  const viewport = page.viewportSize()!;
  expect(caja.x).toBeGreaterThanOrEqual(0);
  expect(caja.y).toBeGreaterThanOrEqual(0);
  expect(caja.x + caja.width).toBeLessThanOrEqual(viewport.width + 1);
  expect(caja.y + caja.height).toBeLessThanOrEqual(viewport.height + 1);
}

test.describe('interacción móvil táctil', () => {
  test.describe.configure({ mode: 'parallel' });
  test.use({ hasTouch: true, reducedMotion: 'reduce' });
  test.skip(({ isMobile }) => !isMobile, 'La matriz táctil se ejecuta en el proyecto móvil.');

  for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 844, height: 390 }, { width: 568, height: 320 }, { width: 768, height: 1024 }, { width: 390, height: 420 }]) {
    test(`${viewport.width}x${viewport.height}: controles, ranking, fichas y páginas`, async ({ page }) => {
      await page.setViewportSize(viewport);
      const errores: string[] = [];
      page.on('pageerror', e => errores.push(e.message));
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await expect(page.locator('.mapa')).toHaveAttribute('data-rendered', 'true', { timeout: 30000 });
      await dentroDePantalla(page, page.locator('.app'));
      await dentroDePantalla(page, page.locator('.map-tools'));
      await dentroDePantalla(page, page.locator('.influence-control'));
      const controles = await page.locator('.map-tools, .mobile-ranking, .search-box, .influence-control').all();
      for (let i = 0; i < controles.length; i++) {
        const a = (await controles[i].boundingBox())!;
        for (const otro of controles.slice(i + 1)) {
          const b = (await otro.boundingBox())!;
          expect(a.x + a.width <= b.x || b.x + b.width <= a.x || a.y + a.height <= b.y || b.y + b.height <= a.y).toBe(true);
        }
      }
      for (const control of await page.locator('.map-tools button, .mobile-ranking, .site-nav a').all()) {
        const r = (await control.boundingBox())!;
        expect(r.width).toBeGreaterThanOrEqual(44);
        expect(r.height).toBeGreaterThanOrEqual(44);
      }
      const buscador = page.getByRole('textbox', { name: 'Buscar Bastión' });
      await expect(buscador).toHaveCSS('font-size', '16px');
      await page.screenshot({ path: `test-results/mobile-${viewport.width}x${viewport.height}-map.png` });
      const slider = page.getByRole('slider');
      const caja = (await slider.boundingBox())!;
      const cdp = await page.context().newCDPSession(page);
      const y = caja.y + caja.height / 2;
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: caja.x + caja.width * .25, y }] });
      for (const factor of [.35, .45, .55, .65, .8]) {
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: caja.x + caja.width * factor, y }] });
      }
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      expect(Number(await slider.inputValue())).toBeGreaterThan(1.5);
      const corona = page.getByRole('button', { name: 'Abrir La Corona y simbología' });
      await corona.tap();
      await expect(page.getByRole('button', { name: 'Cerrar La Corona' })).toBeFocused();
      await dentroDePantalla(page, page.locator('.ranking-panel'));
      expect(await page.locator('.ranking-scroll').evaluate(n => n.clientHeight)).toBeGreaterThan(85);
      const lista = (await page.locator('.ranking-scroll').boundingBox())!;
      const x = lista.x + lista.width / 2;
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y: lista.y + lista.height * .8 }] });
      for (const factor of [.7, .6, .5, .4, .3, .2]) {
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: lista.y + lista.height * factor }] });
      }
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await expect.poll(() => page.locator('.ranking-scroll').evaluate(n => n.scrollTop)).toBeGreaterThan(20);
      await cdp.detach();
      await page.locator('.rank-row').last().scrollIntoViewIfNeeded();
      await expect(page.locator('.rank-row').last()).toBeInViewport();
      await page.screenshot({ path: `test-results/mobile-${viewport.width}x${viewport.height}-ranking.png` });
      await page.getByRole('tab', { name: 'Simbología' }).tap();
      await page.locator('.legend-companies button').last().scrollIntoViewIfNeeded();
      await page.getByRole('button', { name: 'Cerrar La Corona' }).tap();
      await expect(corona).toBeFocused();
      await buscador.fill('Monterrey');
      await dentroDePantalla(page, page.locator('.search-results'));
      await page.locator('.search-results button').last().scrollIntoViewIfNeeded();
      await page.locator('.search-results button').last().tap();
      await expect(page.getByRole('complementary', { name: 'Ficha del Bastión' })).toBeVisible();
      await dentroDePantalla(page, page.locator('.detail-sheet'));
      const ampliar = page.getByRole('button', { name: 'Ampliar ficha' });
      if (await ampliar.isVisible()) {
        const altura = await page.locator('.detail-scroll').evaluate(n => n.clientHeight);
        await ampliar.tap();
        expect(await page.locator('.detail-scroll').evaluate(n => n.clientHeight)).toBeGreaterThan(altura);
        await expect(page.getByRole('slider')).toBeHidden();
      }
      await page.locator('.company-link').tap();
      await expect(page.getByRole('complementary', { name: 'Ficha de la Casa' })).toBeVisible();
      await expect(page.locator('.detail-sheet h2')).toBeInViewport();
      expect(await page.locator('.detail-scroll').evaluate(n => n.scrollTop)).toBe(0);
      await page.screenshot({ path: `test-results/mobile-${viewport.width}x${viewport.height}-detail.png` });
      const reducir = page.getByRole('button', { name: 'Reducir ficha' });
      if (await reducir.isVisible()) {
        await reducir.tap();
        await expect(page.getByRole('slider')).toBeVisible();
      }
      await page.getByRole('button', { name: 'Cerrar detalle' }).tap();
      await expect(slider).toBeVisible();
      for (const nombre of ['Casas', 'Créditos']) {
        await page.getByRole('navigation').getByRole('link', { name: nombre, exact: true }).tap();
        await expect(page.getByRole('heading', { name: nombre, exact: true })).toBeVisible();
        expect(await page.locator('.content-page').evaluate(n => n.scrollWidth <= n.clientWidth)).toBe(true);
        await page.locator('.content-page').evaluate(n => { n.scrollTop = n.scrollHeight; });
        await page.screenshot({ path: `test-results/mobile-${viewport.width}x${viewport.height}-${nombre}.png` });
      }
      expect(errores).toEqual([]);
    });
  }

  test('producción carga las fuentes locales sin depender de Google Fonts', async ({ page }) => {
    const externas: string[] = [];
    const fuentes: string[] = [];
    await page.route(/https:\/\/fonts\.(googleapis|gstatic)\.com\//, route => { externas.push(route.request().url()); return route.abort(); });
    page.on('response', response => { if (response.ok() && response.url().endsWith('.woff2')) fuentes.push(response.url()); });
    await page.goto(new URL('/desarrolladoras', process.env.E2E_PROD_URL ?? 'http://127.0.0.1:5174').href, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => document.fonts.ready);
    expect(externas).toEqual([]);
    expect(fuentes.some(url => url.includes('macondo-latin-400'))).toBe(true);
    expect(fuentes.some(url => url.includes('nunito-latin-'))).toBe(true);
    expect(await page.evaluate(() => document.fonts.check('24px Macondo') && document.fonts.check('16px Nunito'))).toBe(true);
  });

  test('sin teselas: el aviso no tapa los controles de una pantalla corta', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 420 });
    await page.route('https://tile.openstreetmap.org/**', route => route.abort());
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const aviso = page.locator('.aviso-mapa');
    await expect(aviso).toBeVisible();
    await expect(page.locator('.mapa')).toHaveAttribute('data-rendered', 'true', { timeout: 30000 });
    const a = (await aviso.boundingBox())!;
    for (const control of await page.locator('.map-tools, .mobile-ranking, .search-box, .influence-control').all()) {
      const b = (await control.boundingBox())!;
      expect(a.x + a.width <= b.x || b.x + b.width <= a.x || a.y + a.height <= b.y || b.y + b.height <= a.y).toBe(true);
    }
    await page.getByRole('button', { name: 'Ocultar Bastiones' }).tap();
    await expect(page.locator('.development-marker:visible')).toHaveCount(0);
    await page.screenshot({ path: 'test-results/mobile-offline.png' });
  });

  test('rotar el dispositivo mantiene accesible el mapa y cerrar restaura el foco', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'Abrir La Corona y simbología' }).tap();
    await page.setViewportSize({ width: 844, height: 390 });
    await dentroDePantalla(page, page.locator('.ranking-panel'));
    await page.setViewportSize({ width: 1024, height: 768 });
    await expect(page.locator('.map-stage')).not.toHaveAttribute('inert', '');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole('button', { name: 'Abrir La Corona y simbología' }).tap();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: 'Abrir La Corona y simbología' })).toBeFocused();
  });
});
