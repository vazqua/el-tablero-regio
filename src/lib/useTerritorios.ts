import { useEffect, useRef, useState } from 'react';
import type { Desarrollo, ResultadoTerritorios } from '../types';

interface Solicitud { id: number; desarrollos: Desarrollo[]; factor: number }
interface Respuesta { id: number; factor: number; resultado?: ResultadoTerritorios; error?: string }
export function useTerritorios(desarrollos: Desarrollo[], factor: number) {
  const worker = useRef<Worker | null>(null);
  const ocupado = useRef(false);
  const pendiente = useRef<Solicitud | null>(null);
  const ultimo = useRef(0);
  const [estado, setEstado] = useState<{ resultado: ResultadoTerritorios | null; factorAplicado: number; calculando: boolean; error: string }>({ resultado: null, factorAplicado: 1, calculando: true, error: '' });
  useEffect(() => {
    const hilo = new Worker(new URL('./territorios.worker.ts', import.meta.url), { type: 'module' });
    worker.current = hilo;
    hilo.onmessage = ({ data }: MessageEvent<Respuesta>) => {
      ocupado.current = false;
      if (data.id === ultimo.current) {
        setEstado(anterior => ({ resultado: data.resultado ?? anterior.resultado, factorAplicado: data.resultado ? data.factor : anterior.factorAplicado, calculando: false, error: data.error ?? '' }));
      }
      if (pendiente.current) {
        ocupado.current = true;
        hilo.postMessage(pendiente.current);
        pendiente.current = null;
      }
    };
    hilo.onerror = () => {
      ocupado.current = false;
      setEstado(anterior => ({ ...anterior, calculando: false, error: 'No se pudo iniciar el cálculo. Recarga el mapa para volver a intentarlo.' }));
    };
    return () => { hilo.terminate(); worker.current = null; ocupado.current = false; pendiente.current = null; };
  }, []);
  useEffect(() => {
    const solicitud = { id: ++ultimo.current, desarrollos, factor };
    pendiente.current = null;
    setEstado(anterior => ({ ...anterior, calculando: true, error: '' }));
    // Durante el arrastre solo se encola el alcance más reciente.
    const timer = window.setTimeout(() => {
      if (ocupado.current) pendiente.current = solicitud;
      else { ocupado.current = true; worker.current?.postMessage(solicitud); }
    }, 100);
    return () => window.clearTimeout(timer);
  }, [desarrollos, factor]);
  return estado;
}

