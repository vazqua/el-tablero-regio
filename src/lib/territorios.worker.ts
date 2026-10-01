import { calcularTerritorios } from './territorios';
import type { Desarrollo } from '../types';
self.onmessage = ({ data }: MessageEvent<{ id: number; desarrollos: Desarrollo[]; factor: number }>) => {
  try {
    self.postMessage({ id: data.id, factor: data.factor, resultado: calcularTerritorios(data.desarrollos, data.factor) });
  } catch (error) {
    self.postMessage({ id: data.id, error: error instanceof Error ? error.message : 'No se pudieron calcular los territorios.' });
  }
};

