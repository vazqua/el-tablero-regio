import type { Figura } from './figuras';
import type { Particion } from './particiones';
import type { siluetas } from './siluetas';

export interface Blason {
  casaId: string;
  silueta: keyof typeof siluetas;
  particion: Particion;
  figuras: readonly [Figura] | readonly [Figura, Figura];
  disposicion: 'centro' | 'jefe' | 'punta';
  lemaOriginal: string;
  lemaLatin: string;
  lemaTraduccion: string;
}

export const blasones = {
  'gm-desarrollos': {
    casaId: 'gm-desarrollos', silueta: 'iberico', particion: 'partido', figuras: ['torre', 'arco'], disposicion: 'centro',
    lemaOriginal: 'Fiesta en el Valle de Oriente',
    lemaLatin: 'Festum Orientis',
    lemaTraduccion: 'La fiesta de Oriente',
  },
  idei: {
    casaId: 'idei', silueta: 'iberico', particion: 'palo', figuras: ['torre'], disposicion: 'centro',
    lemaOriginal: 'El cielo queda de vecino',
    lemaLatin: 'Caelum propinquum',
    lemaTraduccion: 'El cielo cercano',
  },
  'grupo-acosta-verde': {
    casaId: 'grupo-acosta-verde', silueta: 'iberico', particion: 'entero', figuras: ['arco'], disposicion: 'centro',
    lemaOriginal: 'Todos los senderos llevan aquí',
    lemaLatin: 'Omnes semitae huc ducentes',
    lemaTraduccion: 'Todos los senderos que conducen aquí',
  },
  finsa: {
    casaId: 'finsa', silueta: 'iberico', particion: 'cortado', figuras: ['engranaje'], disposicion: 'centro',
    lemaOriginal: 'Este reino mueve la máquina',
    lemaLatin: 'Regnum machinam movens',
    lemaTraduccion: 'El reino que mueve la máquina',
  },
  'gp-vivienda': {
    casaId: 'gp-vivienda', silueta: 'iberico', particion: 'chevron', figuras: ['llave'], disposicion: 'centro',
    lemaOriginal: 'Hogares que avanzan al horizonte',
    lemaLatin: 'Domus ad horizontem tendentes',
    lemaTraduccion: 'Hogares que se extienden hacia el horizonte',
  },
  'grupo-javer': {
    casaId: 'grupo-javer', silueta: 'iberico', particion: 'faja', figuras: ['ladrillo'], disposicion: 'centro',
    lemaOriginal: 'De cuadra en cuadra conquistamos',
    lemaLatin: 'Singulae insulae expugnatae',
    lemaTraduccion: 'Manzanas conquistadas una a una',
  },
  ruba: {
    casaId: 'ruba', silueta: 'iberico', particion: 'tajado', figuras: ['estrella'], disposicion: 'centro',
    lemaOriginal: 'Del norte para el barrio',
    lemaLatin: 'Ab aquilone pro vico',
    lemaTraduccion: 'Desde el norte para el barrio',
  },
  vidusa: {
    casaId: 'vidusa', silueta: 'iberico', particion: 'entero', figuras: ['almena'], disposicion: 'centro',
    lemaOriginal: 'Vivienda masiva, gente contenta',
    lemaLatin: 'Aedes multae, populus laetus',
    lemaTraduccion: 'Muchas viviendas, pueblo contento',
  },
  'grupo-sadasi': {
    casaId: 'grupo-sadasi', silueta: 'iberico', particion: 'cuartelado', figuras: ['llave'], disposicion: 'centro',
    lemaOriginal: 'Heroico hogar, heroica cuna',
    lemaLatin: 'Focus heroum, cunae fortium',
    lemaTraduccion: 'Hogar de héroes, cuna de valientes',
  },
  'proyectos-9': {
    casaId: 'proyectos-9', silueta: 'iberico', particion: 'cortado', figuras: ['columna'], disposicion: 'centro',
    lemaOriginal: 'El centro reclama su corona',
    lemaLatin: 'Centrum coronam vindicans',
    lemaTraduccion: 'El centro que reclama la corona',
  },
  'dm-desarrolladora': {
    casaId: 'dm-desarrolladora', silueta: 'iberico', particion: 'palo', figuras: ['arco'], disposicion: 'centro',
    lemaOriginal: 'El lujo tiene un punto',
    lemaLatin: 'Punctum luxus',
    lemaTraduccion: 'El punto del lujo',
  },
  gim: {
    casaId: 'gim', silueta: 'iberico', particion: 'faja', figuras: ['puente'], disposicion: 'centro',
    lemaOriginal: 'La garza de la alta moda',
    lemaLatin: 'Ardea summae elegantiae',
    lemaTraduccion: 'La garza de la máxima elegancia',
  },
  'altea-desarrollos': {
    casaId: 'altea-desarrollos', silueta: 'iberico', particion: 'tajado', figuras: ['arco', 'rueda'], disposicion: 'centro',
    lemaOriginal: 'Movemos el norte',
    lemaLatin: 'Septentriones cie',
    lemaTraduccion: 'Pon en movimiento el norte',
  },
  'u-calli': {
    casaId: 'u-calli', silueta: 'iberico', particion: 'entero', figuras: ['compás', 'montaña'], disposicion: 'centro',
    lemaOriginal: 'El valle se traza aquí',
    lemaLatin: 'Vallis delineata',
    lemaTraduccion: 'El valle trazado',
  },
} as const satisfies Record<string, Blason>;

export function obtenerBlason(casaId: string): Blason | undefined {
  return (blasones as Record<string, Blason>)[casaId];
}
