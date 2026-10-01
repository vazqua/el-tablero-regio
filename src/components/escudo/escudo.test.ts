import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { booleanPointInPolygon, multiPolygon, point, polygon } from '@turf/turf';
import casas from '../../data/desarrolladoras.json';
import { blasones } from './blasones';
import { figuras } from './figuras';
import { particiones } from './particiones';
import { Escudo, Estandarte } from './Escudo';
import { contraste, tintas, tintaSobre } from './tintas';
import { centroEstandarte } from './centroEstandarte';

describe('armorial de las Casas', () => {
  it('cubre exactamente las 14 Casas con combinaciones únicas y una sola montaña', () => {
    const registros = Object.values(blasones);
    expect(Object.keys(blasones).sort()).toEqual(casas.map(c => c.id).sort());
    expect(registros).toHaveLength(14);
    expect(new Set(registros.map(b => b.particion + ':' + [...b.figuras].sort().join(','))).size).toBe(14);
    expect(registros.flatMap(b => b.figuras).filter(f => f === 'montaña')).toHaveLength(1);
    for (const b of registros) {
      expect(b.silueta).toBe('iberico');
      expect(particiones).toHaveProperty(b.particion);
      expect(b.figuras.length).toBeGreaterThanOrEqual(1);
      expect(b.figuras.length).toBeLessThanOrEqual(2);
      for (const f of b.figuras) expect(figuras).toHaveProperty(f);
      expect(b.lemaLatin.split(/\s+/).length).toBeGreaterThanOrEqual(2);
      expect(b.lemaLatin.split(/\s+/).length).toBeLessThanOrEqual(5);
      expect(b.lemaOriginal.trim()).not.toBe('');
      expect(b.lemaTraduccion.trim()).not.toBe('');
    }
  });

  it('elige la tinta más legible sin alterar ningún color de Casa', () => {
    for (const casa of casas) {
      const tinta = tintaSobre(casa.color);
      expect(contraste(casa.color, tinta)).toBeGreaterThan(3);
      expect(contraste(casa.color, tinta)).toBe(Math.max(contraste(casa.color, tintas.argen), contraste(casa.color, tintas.sable)));
      const svg = renderToStaticMarkup(createElement(Escudo, { casaId: casa.id }));
      expect(svg).toContain('fill="' + casa.color + '"');
      expect(svg).toContain('fill="' + tinta + '"');
    }
  });

  it('usa un viewBox fijo, escala continua y ningún texto, imagen o efecto', () => {
    for (const casa of casas) for (const size of [24, 48, 120, 137, 200]) {
      const svg = renderToStaticMarkup(createElement(Escudo, { casaId: casa.id, size }));
      expect(svg).toContain('viewBox="0 0 80 100"');
      expect(svg).toContain('height="' + size + '"');
      expect(svg).toContain('width="' + size * .8 + '"');
      expect(svg).not.toMatch(/<(text|image|filter|linearGradient|radialGradient|foreignObject)\b/);
    }
  });

  it('la silueta usa exclusivamente currentColor y fondo transparente', () => {
    for (const casa of casas) {
      const svg = renderToStaticMarkup(createElement(Escudo, { casaId: casa.id, variante: 'silueta' }));
      expect(svg).not.toMatch(/(?:fill|stroke)="#/);
      expect(svg).toContain('fill="currentColor"');
      expect(svg).toContain('stroke="currentColor"');
      expect(svg).not.toContain(casa.color);
    }
  });

  it('cada instancia tiene recortes propios, incluso junto a su estandarte', () => {
    const svg = renderToStaticMarkup(createElement('div', null, ...casas.flatMap(c =>
      [createElement(Escudo, { casaId: c.id }), createElement(Escudo, { casaId: c.id }), createElement(Estandarte, { casaId: c.id })])));
    const ids = [...svg.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
    expect(new Set(ids).size).toBe(ids.length);
    const referencias = [...svg.matchAll(/url\(#([^)]+)\)/g)].map(m => m[1]);
    expect(referencias.every(id => ids.includes(id))).toBe(true);
  });

  it('un identificador desconocido no provoca errores', () => {
    expect(renderToStaticMarkup(createElement(Escudo, { casaId: 'inexistente' }))).toContain('Casa sin blasón');
  });
});

describe('anclaje territorial del estandarte', () => {
  it('se centra en el componente de mayor área sin aterrizar entre islas', () => {
    const territorio = multiPolygon([
      [[[0, 0], [4, 0], [4, 4], [0, 4], [0, 0]]],
      [[[10, 0], [11, 0], [11, 1], [10, 1], [10, 0]]],
    ]);
    expect(centroEstandarte(territorio)).toEqual([2, 2]);
  });
  it('no planta la bandera en un hueco o fuera de un campo cóncavo', () => {
    const hueco = polygon([
      [[0, 0], [6, 0], [6, 6], [0, 6], [0, 0]],
      [[2, 2], [2, 4], [4, 4], [4, 2], [2, 2]],
    ]);
    const concavo = polygon([[[0, 0], [6, 0], [6, 1], [1, 1], [1, 6], [0, 6], [0, 0]]]);
    for (const territorio of [hueco, concavo]) {
      const centro = centroEstandarte(territorio, [[.5, .5], [5, .5]]);
      expect(booleanPointInPolygon(point(centro), territorio, { ignoreBoundary: true })).toBe(true);
    }
  });
});
