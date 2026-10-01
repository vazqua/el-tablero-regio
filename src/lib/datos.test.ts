import { describe, expect, it } from 'vitest';
import { validarDatos } from './datos';
import datos from '../data/desarrollos.json';
import empresas from '../data/desarrolladoras.json';

describe('validación al cargar', () => {
  it('acepta los datos reales', () => expect(validarDatos(datos, empresas).desarrolladoras).toHaveLength(empresas.length));
  it.each([
    { lat: 91 }, { lng: -181 }, { lat: '25.68' }, { lng: NaN }, { tipo: 'torre' },
    { escala: 'enorme' }, { confianza: 'segura' }, { anio: 2020.5 }, { verificado: 'false' },
    { desarrolladora: 'inexistente' }, { nombre: '' }, { lat: undefined },
  ])('rechaza campos inválidos: %j', cambio => {
    expect(() => validarDatos([{ ...datos[0], ...cambio }], empresas)).toThrow('Datos inválidos');
  });
  it('rechaza IDs duplicados y colores inválidos', () => {
    expect(() => validarDatos([datos[0], datos[0]], empresas)).toThrow('duplicado');
    expect(() => validarDatos([], [empresas[0], empresas[0]])).toThrow('duplicada');
    expect(() => validarDatos([], [{ ...empresas[0], color: 'red' }])).toThrow('Color inválido');
  });
  it('excluye de los ubicados ambos casos de coordenadas parciales', () => {
    expect(validarDatos([{ ...datos[0], lat: 25.68, lng: null }], empresas).pendientes).toHaveLength(1);
    expect(validarDatos([{ ...datos[0], lng: -100.3, lat: null }], empresas).pendientes).toHaveLength(1);
  });
});
