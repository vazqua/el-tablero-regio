import { expect, test } from '@playwright/test';
import { readFile, readdir } from 'node:fs/promises';

test('producción excluye el editor incluso con edit=1', async ({ page }) => {
  await page.goto(new URL('?edit=1', process.env.E2E_PROD_URL ?? 'http://127.0.0.1:5174').href, { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: /El Tablero Regio/, level: 1 })).toBeVisible();
  await expect(page).toHaveTitle('Mapa | El Tablero Regio');
  await expect(page.locator('.mapa')).toHaveAttribute('data-rendered', 'true', { timeout: 30000 });
  await expect(page.locator('.map-error')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Exportar JSON' })).toHaveCount(0);
  await expect(page.getByRole('region', { name: 'Edición de coordenadas' })).toHaveCount(0);
  const archivos = await readdir('dist/assets');
  const casas = JSON.parse(await readFile('src/data/desarrolladoras.json', 'utf8')) as { id: string }[];
  for (const casa of casas) {
    expect(archivos.some(archivo => archivo.startsWith(casa.id + '-') && archivo.endsWith('.png'))).toBe(false);
  }
  for (const archivo of archivos) {
    if (!archivo.endsWith('.js') && !archivo.endsWith('.css')) continue;
    const contenido = await readFile('dist/assets/' + archivo, 'utf8');
    expect(contenido).not.toContain('Exportar JSON');
    expect(contenido).not.toContain('marcador-editor');
    expect(contenido).not.toContain('Ubicar en el centro');
  }
});
