import type { Feature, FeatureCollection, MultiPolygon, Polygon } from 'geojson';

export const TIPOS = ['residencial-alta-densidad', 'residencial-baja-densidad', 'oficinas', 'comercial', 'uso-mixto', 'industrial'] as const;
export const ESCALAS = ['hito', 'grande', 'mediano', 'chico'] as const;
export const CONFIANZAS = ['alta', 'media', 'baja'] as const;

export interface Desarrollo {
  id: string;
  nombre: string;
  desarrolladora: string;
  tipo: typeof TIPOS[number];
  escala: typeof ESCALAS[number];
  municipio: string;
  colonia: string;
  direccion: string;
  lat: number | null;
  lng: number | null;
  anio: number | null;
  descripcion: string;
  confianza: typeof CONFIANZAS[number];
  fuente: string;
  verificado: boolean;
}
export type DesarrolloUbicado = Desarrollo & { lat: number; lng: number };
export interface Desarrolladora {
  id: string;
  nombre: string;
  representante: string;
  color: string;
  descripcion: string;
}
export type Superficie = Feature<Polygon | MultiPolygon>;
export interface PropiedadesTerritorio {
  desarrolladora: string;
  areaM2: number;
  porcentaje: number;
}
export interface ResultadoTerritorios {
  territorios: FeatureCollection<Polygon | MultiPolygon, PropiedadesTerritorio>;
  libre: Superficie | null;
  disputadas: FeatureCollection<Polygon | MultiPolygon>;
  areaTotalM2: number;
  porcentajeLibre: number;
  porcentajes: Record<string, number>;
  pendientes: string[];
  fueraDeLimites: string[];
}

