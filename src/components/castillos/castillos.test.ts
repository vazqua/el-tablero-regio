import { readFile, readdir } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import sharp from 'sharp';
import casas from '../../data/desarrolladoras.json';

describe('variantes de castillos', () => {
  it('incluye las cuatro medidas de cada Casa sin exceder 3 MB en total', async () => {
    const directorio = new URL('./optimized/', import.meta.url);
    const archivos = await readdir(directorio);
    const esperados = casas.flatMap(casa => [160, 384, 768, 1280].map(ancho => `${casa.id}-${ancho}.webp`));
    expect(archivos.sort()).toEqual(esperados.sort());
    let bytes = 0;
    for (const casa of casas) {
      for (const ancho of [160, 384, 768, 1280]) {
        const buffer = await readFile(new URL(`${casa.id}-${ancho}.webp`, directorio));
        const metadata = await sharp(buffer).metadata();
        expect(metadata.format).toBe('webp');
        expect(metadata.width).toBe(ancho);
        expect(metadata.height).toBe(ancho);
        bytes += buffer.length;
      }
    }
    expect(bytes).toBeLessThan(3_000_000);
  });
});
