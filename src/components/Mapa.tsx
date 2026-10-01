import { useEffect, useRef, useState } from 'react';
import { Map as MapLibreMap, Marker, Popup, setWorkerUrl, type GeoJSONSource } from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import { renderToStaticMarkup } from 'react-dom/server';
import { featureCollection } from '@turf/turf';
import type { Feature, Polygon, MultiPolygon } from 'geojson';
import type { Desarrollo, Desarrolladora, ResultadoTerritorios } from '../types';
import { dentroDeLimites } from '../lib/territorios';
import { estaUbicado } from '../lib/datos';
import { nombreCorto, porcentaje } from '../lib/presentacion';
import { colors } from '../design/tokens';
import IconoTipo from './IconoTipo';
import { Estandarte } from './escudo/Escudo';
import Castillo from './castillos/Castillo';
import { centroEstandarte } from './escudo/centroEstandarte';
import { posicionarTooltip } from './escudo/posicionarTooltip';
setWorkerUrl(workerUrl);

interface Props {
  resultado: ResultadoTerritorios | null; desarrollos: Desarrollo[]; desarrolladoras: Desarrolladora[];
  empresaActiva: string | null; desarrolloActivo: string | null; marcadoresVisibles: boolean; modoEdicion: boolean;
  onReady: (map: MapLibreMap) => void; onDesarrollo: (id: string) => void;
}
function rayas() {
  const width = 12, height = 12, data = new Uint8Array(width * height * 4);
  const rgb = colors.border.slice(1).match(/../g)!.map(v => parseInt(v, 16));
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const i = (y * width + x) * 4;
    data[i] = rgb[0]; data[i + 1] = rgb[1]; data[i + 2] = rgb[2]; data[i + 3] = (x + y) % 12 < 4 ? 205 : 0;
  }
  return { width, height, data };
}
function superficies(resultado: ResultadoTerritorios, empresas: Desarrolladora[]) {
  const catalogo = new globalThis.Map(empresas.map(e => [e.id, e]));
  const features: Feature<Polygon | MultiPolygon>[] = resultado.territorios.features.map(f => ({
    ...f, id: f.properties.desarrolladora,
    properties: { ...f.properties, clase: 'dominio', color: catalogo.get(f.properties.desarrolladora)?.color ?? colors['neutral-land'] },
  }));
  if (resultado.libre) features.push({ ...resultado.libre, id: 'libre', properties: { clase: 'libre' } });
  resultado.disputadas.features.forEach((f, i) => features.push({ ...f, id: 'disputa-' + i, properties: { clase: 'disputa' } }));
  return featureCollection(features);
}
export default function Mapa(props: Props) {
  const contenedor = useRef<HTMLDivElement>(null), mapa = useRef<MapLibreMap | null>(null);
  const actuales = useRef(props), activo = useRef(0), animacion = useRef(0), tieneDatos = useRef(false);
  const marcadores = useRef<{ id: string; marcador: Marker; elemento: HTMLButtonElement }[]>([]);
  const hover = useRef<string | null>(null), popup = useRef<Popup | null>(null);
  const estandartes = useRef<Marker[]>([]);
  const retirarEstandartes = () => { estandartes.current.forEach(m => m.remove()); estandartes.current = []; };
  const [listo, setListo] = useState(false), [error, setError] = useState('');
  actuales.current = props;

  useEffect(() => {
    if (!contenedor.current) return;
    let limpiarHover = () => {};
    let contenidoHover = '';
    let map: MapLibreMap;
    try {
      map = new MapLibreMap({
        container: contenedor.current,
        style: { version: 8,
          sources: { base: { type: 'raster', tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'], tileSize: 256, maxzoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' } },
          layers: [
            { id: 'fondo', type: 'background', paint: { 'background-color': colors.bg } },
            { id: 'base', type: 'raster', source: 'base', paint: { 'raster-saturation': -1, 'raster-contrast': -0.15, 'raster-brightness-min': 0.22, 'raster-opacity': 0.88 } },
          ],
        },
        center: [-100.30, 25.75], zoom: window.innerWidth < 700 ? 9.75 : 10.55,
        minZoom: 8, maxZoom: 18, maxBounds: [[-101.1, 25.15], [-99.6, 26.35]],
        canvasContextAttributes: { preserveDrawingBuffer: true },
        locale: { 'Map.Title': 'Mapa de dominios de Monterrey', 'AttributionControl.ToggleAttribution': 'Créditos del mapa' },
      });
    } catch { setError('No se pudo iniciar el mapa. Revisa que WebGL esté disponible.'); return; }
    mapa.current = map;
    map.on('error', e => {
      if ('sourceId' in e && e.sourceId === 'base') setError('El mapa base no está disponible. Los territorios siguen en juego.');
      else { console.error(e.error); setError('No se pudo dibujar una parte del mapa. Recarga para volver a intentarlo.'); }
    });
    map.on('style.load', () => {
      map.addImage('rayas-disputa', rayas());
      for (const slot of [0, 1]) {
        const source = 'superficies-' + slot;
        // Conserva los IDs de texto al generar teselas para hover y selección.
        map.addSource(source, { type: 'geojson', promoteId: 'desarrolladora', data: featureCollection([]) });
        map.addLayer({ id: 'libre-' + slot, type: 'fill', source, filter: ['==', 'clase', 'libre'], paint: { 'fill-color': colors['neutral-land'], 'fill-opacity': 0 } });
        map.addLayer({ id: 'territorios-' + slot, type: 'fill', source, filter: ['==', 'clase', 'dominio'], paint: { 'fill-color': ['get', 'color'], 'fill-opacity': 0, 'fill-opacity-transition': { duration: 0 } } });
        map.addLayer({ id: 'fronteras-' + slot, type: 'line', source, filter: ['==', 'clase', 'dominio'], paint: { 'line-color': colors.border, 'line-width': ['interpolate', ['linear'], ['zoom'], 9, 2, 12, 3], 'line-opacity': 0, 'line-opacity-transition': { duration: 0 } } });
        map.addLayer({ id: 'disputadas-' + slot, type: 'fill', source, filter: ['==', 'clase', 'disputa'], paint: { 'fill-pattern': 'rayas-disputa', 'fill-opacity': 0, 'fill-opacity-transition': { duration: 0 } } });
      }
      popup.current = new Popup({ closeButton: false, closeOnClick: false, className: 'territory-tooltip', anchor: 'top-left', offset: 0 });
      map.on('mousemove', e => {
        const f = map.queryRenderedFeatures(e.point, { layers: ['territorios-' + activo.current] })[0];
        const boton = (e.originalEvent?.target as HTMLElement | undefined)?.closest?.('.development-marker');
        const desarrollo = actuales.current.desarrollos.find(d => d.id === boton?.getAttribute('data-desarrollo'));
        const id = boton?.getAttribute('data-casa') ?? f?.properties?.desarrolladora as string | undefined;
        if (hover.current !== (id ?? null)) {
          retirarEstandartes();
          if (hover.current) for (const slot of [0, 1]) map.setFeatureState({ source: 'superficies-' + slot, id: hover.current }, { hover: false });
          hover.current = id ?? null;
          if (id) for (const slot of [0, 1]) map.setFeatureState({ source: 'superficies-' + slot, id }, { hover: true });
          const territorio = actuales.current.resultado?.territorios.features.find(t => t.properties.desarrolladora === id);
          if (id && territorio) {
            const bastiones = actuales.current.desarrollos.filter(estaUbicado).filter(d => d.desarrolladora === id && dentroDeLimites(d.lng, d.lat)).map(d => [d.lng, d.lat] as [number, number]);
            const centro = centroEstandarte(territorio, bastiones);
            const plantar = (posicion: [number, number], size: number, clase: string, indice: number) => {
              const elemento = document.createElement('div');
              elemento.className = clase;
              elemento.setAttribute('aria-hidden', 'true');
              elemento.innerHTML = renderToStaticMarkup(<Estandarte casaId={id} size={size} />, { identifierPrefix: 'hover-' + indice + '-' });
              elemento.dataset.lng = String(posicion[0]); elemento.dataset.lat = String(posicion[1]);
              estandartes.current.push(new Marker({ element: elemento, anchor: 'bottom-left', offset: [-size * .08, 0] }).setLngLat(posicion).addTo(map));
            };
            plantar(centro, 88, 'territory-standard', 0);
            bastiones.forEach((p, i) => plantar(p, 44, 'bastion-standard', i + 1));
          }
        }
        // El Bastion puede cambiar sin salir del territorio de una misma Casa.
        const claveContenido = id + ':' + (desarrollo?.id ?? '');
        const empresa = actuales.current.desarrolladoras.find(d => d.id === id);
        if (empresa && (contenidoHover !== claveContenido || !popup.current?.isOpen())) {
          const content = document.createElement('div');
          content.innerHTML = renderToStaticMarkup(<div className="territory-tooltip-body" role="tooltip">
            <Castillo casaId={empresa.id} nombre={empresa.nombre} contexto="tooltip" />
            <div>
              <strong>{desarrollo?.nombre ?? nombreCorto(empresa.nombre)}</strong>
              {desarrollo && <span className="tooltip-casa">{nombreCorto(empresa.nombre)}</span>}
              <span className="tooltip-meta">{porcentaje(actuales.current.resultado?.porcentajes[empresa.id] ?? 0)} del territorio</span>
            </div>
          </div>);
          contenidoHover = claveContenido;
          popup.current?.setLngLat(e.lngLat).setDOMContent(content).addTo(map);
        }
        map.getCanvas().style.cursor = id ? 'pointer' : '';
        if (id && popup.current) {
          const marco = map.getContainer().getBoundingClientRect(), globo = popup.current.getElement();
          const controles = map.getContainer().parentElement?.querySelectorAll<HTMLElement>('.map-heading, .search-box, .map-tools, .influence-control, .detail-sheet, .mini-legend, .mobile-ranking') ?? [];
          const obstaculos = [...estandartes.current.map(m => m.getElement()), ...controles].map(el => {
            const b = el.getBoundingClientRect();
            return { x: b.left - marco.left, y: b.top - marco.top, width: b.width, height: b.height };
          }).filter(b => b.width && b.height && b.x + b.width > 0 && b.y + b.height > 0 && b.x < marco.width && b.y < marco.height);
          const posicion = posicionarTooltip(e.point, globo.offsetWidth, globo.offsetHeight, marco, obstaculos);
          popup.current.setLngLat(map.unproject([posicion.x, posicion.y]));
        } else popup.current?.remove();
      });
      limpiarHover = () => {
        popup.current?.remove();
        retirarEstandartes();
        if (hover.current) for (const slot of [0, 1]) map.setFeatureState({ source: 'superficies-' + slot, id: hover.current }, { hover: false });
        hover.current = null;
      };
      map.getContainer().addEventListener('mouseleave', limpiarHover);
      map.on('movestart', limpiarHover);
      map.on('click', e => {
        const f = map.queryRenderedFeatures(e.point, { layers: ['territorios-' + activo.current] })[0];
        if (!f?.properties) return;
        const propios = actuales.current.desarrollos.filter(estaUbicado).filter(d => d.desarrolladora === f.properties.desarrolladora);
        const distancia = (d: Desarrollo & { lng: number; lat: number }) => ((d.lng - e.lngLat.lng) * Math.cos(e.lngLat.lat * Math.PI / 180)) ** 2 + (d.lat - e.lngLat.lat) ** 2;
        const cercano = propios.sort((a, b) => distancia(a) - distancia(b))[0];
        if (cercano) actuales.current.onDesarrollo(cercano.id);
        popup.current?.remove();
        retirarEstandartes();
        if (hover.current) for (const slot of [0, 1]) map.setFeatureState({ source: 'superficies-' + slot, id: hover.current }, { hover: false });
        hover.current = null;
      });
      setListo(true); actuales.current.onReady(map);
    });
    const observer = new ResizeObserver(() => map.resize());
    observer.observe(contenedor.current);
    return () => { observer.disconnect(); map.getContainer().removeEventListener('mouseleave', limpiarHover); cancelAnimationFrame(animacion.current); popup.current?.remove(); retirarEstandartes(); mapa.current = null; map.remove(); };
  }, []);

  useEffect(() => {
    const map = mapa.current;
    if (!listo || !map || !props.resultado) return;
    retirarEstandartes(); popup.current?.remove();
    if (hover.current) for (const slot of [0, 1]) map.setFeatureState({ source: 'superficies-' + slot, id: hover.current }, { hover: false });
    hover.current = null;
    let cancelado = false;
    const anterior = activo.current, siguiente = tieneDatos.current ? 1 - anterior : anterior;
    const pintar = (slot: number, alpha: number) => {
      map.setPaintProperty('libre-' + slot, 'fill-opacity', alpha * 0.08);
      map.setPaintProperty('territorios-' + slot, 'fill-opacity', ['*', alpha, ['case', ['boolean', ['feature-state', 'dimmed'], false], 0.12, ['boolean', ['feature-state', 'hover'], false], 0.92, ['boolean', ['feature-state', 'selected'], false], 0.88, 0.65]]);
      map.setPaintProperty('fronteras-' + slot, 'line-opacity', ['*', alpha, ['case', ['boolean', ['feature-state', 'dimmed'], false], 0.18, 1]]);
      map.setPaintProperty('disputadas-' + slot, 'fill-opacity', alpha * 0.65);
    };
    const actualizar = async () => {
      try {
        await (map.getSource('superficies-' + siguiente) as GeoJSONSource).setData(superficies(props.resultado!, props.desarrolladoras));
        if (cancelado) return;
        for (const empresa of actuales.current.desarrolladoras) {
          map.setFeatureState({ source: 'superficies-' + siguiente, id: empresa.id }, { selected: empresa.id === actuales.current.empresaActiva, dimmed: Boolean(actuales.current.empresaActiva && empresa.id !== actuales.current.empresaActiva) });
        }
        const animar = tieneDatos.current && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        tieneDatos.current = true; activo.current = siguiente;
        const inicio = performance.now();
        const frame = (ahora: number) => {
          if (cancelado) return;
          const t = animar ? Math.min(1, (ahora - inicio) / 320) : 1, suave = t * t * (3 - 2 * t);
          if (anterior !== siguiente) pintar(anterior, 1 - suave);
          pintar(siguiente, suave);
          if (t < 1) animacion.current = requestAnimationFrame(frame);
          else contenedor.current?.setAttribute('data-rendered', 'true');
        };
        animacion.current = requestAnimationFrame(frame);
      } catch (e) { if (!cancelado) { console.error(e); setError('No se pudo actualizar el territorio.'); } }
    };
    void actualizar();
    return () => { cancelado = true; cancelAnimationFrame(animacion.current); if (mapa.current) { pintar(activo.current, 1); pintar(1 - activo.current, 0); } };
  }, [listo, props.resultado, props.desarrolladoras]);

  useEffect(() => {
    const map = mapa.current;
    if (!listo || !map) return;
    retirarEstandartes(); popup.current?.remove();
    if (hover.current) for (const slot of [0, 1]) map.setFeatureState({ source: 'superficies-' + slot, id: hover.current }, { hover: false });
    hover.current = null;
    for (const slot of [0, 1]) {
      for (const empresa of props.desarrolladoras) {
        map.setFeatureState({ source: 'superficies-' + slot, id: empresa.id }, { selected: empresa.id === props.empresaActiva, dimmed: Boolean(props.empresaActiva && empresa.id !== props.empresaActiva) });
      }
    }
  }, [listo, props.empresaActiva, props.desarrolloActivo, props.desarrolladoras]);

  useEffect(() => {
    const map = mapa.current;
    if (!listo || !map || props.modoEdicion) return;
    marcadores.current = props.desarrollos.filter(estaUbicado).filter(d => dentroDeLimites(d.lng, d.lat)).map(d => {
      const elemento = document.createElement('button');
      elemento.type = 'button'; elemento.className = 'development-marker';
      elemento.dataset.casa = d.desarrolladora;
      elemento.dataset.desarrollo = d.id;
      elemento.setAttribute('aria-label', 'Ver ' + d.nombre);
      elemento.style.setProperty('--marker-color', props.desarrolladoras.find(e => e.id === d.desarrolladora)?.color ?? colors['neutral-land']);
      elemento.innerHTML = renderToStaticMarkup(<IconoTipo tipo={d.tipo} size={15} />);
      elemento.addEventListener('click', e => { e.stopPropagation(); actuales.current.onDesarrollo(d.id); });
      const marcador = new Marker({ element: elemento }).setLngLat([d.lng, d.lat]).addTo(map);
      elemento.addEventListener('mouseenter', e => map.fire('mousemove', {
        point: map.project(marcador.getLngLat()), lngLat: marcador.getLngLat(), originalEvent: e,
      }));
      return { id: d.id, marcador, elemento };
    });
    const zoom = () => contenedor.current?.setAttribute('data-zoom', map.getZoom() < 11 ? 'far' : 'near');
    zoom(); map.on('zoom', zoom);
    return () => { map.off('zoom', zoom); marcadores.current.forEach(m => m.marcador.remove()); marcadores.current = []; };
  }, [listo, props.desarrollos, props.desarrolladoras, props.modoEdicion]);

  useEffect(() => {
    marcadores.current.forEach(({ id, elemento, marcador }) => {
      elemento.classList.toggle('is-selected', id === props.desarrolloActivo);
      const atenuado = Boolean(props.empresaActiva && props.desarrollos.find(d => d.id === id)?.desarrolladora !== props.empresaActiva);
      elemento.classList.toggle('is-dimmed', atenuado);
      marcador.setOpacity(atenuado ? 0.24 : 1);
      elemento.hidden = !props.marcadoresVisibles;
    });
  }, [listo, props.marcadoresVisibles, props.desarrolloActivo, props.empresaActiva, props.desarrollos]);
  return <><div ref={contenedor} className="mapa" aria-label="Mapa de territorios de Monterrey" />{error && <p className="aviso-mapa" role="status">{error}</p>}</>;
}
