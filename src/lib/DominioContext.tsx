import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { validarDatos } from './datos';
import { useTerritorios } from './useTerritorios';
import datos from '../data/desarrollos.json';
import empresas from '../data/desarrolladoras.json';

function useEstadoDominio() {
  const inicial = useMemo(() => {
    const validado = validarDatos(datos, empresas);
    if (validado.pendientes.length) {
      console.info(validado.pendientes.length + ' desarrollos pendientes de ubicar; excluidos del cálculo.');
      console.table(validado.pendientes.map(({ id, nombre, lat, lng }) => ({ id, nombre, lat, lng })));
    }
    return validado;
  }, []);
  const [desarrollos, setDesarrollos] = useState(inicial.desarrollos);
  const [factor, setFactor] = useState(1);
  const territorios = useTerritorios(desarrollos, factor);
  return { inicial, desarrollos, setDesarrollos, factor, setFactor, ...territorios };
}
const DominioContext = createContext<ReturnType<typeof useEstadoDominio> | null>(null);
export function DominioProvider({ children }: { children: ReactNode }) {
  const estado = useEstadoDominio();
  return <DominioContext.Provider value={estado}>{children}</DominioContext.Provider>;
}
export function useDominio() {
  const estado = useContext(DominioContext);
  if (!estado) throw new Error('Falta el proveedor de datos de Dominio MTY.');
  return estado;
}
