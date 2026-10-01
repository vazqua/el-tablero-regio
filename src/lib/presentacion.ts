import type { Desarrollo } from '../types';

export const NOMBRES_TIPO: Record<Desarrollo['tipo'], string> = {
  'residencial-alta-densidad': 'Residencial vertical',
  'residencial-baja-densidad': 'Residencial horizontal',
  oficinas: 'Oficinas', comercial: 'Comercial', 'uso-mixto': 'Uso mixto', industrial: 'Industrial',
};
export const porcentaje = (n: number) => n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' %';
export const numero = (n: number) => n.toLocaleString('es-MX', { maximumFractionDigits: 1 });
export const nombreCorto = (nombre: string) => nombre.replace(/\s*\(.*\)/, '').replace('Grupo Inmobiliario Monterrey', 'GIM').replace('DM Desarrolladora de Proyectos', 'DM Desarrolladora');

