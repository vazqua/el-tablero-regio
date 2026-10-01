import { useEffect, useRef, useState } from 'react';
import { Marker, type Map as MapLibreMap } from 'maplibre-gl';
import { estaUbicado } from '../lib/datos';
import { dentroDeLimites } from '../lib/territorios';
import type { Desarrollo, Desarrolladora } from '../types';
import './editor.css';
import { colors } from '../design/tokens';

interface Props {
  mapa: MapLibreMap | null;
  desarrollos: Desarrollo[];
  desarrolladoras: Desarrolladora[];
  actualizar: (desarrollos: Desarrollo[]) => boolean;
}
export default function Editor({ mapa, desarrollos, desarrolladoras, actualizar }: Props) {
  const [seleccionado, setSeleccionado] = useState('');
  const [mensaje, setMensaje] = useState('');
  const actuales = useRef(desarrollos);
  actuales.current = desarrollos;
  const pendientes = desarrollos.filter(d => !estaUbicado(d));
  function coincideConRival(id: string, lng: number, lat: number) {
    const empresa = actuales.current.find(d => d.id === id)?.desarrolladora;
    const rival = actuales.current.find(d => d.desarrolladora !== empresa && d.lng === lng && d.lat === lat);
    if (rival) setMensaje('Coordenadas coincidentes con ' + rival.nombre + '. Elige otra ubicación.');
    return Boolean(rival);
  }
  useEffect(() => {
    if (!mapa) return;
    const marcadores = desarrollos.filter(estaUbicado).filter(d => dentroDeLimites(d.lng, d.lat)).map(d => {
      const elemento = document.createElement('button');
      elemento.className = 'marcador-editor' + (d.verificado ? ' confirmado' : ' sin-confirmar');
      elemento.type = 'button';
      elemento.setAttribute('aria-label', d.nombre + (d.verificado ? ', confirmado' : ', sin confirmar'));
      elemento.title = d.nombre;
      elemento.style.backgroundColor = desarrolladoras.find(e => e.id === d.desarrolladora)?.color ?? colors['neutral-land'];
      const marcador = new Marker({ element: elemento, draggable: true }).setLngLat([d.lng, d.lat]).addTo(mapa);
      const mover = (lng: number, lat: number) => {
        if (!dentroDeLimites(lng, lat)) {
          setMensaje('La ubicación queda fuera del área de estudio.');
          marcador.setLngLat([d.lng, d.lat]);
          return;
        }
        if (coincideConRival(d.id, lng, lat)) { marcador.setLngLat([d.lng, d.lat]); return; }
        const siguientes = actuales.current.map(actual => actual.id === d.id ? { ...actual, lng, lat, verificado: true } : actual);
        if (!actualizar(siguientes)) marcador.setLngLat([d.lng, d.lat]);
        else setMensaje(d.nombre + ': ubicación actualizada.');
      };
      marcador.on('dragend', () => { const { lng, lat } = marcador.getLngLat(); mover(lng, lat); });
      elemento.addEventListener('keydown', e => {
        const pasos: Record<string, [number, number]> = { ArrowLeft: [-0.0001, 0], ArrowRight: [0.0001, 0], ArrowUp: [0, 0.0001], ArrowDown: [0, -0.0001] };
        const paso = pasos[e.key];
        if (!paso) return;
        e.preventDefault();
        mover(d.lng + paso[0], d.lat + paso[1]);
      });
      return marcador;
    });
    return () => marcadores.forEach(m => m.remove());
  }, [mapa, desarrollos, desarrolladoras, actualizar]);

  function ubicar() {
    if (!mapa || !seleccionado) return;
    const { lng, lat } = mapa.getCenter();
    if (!dentroDeLimites(lng, lat)) { setMensaje('El centro del mapa está fuera del área de estudio.'); return; }
    if (coincideConRival(seleccionado, lng, lat)) return;
    if (actualizar(desarrollos.map(d => d.id === seleccionado ? { ...d, lng, lat, verificado: true } : d))) {
      setSeleccionado('');
      setMensaje('Bastión ubicado.');
    }
  }
  function exportar() {
    const url = URL.createObjectURL(new Blob([JSON.stringify(desarrollos, null, 2) + '\n'], { type: 'application/json;charset=utf-8' }));
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = 'desarrollos.json';
    enlace.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMensaje('JSON exportado.');
  }
  return <section className="editor" aria-label="Edición de coordenadas">
    <strong>Edición</strong>
    <label>Pendiente <select aria-label="Pendiente" value={seleccionado} onChange={e => setSeleccionado(e.target.value)}>
      <option value="">Seleccionar Bastión</option>
      {pendientes.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
    </select></label>
    <button disabled={!mapa || !seleccionado} onClick={ubicar}>Ubicar en el centro</button>
    <button onClick={exportar}>Exportar JSON</button>
    <span role="status">{mensaje}</span>
  </section>;
}
