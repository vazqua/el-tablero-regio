import { Delaunay } from 'd3-delaunay';
import { setPrecision } from 'polyclip-ts';
import { area, bboxPolygon, booleanPointInPolygon, buffer, circle, difference, featureCollection, intersect, lineSplit, lineString, point, polygon, union } from '@turf/turf';
import type { Feature, LineString, Position } from 'geojson';
import type { Desarrollo, DesarrolloUbicado, PropiedadesTerritorio, ResultadoTerritorios, Superficie } from '../types';
import { estaUbicado } from './datos';

export const RADIO_BASE = { hito: 4000, grande: 2500, mediano: 1500, chico: 800 } as const;
// Ventana de estudio aproximada, no un límite administrativo oficial.
export const BBOX_METROPOLITANA: [number, number, number, number] = [-100.85, 25.35, -99.85, 26.10];
export const BUFFER_DISPUTA_METROS = 300;
const ORIGEN = [-100.35, 25.725];
const METROS_GRADO = Math.PI * 6371008.8 / 180;
const X_ESCALA = METROS_GRADO * Math.cos(ORIGEN[1] * Math.PI / 180);
const proyectar = ([lng, lat]: Position): [number, number] => [(lng - ORIGEN[0]) * X_ESCALA, (lat - ORIGEN[1]) * METROS_GRADO];
const desproyectar = ([x, y]: Position): [number, number] => [Number((x / X_ESCALA + ORIGEN[0]).toFixed(9)), Number((y / METROS_GRADO + ORIGEN[1]).toFixed(9))];
export const dentroDeLimites = (lng: number, lat: number) => lng >= BBOX_METROPOLITANA[0] && lng <= BBOX_METROPOLITANA[2] && lat >= BBOX_METROPOLITANA[1] && lat <= BBOX_METROPOLITANA[3];

function disolver(poligonos: Superficie[]): Superficie | null {
  return poligonos.length === 0 ? null : poligonos.length === 1 ? poligonos[0] : recorteEstable(() => union(featureCollection(poligonos)));
}
function recorteEstable<T>(operacion: () => T): T {
  // Polyclip (motor de Turf) compara distancias al cuadrado al quitar puntos
  // casi colineales. 1e-26 evita picos numéricos sin alterar límites medibles.
  // No queda configuración persistente después de la operación síncrona.
  setPrecision(1e-26);
  try {
    return operacion();
  } catch {
    // Una frontera excepcionalmente corta puede necesitar la precisión exacta.
    setPrecision();
    return operacion();
  } finally { setPrecision(); }
}
const cortar = (a: Superficie, b: Superficie) => recorteEstable(() => intersect(featureCollection([a, b])));
const claveVertice = (p: Position) => p.map(n => n.toFixed(6)).join(',');
function claveArista(a: Position, b: Position): string {
  return [claveVertice(a), claveVertice(b)].sort().join('|');
}

export function calcularTerritorios(desarrollos: readonly Desarrollo[], factorRadio = 1): ResultadoTerritorios {
  if (!Number.isFinite(factorRadio) || factorRadio < 0) throw new Error('El factor de radio debe ser finito y no negativo.');
  const marco = bboxPolygon(BBOX_METROPOLITANA);
  const areaTotalM2 = area(marco);
  const pendientes = desarrollos.filter(d => !estaUbicado(d)).map(d => d.id);
  const ubicados = desarrollos.filter(estaUbicado);
  for (const d of ubicados) {
    if (!Number.isFinite(d.lng) || !Number.isFinite(d.lat) || !Number.isFinite(RADIO_BASE[d.escala])) throw new Error('Coordenadas o escala inválidas: ' + d.id);
  }
  const fueraDeLimites = ubicados.filter(d => !dentroDeLimites(d.lng, d.lat)).map(d => d.id);
  const unicos = new Map<string, DesarrolloUbicado>();
  for (const d of ubicados.filter(d => dentroDeLimites(d.lng, d.lat))) {
    const clave = d.lng + ',' + d.lat;
    const anterior = unicos.get(clave);
    if (anterior && anterior.desarrolladora !== d.desarrolladora) {
      throw new Error('Coordenadas coincidentes entre desarrolladoras: ' + anterior.id + ' y ' + d.id + '. Corrige su ubicación.');
    }
    if (!anterior || RADIO_BASE[d.escala] > RADIO_BASE[anterior.escala]) unicos.set(clave, d);
  }
  const puntos = [...unicos.values()].sort((a, b) => a.id.localeCompare(b.id));
  const porcentajes: Record<string, number> = Object.fromEntries(desarrollos.map(d => [d.desarrolladora, 0]));
  const vacio: ResultadoTerritorios = {
    territorios: featureCollection([]), libre: marco, disputadas: featureCollection([]),
    areaTotalM2, porcentajeLibre: 100, porcentajes, pendientes, fueraDeLimites,
  };
  if (!puntos.length || factorRadio === 0) return vacio;
  const inferior = proyectar(BBOX_METROPOLITANA.slice(0, 2));
  const superior = proyectar(BBOX_METROPOLITANA.slice(2, 4));
  const voronoi = Delaunay.from(puntos.map(d => proyectar([d.lng, d.lat]))).voronoi([...inferior, ...superior]);
  const circulos = puntos.map(d => circle([d.lng, d.lat], RADIO_BASE[d.escala] * factorRadio, { units: 'meters', steps: 96 }));
  const celdas = new Map<string, Superficie[]>();
  const aristas = new Map<string, { indice: number; a: Position; b: Position }>();
  const fronteras: { i: number; j: number; linea: Feature<LineString> }[] = [];

  puntos.forEach((d, i) => {
    const celda = voronoi.cellPolygon(i);
    if (!celda) return;
    const recorte = cortar(polygon([celda.map(desproyectar)]), circulos[i]);
    if (recorte && area(recorte) > 0) {
      const grupo = celdas.get(d.desarrolladora) ?? [];
      grupo.push(recorte);
      celdas.set(d.desarrolladora, grupo);
    }
    // Una arista compartida evita confundir proximidad con una frontera real.
    for (let k = 0; k < celda.length - 1; k++) {
      const a = celda[k], b = celda[k + 1];
      if (claveVertice(a) === claveVertice(b)) continue;
      const clave = claveArista(a, b);
      const vecina = aristas.get(clave);
      if (vecina && puntos[vecina.indice].desarrolladora !== d.desarrolladora) {
        fronteras.push({ i: vecina.indice, j: i, linea: lineString([desproyectar(a), desproyectar(b)]) });
      } else if (!vecina) aristas.set(clave, { indice: i, a, b });
    }
  });

  const territorios = [...celdas].flatMap(([desarrolladora, grupo]) => {
    const territorio = disolver(grupo);
    if (!territorio) return [];
    const areaM2 = area(territorio);
    const porcentaje = areaM2 / areaTotalM2 * 100;
    porcentajes[desarrolladora] = porcentaje;
    return [{ ...territorio, properties: { desarrolladora, areaM2, porcentaje } as PropiedadesTerritorio }];
  });
  const reclamado = disolver(territorios);
  const libre = reclamado ? recorteEstable(() => difference(featureCollection([marco, reclamado]))) : marco;
  const franjas: Superficie[] = [];
  for (const { i, j, linea } of fronteras) {
    let tramos = [linea];
    for (const circulo of [circulos[i], circulos[j]]) {
      tramos = tramos.flatMap(tramo => {
        const partes = lineSplit(tramo, circulo).features;
        return partes.length ? partes : [tramo];
      });
    }
    for (const tramo of tramos) {
      const [a, b] = tramo.geometry.coordinates;
      const centro = point([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]);
      if (!booleanPointInPolygon(centro, circulos[i]) || !booleanPointInPolygon(centro, circulos[j])) continue;
      const franja = buffer(tramo, BUFFER_DISPUTA_METROS, { units: 'meters', steps: 12 });
      const ambos = territorios.filter(t => t.properties.desarrolladora === puntos[i].desarrolladora || t.properties.desarrolladora === puntos[j].desarrolladora);
      const ambito = disolver(ambos);
      const recorte = franja && ambito ? cortar(franja, ambito) : null;
      if (recorte && area(recorte) > 0) franjas.push(recorte);
    }
  }
  const franjaUnida = disolver(franjas);
  const disputa = franjaUnida && libre ? recorteEstable(() => difference(featureCollection([franjaUnida, libre]))) : franjaUnida;
  // Cierra el reparto por conservación: subdividir aristas lon/lat introduce
  // un residuo mínimo en las áreas esféricas de Turf, aunque el recorte sea exacto.
  const porcentajeLibre = Math.max(0, Math.min(100, 100 - Object.values(porcentajes).reduce((suma, valor) => suma + valor, 0)));
  return {
    territorios: featureCollection(territorios), libre,
    // Capa informativa superpuesta: no participa por segunda vez en el reparto.
    disputadas: featureCollection(disputa ? [disputa] : []),
    areaTotalM2, porcentajeLibre,
    porcentajes, pendientes, fueraDeLimites,
  };
}
