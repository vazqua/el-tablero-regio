import { area, booleanPointInPolygon, centerOfMass, point, pointOnFeature, polygon } from '@turf/turf';
import type { Feature, MultiPolygon, Polygon } from 'geojson';

export function centroEstandarte(territorio: Feature<Polygon | MultiPolygon>, bastiones: [number, number][] = []): [number, number] {
  const partes = territorio.geometry.type === 'Polygon' ? [territorio] : territorio.geometry.coordinates.map(c => polygon(c));
  const principal = partes.reduce((a, b) => area(a) >= area(b) ? a : b);
  const centro = centerOfMass(principal);
  if (booleanPointInPolygon(centro, principal, { ignoreBoundary: true })) return centro.geometry.coordinates as [number, number];
  // En campos cóncavos o con huecos, se planta en el Bastión interior más central.
  const [x, y] = centro.geometry.coordinates;
  const interiores = bastiones.filter(p => booleanPointInPolygon(point(p), principal, { ignoreBoundary: true }));
  interiores.sort((a, b) => (a[0] - x) ** 2 + (a[1] - y) ** 2 - ((b[0] - x) ** 2 + (b[1] - y) ** 2));
  return interiores[0] ?? pointOnFeature(principal).geometry.coordinates as [number, number];
}
