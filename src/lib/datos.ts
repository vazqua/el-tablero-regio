import { CONFIANZAS, ESCALAS, TIPOS } from '../types';
import type { Desarrollo, Desarrolladora, DesarrolloUbicado } from '../types';

function objeto(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function texto(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}
function numeroONull(value: unknown, min: number, max: number): boolean {
  return value === null || (typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max);
}
export function estaUbicado(d: Desarrollo): d is DesarrolloUbicado {
  return d.lat !== null && d.lng !== null;
}
export function validarDatos(datos: unknown, empresas: unknown): {
  desarrollos: Desarrollo[]; desarrolladoras: Desarrolladora[]; pendientes: Desarrollo[];
} {
  if (!Array.isArray(datos) || !Array.isArray(empresas)) throw new Error('Los archivos de datos deben contener arreglos JSON.');
  const errores: string[] = [];
  const idsEmpresas = new Set<string>();
  empresas.forEach((e: unknown, i) => {
    if (!objeto(e)) { errores.push('Desarrolladora inválida en fila ' + i); return; }
    for (const campo of ['id', 'nombre', 'representante', 'color', 'descripcion']) {
      if (!texto(e[campo])) errores.push('Desarrolladora ' + i + ': falta ' + campo);
    }
    if (typeof e.color !== 'string' || !/^#[0-9a-f]{6}$/i.test(e.color)) errores.push('Color inválido en desarrolladora ' + i);
    if (texto(e.id)) {
      if (idsEmpresas.has(e.id)) errores.push('Desarrolladora duplicada: ' + e.id);
      idsEmpresas.add(e.id);
    }
  });
  const ids = new Set<string>();
  datos.forEach((d: unknown, i) => {
    if (!objeto(d)) { errores.push('Desarrollo inválido en fila ' + i); return; }
    const etiqueta = typeof d.id === 'string' ? d.id : String(i);
    for (const campo of ['id', 'nombre', 'desarrolladora', 'municipio', 'colonia', 'direccion', 'descripcion', 'fuente']) {
      if (!texto(d[campo])) errores.push(etiqueta + ': falta ' + campo);
    }
    if (texto(d.id)) {
      if (ids.has(d.id)) errores.push('Desarrollo duplicado: ' + d.id);
      ids.add(d.id);
    }
    if (typeof d.desarrolladora !== 'string' || !idsEmpresas.has(d.desarrolladora)) errores.push(etiqueta + ': desarrolladora desconocida');
    if (!(TIPOS as readonly unknown[]).includes(d.tipo)) errores.push(etiqueta + ': tipo inválido');
    if (!(ESCALAS as readonly unknown[]).includes(d.escala)) errores.push(etiqueta + ': escala inválida');
    if (!(CONFIANZAS as readonly unknown[]).includes(d.confianza)) errores.push(etiqueta + ': confianza inválida');
    if (!numeroONull(d.lat, -90, 90) || !numeroONull(d.lng, -180, 180)) errores.push(etiqueta + ': coordenadas inválidas');
    if (d.anio !== null && !(typeof d.anio === 'number' && Number.isInteger(d.anio) && d.anio >= 0 && d.anio <= 9999)) errores.push(etiqueta + ': año inválido');
    if (typeof d.verificado !== 'boolean') errores.push(etiqueta + ': verificado debe ser booleano');
  });
  if (errores.length) throw new Error('Datos inválidos:\n' + errores.join('\n'));
  const desarrollos = datos as Desarrollo[];
  return { desarrollos, desarrolladoras: empresas as Desarrolladora[], pendientes: desarrollos.filter(d => !estaUbicado(d)) };
}

