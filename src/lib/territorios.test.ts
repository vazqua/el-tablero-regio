import { describe, expect, it } from 'vitest';
import { area, bboxPolygon, booleanValid, difference, featureCollection, intersect, union } from '@turf/turf';
import { BBOX_METROPOLITANA, calcularTerritorios, RADIO_BASE } from './territorios';
import { validarDatos } from './datos';
import datos from '../data/desarrollos.json';
import empresas from '../data/desarrolladoras.json';
import type { Desarrollo, ResultadoTerritorios, Superficie } from '../types';

function desarrollo(id: string, empresa = 'a', lng: number | null = -100.3, lat: number | null = 25.68, escala: Desarrollo['escala'] = 'grande'): Desarrollo {
  return { ...datos[0], id, desarrolladora: empresa, lng, lat, escala, tipo: 'uso-mixto', confianza: 'alta' };
}
// Turf mide sobre la esfera: un triángulo colineal en lon/lat puede tener área
// esférica no nula. Los traslapes del recorte planar se contrastan en metros locales.
function areaPlanar(s: Superficie | null): number {
  if (!s) return 0;
  const poligonos = s.geometry.type === 'Polygon' ? [s.geometry.coordinates] : s.geometry.coordinates;
  return poligonos.reduce((total, anillos) => total + anillos.reduce((subtotal, anillo, indice) => {
    const [lng0, lat0] = anillo[0];
    const puntos = anillo.map(([lng, lat]) => [(lng - lng0) * 111195 * Math.cos(lat0 * Math.PI / 180), (lat - lat0) * 111195]);
    const areaAnillo = Math.abs(puntos.slice(0, -1).reduce((suma, [x, y], i) => suma + x * puntos[i + 1][1] - puntos[i + 1][0] * y, 0)) / 2;
    return subtotal + (indice === 0 ? areaAnillo : -areaAnillo);
  }, 0), 0);
}
function verificarParticion(r: ResultadoTerritorios) {
  const superficies: Superficie[] = [...r.territorios.features, ...(r.libre ? [r.libre] : [])];
  for (const s of superficies) expect(booleanValid(s), 'Superficie inválida: ' + JSON.stringify(s.properties)).toBe(true);
  for (let i = 0; i < superficies.length; i++) for (let j = i + 1; j < superficies.length; j++) {
    const traslape = intersect(featureCollection([superficies[i], superficies[j]]));
    expect(areaPlanar(traslape), 'Traslape: ' + JSON.stringify([superficies[i].properties, superficies[j].properties])).toBeLessThan(0.01);
  }
  const total = superficies.length === 1 ? superficies[0] : union(featureCollection(superficies))!;
  const hueco = difference(featureCollection([bboxPolygon(BBOX_METROPOLITANA), total]));
  const fuera = difference(featureCollection([total, bboxPolygon(BBOX_METROPOLITANA)]));
  expect(areaPlanar(hueco)).toBeLessThan(0.01);
  expect(areaPlanar(fuera)).toBeLessThan(0.01);
  expect(Object.values(r.porcentajes).reduce((a, b) => a + b, r.porcentajeLibre)).toBeCloseTo(100, 6);
  expect(r.porcentajeLibre).toBeGreaterThanOrEqual(0);
  expect(Math.abs(r.porcentajeLibre - (r.libre ? area(r.libre) / r.areaTotalM2 * 100 : 0))).toBeLessThan(0.0001);
  for (const disputa of r.disputadas.features) {
    const enLibre = r.libre ? intersect(featureCollection([disputa, r.libre])) : null;
    expect(areaPlanar(enLibre)).toBeLessThan(0.01);
  }
}
describe('territorios', () => {
  it('conserva los radios solicitados', () => {
    expect(RADIO_BASE).toEqual({ hito: 4000, grande: 2500, mediano: 1500, chico: 800 });
  });
  it.each([0.5, 1, 2.5])('conserva la partición de los datos reales con alcance %sx', factor => {
    const { desarrollos, pendientes } = validarDatos(datos, empresas);
    expect(desarrollos).toHaveLength(datos.length);
    expect(pendientes).toHaveLength(0);
    const r = calcularTerritorios(desarrollos, factor);
    expect(r.territorios.features).toHaveLength(empresas.length);
    expect(r.fueraDeLimites).toHaveLength(0);
    verificarParticion(r);
  }, 30000);
  it('maneja cero puntos, coordenadas parciales y radio cero', () => {
    for (const d of [[], [desarrollo('nulo', 'a', null)], [desarrollo('parcial', 'a', -100.3, null)]]) verificarParticion(calcularTerritorios(d));
    expect(calcularTerritorios([desarrollo('a')], 0).porcentajeLibre).toBe(100);
  });
  it('un punto reclama un círculo del radio correcto', () => {
    const r = calcularTerritorios([desarrollo('a')]);
    expect(r.territorios.features).toHaveLength(1);
    expect(r.territorios.features[0].properties.areaM2).toBeCloseTo(Math.PI * 2500 ** 2, -5);
    expect(r.disputadas.features).toHaveLength(0);
    verificarParticion(r);
  });
  it('disuelve vecinos de una misma empresa y no genera disputas internas', () => {
    const r = calcularTerritorios([desarrollo('a', 'a', -100.3), desarrollo('b', 'a', -100.29)]);
    expect(r.territorios.features).toHaveLength(1);
    expect(r.territorios.features[0].geometry.type).toBe('Polygon');
    expect(r.disputadas.features).toHaveLength(0);
    verificarParticion(r);
  });
  it('mantiene islas separadas en un solo MultiPolygon por empresa', () => {
    const r = calcularTerritorios([desarrollo('a', 'a', -100.6), desarrollo('b', 'a', -100.1)]);
    expect(r.territorios.features).toHaveLength(1);
    expect(r.territorios.features[0].geometry.type).toBe('MultiPolygon');
    verificarParticion(r);
  });
  it('recorta en el borde del bounding box', () => {
    verificarParticion(calcularTerritorios([desarrollo('borde', 'a', BBOX_METROPOLITANA[0], BBOX_METROPOLITANA[1])]));
  });
  it('genera franjas solo en fronteras compartidas entre empresas diferentes', () => {
    const r = calcularTerritorios([desarrollo('a', 'a', -100.3), desarrollo('b', 'b', -100.29)]);
    expect(r.disputadas.features.length).toBeGreaterThan(0);
    expect(area(r.disputadas)).toBeGreaterThan(10000);
    verificarParticion(r);
  });
  it('resuelve la frontera de dos hitos alineados en el centro del mapa', () => {
    const r = calcularTerritorios([desarrollo('prueba-a', 'a', -100.365, 25.725, 'hito'), desarrollo('prueba-b', 'b', -100.335, 25.725, 'hito')]);
    expect(r.disputadas.features).toHaveLength(1);
    verificarParticion(r);
  });
  it('no considera disputados dos círculos separados por suelo libre', () => {
    const r = calcularTerritorios([desarrollo('a', 'a', -100.3, 25.68, 'chico'), desarrollo('b', 'b', -100.28, 25.68, 'chico')]);
    expect(r.disputadas.features).toHaveLength(0);
    verificarParticion(r);
  });
  it('no produce disputas si solo un círculo alcanza la frontera', () => {
    const r = calcularTerritorios([desarrollo('a', 'a', -100.3, 25.68, 'hito'), desarrollo('b', 'b', -100.27, 25.68, 'chico')]);
    expect(r.disputadas.features).toHaveLength(0);
    verificarParticion(r);
  });
  it('resuelve duplicados de una empresa usando el mayor radio y rechaza empates entre rivales', () => {
    const r = calcularTerritorios([desarrollo('a', 'a', -100.3, 25.68, 'chico'), desarrollo('b', 'a')]);
    expect(area(r.territorios)).toBeCloseTo(area(calcularTerritorios([desarrollo('b', 'a')]).territorios), 4);
    expect(() => calcularTerritorios([desarrollo('a'), desarrollo('b', 'b')])).toThrow('Coordenadas coincidentes');
  });
  it('rechaza factores inválidos y reporta coordenadas fuera del área', () => {
    for (const factor of [-1, NaN, Infinity]) expect(() => calcularTerritorios([], factor)).toThrow();
    const r = calcularTerritorios([desarrollo('fuera', 'a', 0, 0)]);
    expect(r.fueraDeLimites).toEqual(['fuera']);
    expect(r.porcentajeLibre).toBe(100);
  });
  it('recalcula sin mutar y sin depender del orden de entrada', () => {
    const input = [desarrollo('a', 'a', -100.3), desarrollo('b', 'b', -100.29), desarrollo('c', 'a', -100.32, 25.7)];
    const original = structuredClone(input);
    const r = calcularTerritorios(input);
    expect(input).toEqual(original);
    expect(calcularTerritorios([...input].reverse())).toEqual(r);
    const amplio = calcularTerritorios(input, 1.5);
    expect(amplio.porcentajeLibre).toBeLessThan(r.porcentajeLibre);
    verificarParticion(amplio);
  });
  it('conserva la partición con varios puntos colineales', () => {
    verificarParticion(calcularTerritorios(Array.from({ length: 8 }, (_, i) => desarrollo('col-' + i, 'e-' + i % 3, -100.4 + i * 0.012, 25.68))));
  });
  it('maneja la cobertura completa sin territorio libre negativo', () => {
    const r = calcularTerritorios([desarrollo('a', 'a', -100.3), desarrollo('b', 'b', -100.29)], 100);
    expect(r.libre).toBeNull();
    verificarParticion(r);
  });
  it('conserva la partición y el 100 % en escenarios densos de 54 desarrollos', () => {
    let seed = 41;
    const random = () => { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 4294967296; };
    const input = Array.from({ length: 54 }, (_, i) => desarrollo('d-' + i, 'e-' + i % 12, -100.45 + random() * 0.25, 25.6 + random() * 0.23, ['hito', 'grande', 'mediano', 'chico'][i % 4] as Desarrollo['escala']));
    for (const factor of [0.4, 1, 2]) verificarParticion(calcularTerritorios(input, factor));
  }, 30000);
});
