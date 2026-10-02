import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import type { Map as MapLibreMap } from 'maplibre-gl';
import { ArrowUpRight, Check, ChevronDown, Compass, Crown, LoaderCircle, Minus, Palette, Plus, Search, Target, X } from 'lucide-react';
import IconoBastion from '../components/IconoBastion';
import { useDominio } from '../lib/DominioContext';
import { useSearchParams } from 'react-router';
import { nombreCorto, porcentaje } from '../lib/presentacion';
import type { Desarrollo } from '../types';
import Mapa from '../components/Mapa';
import PanelDetalle, { type Seleccion } from '../components/PanelDetalle';
import IconoTipo from '../components/IconoTipo';
import IconoAlcance from '../components/IconoAlcance';
import Escudo from '../components/escudo/Escudo';
import FiltrosBastiones from '../components/FiltrosBastiones';
import SugerenciaExploracion from '../components/SugerenciaExploracion';
import { vistaMetropolitana } from '../lib/vistaMapa';

const Editor = import.meta.env.DEV ? lazy(() => import('../dev/Editor')) : null;


export default function PaginaMapa() {
  const { inicial, desarrollos, setDesarrollos, factor, setFactor, resultado, calculando, error, factorAplicado } = useDominio();
  const [params, setParams] = useSearchParams();
  const modoEdicion = import.meta.env.DEV && params.get('edit') === '1';
  const empresaUrl = inicial.desarrolladoras.find(e => e.id === params.get('empresa'));
  const desarrolloUrl = desarrollos.find(d => d.id === params.get('desarrollo'));
  const seleccion: Seleccion | null = desarrolloUrl ? { tipo: 'desarrollo', id: desarrolloUrl.id } : empresaUrl ? { tipo: 'empresa', id: empresaUrl.id } : null;
  const [mapa, setMapa] = useState<MapLibreMap | null>(null);
  const [tab, setTab] = useState<'dominancia' | 'leyenda'>('dominancia');
  const [panelMovil, setPanelMovil] = useState(false);
  const [esMovil, setEsMovil] = useState(() => window.matchMedia('(max-width: 900px)').matches);
  const abrirCorona = useRef<HTMLButtonElement>(null);
  const cerrarCorona = useRef<HTMLButtonElement>(null);
  useEffect(() => { if (panelMovil) cerrarCorona.current?.focus(); }, [panelMovil]);
  useEffect(() => {
    const mobile = window.matchMedia('(max-width: 900px)');
    const cambiar = () => { setEsMovil(mobile.matches); if (!mobile.matches) setPanelMovil(false); };
    mobile.addEventListener('change', cambiar);
    return () => mobile.removeEventListener('change', cambiar);
  }, []);
  const [marcadores, setMarcadores] = useState(true);
  const [tiposActivos, setTiposActivos] = useState<Desarrollo['tipo'][]>([]);
  const [municipioActivo, setMunicipioActivo] = useState('');
  const bastionesDestacados = useMemo(() => tiposActivos.length || municipioActivo
    ? new Set(desarrollos.filter(d => (!tiposActivos.length || tiposActivos.includes(d.tipo)) && (!municipioActivo || d.municipio === municipioActivo)).map(d => d.id))
    : null, [desarrollos, tiposActivos, municipioActivo]);
  const cambiarTipo = (tipo: Desarrollo['tipo']) => {
    setTiposActivos(prev => prev.includes(tipo) ? prev.filter(t => t !== tipo) : [...prev, tipo]);
    setMarcadores(true);
  };
  const [busqueda, setBusqueda] = useState('');
  const [buscando, setBuscando] = useState(false);
  const origenFoco = useRef<HTMLElement | null>(null);
  const ranking = useMemo(() => inicial.desarrolladoras.map(e => ({
    ...e, porcentaje: resultado?.porcentajes[e.id] ?? 0,
    total: desarrollos.filter(d => d.desarrolladora === e.id).length,
  })).sort((a, b) => b.porcentaje - a.porcentaje || a.nombre.localeCompare(b.nombre)), [inicial, desarrollos, resultado]);
  const maximo = ranking[0]?.porcentaje || 1;
  const libre = resultado?.porcentajeLibre ?? 100;
  const empresaActiva = seleccion?.tipo === 'empresa' ? seleccion.id : desarrollos.find(d => d.id === seleccion?.id)?.desarrolladora ?? null;
  const resultadosBusqueda = desarrollos.filter(d => (d.nombre + ' ' + d.municipio).toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(busqueda.toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g, ''))).slice(0, 8);
  const actualizar = useCallback((siguientes: Desarrollo[]) => { setDesarrollos(siguientes); return true; }, []);
  const seleccionar = useCallback((valor: Seleccion) => {
    origenFoco.current = document.activeElement as HTMLElement;
    setParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('empresa', valor.tipo === 'empresa' ? valor.id : desarrollos.find(d => d.id === valor.id)!.desarrolladora);
      if (valor.tipo === 'desarrollo') next.set('desarrollo', valor.id); else next.delete('desarrollo');
      return next;
    });
    setPanelMovil(false); setBuscando(false); setBusqueda('');
  }, [setParams, desarrollos]);
  const cerrar = useCallback(() => {
    setParams(prev => { const next = new URLSearchParams(prev); next.delete('empresa'); next.delete('desarrollo'); return next; });
    origenFoco.current?.focus();
  }, [setParams]);
  const localizar = useCallback((d: Desarrollo) => {
    if (d.lng === null || d.lat === null) return;
    mapa?.easeTo({ center: [d.lng, d.lat], zoom: 13.4, duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 650,
      padding: window.innerWidth > 900 ? { right: 360, left: 25, top: 20, bottom: 110 } : { right: 0, left: 0, top: 0, bottom: (mapa?.getContainer().clientHeight ?? window.innerHeight) * 0.65 } });
  }, [mapa]);
  const restablecerVista = () => mapa?.easeTo({ ...vistaMetropolitana(window.innerWidth <= 900), padding: { top: 0, right: 0, bottom: 0, left: 0 }, duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 600 });
  useEffect(() => {
    const escape = (e: KeyboardEvent) => { if (e.key === 'Escape') { cerrar(); setBuscando(false); setPanelMovil(false); if (panelMovil) requestAnimationFrame(() => abrirCorona.current?.focus()); } };
    window.addEventListener('keydown', escape); return () => window.removeEventListener('keydown', escape);
  }, [cerrar, panelMovil]);
  return <>
    {modoEdicion && Editor && <Suspense fallback={<div role="status">Cargando editor...</div>}><Editor mapa={mapa} desarrollos={desarrollos} desarrolladoras={inicial.desarrolladoras} actualizar={actualizar} /></Suspense>}
    <main className="workspace">
      <aside id="ranking-panel" className={'ranking-panel' + (panelMovil ? ' mobile-open' : '')} aria-label="La Corona y simbología">
        <div className="ranking-heading"><div className="ranking-guide"><h2 className="ranking-guide-title">¿Cómo explorar el mapa?</h2><p>Explora las Casas y sus Bastiones. Busca un proyecto, toca el mapa y ajusta el alcance para ver cómo cambian los territorios.</p></div><h2 className="ranking-mobile-title mobile-only">Las Casas</h2><button ref={cerrarCorona} className="icon-button mobile-only" title="Cerrar La Corona" aria-label="Cerrar La Corona" onClick={() => { setPanelMovil(false); requestAnimationFrame(() => abrirCorona.current?.focus()); }}><X size={20} /></button></div>
        <div className="panel-tabs" role="tablist" aria-label="Información territorial">
          <button role="tab" aria-selected={tab === 'dominancia'} onClick={() => setTab('dominancia')}><span className="crown-tab-icon" aria-hidden="true"><Crown size={17} /></span>La Corona</button>
          <button role="tab" aria-label="Simbología" aria-selected={tab === 'leyenda'} onClick={() => setTab('leyenda')}><span className="symbol-tab-icon" aria-hidden="true"><Palette size={17} /></span>Simbología</button>
        </div>
        <div className="ranking-scroll" role="tabpanel" aria-label={tab === 'dominancia' ? 'La Corona' : 'Simbología'}>
          <div hidden={tab !== 'dominancia'}><SugerenciaExploracion activa={tab === 'dominancia' && (!esMovil || panelMovil) && !seleccion && !buscando && !modoEdicion} /></div>
          {tab === 'dominancia' ? <>
            <div className="ranking-caption"><span>CASA</span><span>DOMINIO</span></div>
            <ol className="ranking-list">{ranking.map((e, i) => <li key={e.id}>
              <button className={'rank-row' + (i === 0 && resultado ? ' is-leader' : '') + (empresaActiva === e.id ? ' active' : '')} onClick={() => seleccionar({ tipo: 'empresa', id: e.id })} style={{ '--faction': e.color } as CSSProperties} aria-label={nombreCorto(e.nombre) + ', ' + porcentaje(e.porcentaje)}>
                <span className="rank-position">{i === 0 && resultado ? <Crown size={19} aria-label="Líder" /> : String(i + 1).padStart(2, '0')}</span>
                <span className="rank-info"><span className="rank-name"><Escudo casaId={e.id} size={24} />{nombreCorto(e.nombre)}</span><span className="rank-bar"><i style={{ width: e.porcentaje / maximo * 100 + '%' }} /></span><small>{e.total} Bastiones</small></span>
                <strong className="rank-value">{resultado ? e.porcentaje.toFixed(2) : '—'}<small>%</small></strong>
              </button>
            </li>)}</ol>
          </> : <div className="legend-content">
            <FiltrosBastiones desarrollos={desarrollos} tipos={tiposActivos} municipio={municipioActivo}
              coincidencias={bastionesDestacados?.size ?? desarrollos.length} onTipo={cambiarTipo}
              onMunicipio={nombre => { setMunicipioActivo(nombre); setMarcadores(true); }}
              onLimpiar={() => { setTiposActivos([]); setMunicipioActivo(''); }}
              onVerMapa={() => { setPanelMovil(false); requestAnimationFrame(() => abrirCorona.current?.focus()); }} />
            <h3>Las Casas</h3>
            <p className="legend-description">Desarrolladoras presentes en el área metropolitana; cada color las identifica en el mapa.</p>
            <ul className="legend-companies">{ranking.map(e => <li key={e.id}><button onClick={() => seleccionar({ tipo: 'empresa', id: e.id })}><span className="swatch" style={{ background: e.color }} />{nombreCorto(e.nombre)}<ArrowUpRight size={14} /></button></li>)}</ul>
            <div className="legend-key"><span className="swatch neutral" />Tierras sin reclamar</div><div className="legend-key"><span className="swatch striped" />Frontera en disputa</div>
          </div>}
        </div>
        <div className="free-territory"><div><span><i className="swatch neutral" />TIERRAS SIN RECLAMAR</span><strong>{resultado ? porcentaje(libre) : '—'}</strong></div><div className="share-bar" aria-label="Reparto territorial">{ranking.map(e => <i key={e.id} style={{ width: e.porcentaje + '%', background: e.color }} />)}</div><small>Porcentaje sobre el área de estudio</small></div>
      </aside>
      <section className={'map-stage' + (seleccion ? ' has-detail' : '')} aria-label="Tablero de Monterrey" inert={panelMovil}>
        <Mapa resultado={resultado} desarrollos={desarrollos} desarrolladoras={inicial.desarrolladoras} empresaActiva={empresaActiva} desarrolloActivo={seleccion?.tipo === 'desarrollo' ? seleccion.id : null} bastionesDestacados={bastionesDestacados} marcadoresVisibles={marcadores} modoEdicion={modoEdicion} onReady={setMapa} onDesarrollo={id => seleccionar({ tipo: 'desarrollo', id })} />
        {params.has('empresa') && !empresaUrl && <div className="data-notice">Esta Casa no está en el catálogo. <button onClick={cerrar}>Ver todo el mapa</button></div>}
        <div className="search-box"><Search size={17} /><input aria-label="Buscar Bastión" placeholder="Buscar un Bastión..." value={busqueda} onChange={e => { setBusqueda(e.target.value); setBuscando(true); }} onFocus={() => setBuscando(true)} onBlur={e => { if (!e.currentTarget.parentElement?.contains(e.relatedTarget)) setBuscando(false); }} />
          {busqueda && <button className="search-clear" aria-label="Limpiar búsqueda" onClick={() => setBusqueda('')}><X size={16} /></button>}
          {buscando && busqueda && <ul className="search-results">{resultadosBusqueda.length ? resultadosBusqueda.map(d => <li key={d.id}><button onMouseDown={e => e.preventDefault()} onClick={() => { seleccionar({ tipo: 'desarrollo', id: d.id }); localizar(d); }}><IconoTipo tipo={d.tipo} /><span>{d.nombre}<small>{d.municipio}</small></span><ArrowUpRight size={16} /></button></li>) : <li className="no-results">No encontramos esa conquista.</li>}</ul>}
        </div>
        <button ref={abrirCorona} className="mobile-ranking mobile-only" aria-label="Abrir La Corona y simbología" aria-expanded={panelMovil} aria-controls="ranking-panel" onClick={() => { cerrar(); setPanelMovil(!panelMovil); }}><Crown size={18} />La Corona{bastionesDestacados && <span className="mobile-filter-count" aria-label={bastionesDestacados.size + ' Bastiones destacados'}>{bastionesDestacados.size}</span>}<ChevronDown size={15} /></button>
        <div className="map-tools">
          <button className="icon-button" title="Acercar" aria-label="Acercar" disabled={!mapa} onClick={() => mapa?.zoomIn()}><Plus size={21} /></button>
          <button className="icon-button" title="Alejar" aria-label="Alejar" disabled={!mapa} onClick={() => mapa?.zoomOut()}><Minus size={21} /></button>
          <button className="icon-button" title="Vista metropolitana" aria-label="Vista metropolitana" disabled={!mapa} onClick={restablecerVista}><Target size={20} /></button>
          <button className={'icon-button' + (marcadores ? ' pressed' : '')} title={marcadores ? 'Ocultar Bastiones' : 'Mostrar Bastiones'} aria-label={marcadores ? 'Ocultar Bastiones' : 'Mostrar Bastiones'} aria-pressed={marcadores} onClick={() => setMarcadores(!marcadores)}><IconoBastion size={23} /></button>
        </div>
        <div className="map-compass" aria-hidden="true"><span>N</span><Compass size={34} strokeWidth={1} /></div>
        {seleccion && <PanelDetalle seleccion={seleccion} desarrollos={desarrollos} empresas={inicial.desarrolladoras} resultado={resultado} onSelect={seleccionar} onClose={cerrar} onLocate={localizar} />}
        <div className="influence-control">
          <div className="influence-title"><label htmlFor="influencia"><IconoAlcance />ALCANCE DE INFLUENCIA</label><output htmlFor="influencia">{factor.toFixed(2).replace(/0$/, '')}×</output></div>
          <input id="influencia" type="range" min="0.5" max="2.5" step="0.05" value={factor} aria-valuetext={factor + ' veces'} style={{ '--range-progress': (factor - 0.5) / 2 * 100 + '%' } as CSSProperties} onChange={e => setFactor(Number(e.target.value))} />
          <div className="influence-labels"><span>Pequeños feudos</span><span>Grandes imperios</span></div>
          <div className="calculation-state" role="status" data-calculating={calculando} data-factor={factorAplicado}>{calculando ? <><LoaderCircle size={12} className="spin" />Trazando fronteras...</> : error ? <span>El alcance anterior sigue visible</span> : <><Check size={12} />Territorios al tiro</>}</div>
        </div>
        <div className="mini-legend"><span><i className="swatch neutral" />Sin reclamar</span><span><i className="swatch striped" />Frontera en disputa</span></div>
        {error && <div className="map-error" role="alert">{error}</div>}
        {!!resultado?.fueraDeLimites.length && <div className="data-notice">{resultado.fueraDeLimites.length} Bastiones fuera del área de estudio</div>}
      </section>
    </main>
  </>;
}
