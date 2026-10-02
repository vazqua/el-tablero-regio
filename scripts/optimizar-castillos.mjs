import { mkdir, readFile, writeFile } from 'node:fs/promises';
import sharp from 'sharp';

const origen = new URL('../src/components/castillos/', import.meta.url);
const destino = new URL('optimized/', origen);
const casas = JSON.parse(await readFile(new URL('../src/data/desarrolladoras.json', import.meta.url), 'utf8'));
const anchos = [160, 384, 768, 1280];
await mkdir(destino, { recursive: true });
let originales = 0, optimizadas = 0;
for (const { id } of casas) {
  const entrada = await readFile(new URL(`${id}.png`, origen));
  originales += entrada.length;
  for (const ancho of anchos) {
    const salida = new URL(`${id}-${ancho}.webp`, destino);
    const buffer = await sharp(entrada).resize({ width: ancho, withoutEnlargement: true }).webp({ quality: 82, effort: 6 }).toBuffer();
    // Evita reescribir variantes identicas al regenerar el catalogo.
    const anterior = await readFile(salida).catch(error => {
      if (error.code !== 'ENOENT') throw error;
      return null;
    });
    if (!anterior?.equals(buffer)) await writeFile(salida, buffer);
    optimizadas += buffer.length;
  }
}
console.log(`${casas.length} Casas; originales: ${(originales / 1e6).toFixed(2)} MB; todas las variantes WebP: ${(optimizadas / 1e6).toFixed(2)} MB.`);
