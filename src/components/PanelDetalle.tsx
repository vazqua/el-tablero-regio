import { ArrowLeft, ArrowUpRight, CalendarDays, MapPin, X, Crosshair, Maximize2, Minimize2 } from 'lucide-react';
import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import type { Desarrollo, Desarrolladora, ResultadoTerritorios } from '../types';
import IconoTipo from './IconoTipo';
import IconoBastion from './IconoBastion';
import Escudo from './escudo/Escudo';
import Castillo from './castillos/Castillo';
import LemaCasa from './escudo/LemaCasa';
import { nombreCorto, NOMBRES_TIPO, numero, porcentaje } from '../lib/presentacion';

export type Seleccion = { tipo: 'desarrollo'; id: string } | { tipo: 'empresa'; id: string };
interface Props {
  seleccion: Seleccion; desarrollos: Desarrollo[]; empresas: Desarrolladora[];
  resultado: ResultadoTerritorios | null;
  onSelect: (seleccion: Seleccion) => void; onClose: () => void; onLocate: (d: Desarrollo) => void;
}
export default function PanelDetalle({ seleccion, desarrollos, empresas, resultado, onSelect, onClose, onLocate }: Props) {
  const titulo = useRef<HTMLHeadingElement>(null);
  const contenido = useRef<HTMLDivElement>(null);
  const [ampliado, setAmpliado] = useState(false);
  useLayoutEffect(() => {
    if (contenido.current) contenido.current.scrollTop = 0;
    titulo.current?.focus({ preventScroll: true });
  }, [seleccion.tipo, seleccion.id]);
  const desarrollo = seleccion.tipo === 'desarrollo' ? desarrollos.find(d => d.id === seleccion.id) : null;
  const empresa = empresas.find(e => e.id === (desarrollo?.desarrolladora ?? seleccion.id));
  if (!empresa) return null;
  const propios = desarrollos.filter(d => d.desarrolladora === empresa.id);
  const area = resultado?.territorios.features.find(f => f.properties.desarrolladora === empresa.id)?.properties.areaM2 ?? 0;
  return <aside className={'detail-sheet' + (ampliado ? ' is-expanded' : '')} aria-label={desarrollo ? 'Ficha del Bastión' : 'Ficha de la Casa'} style={{ '--faction': empresa.color } as CSSProperties}>
    <div className="sheet-handle" />
    <div className="detail-top">
      <span className="eyebrow">{desarrollo ? 'EXPEDIENTE DEL BASTIÓN' : 'LA CASA'}</span>
      <div className="detail-actions">
        <button className="icon-button mobile-only" title={ampliado ? 'Reducir ficha' : 'Ampliar ficha'} aria-label={ampliado ? 'Reducir ficha' : 'Ampliar ficha'} aria-expanded={ampliado} aria-controls="detalle-contenido" onClick={() => setAmpliado(!ampliado)}>{ampliado ? <Minimize2 size={20} /> : <Maximize2 size={20} />}</button>
        <button className="icon-button" title="Cerrar detalle" aria-label="Cerrar detalle" onClick={onClose}><X size={20} /></button>
      </div>
    </div>
    <div id="detalle-contenido" className="detail-scroll" ref={contenido}>
      <div className="detail-banner">
        {desarrollo ? <span className="detail-emblem"><IconoTipo tipo={desarrollo.tipo} size={32} /></span> : <span className="detail-crest"><Escudo casaId={empresa.id} size={200} /></span>}
        <span className="category-tag">{desarrollo ? NOMBRES_TIPO[desarrollo.tipo] : propios.length + ' Bastiones'}</span>
      </div>
      <h2 className={desarrollo ? undefined : 'house-name'} ref={titulo} tabIndex={-1}>{desarrollo ? desarrollo.nombre : nombreCorto(empresa.nombre)}</h2>
      {!desarrollo && <Castillo casaId={empresa.id} nombre={empresa.nombre} contexto="ficha" />}
      {desarrollo ? <>
        <div className="location-line"><MapPin size={15} /><span>{desarrollo.colonia} · {desarrollo.municipio}</span></div>
        <div className="detail-facts"><span><CalendarDays size={16} />{desarrollo.anio ?? 'Año no disponible'}</span><span className="scale-label">{desarrollo.escala}</span></div>
        <p className="detail-description">{desarrollo.descripcion}</p>
        <div className="address"><span className="eyebrow">DIRECCIÓN</span><p>{desarrollo.direccion}</p></div>
        <button className="locate-button" onClick={() => onLocate(desarrollo)}><Crosshair size={17} />Centrar Bastión</button>
        <a className="company-link" href={'#desarrolladora/' + empresa.id} onClick={e => { e.preventDefault(); onSelect({ tipo: 'empresa', id: empresa.id }); }}>
          <Escudo casaId={empresa.id} size={48} /><span><small>BAJO SU BANDERA</small><strong>{nombreCorto(empresa.nombre)}</strong></span><ArrowUpRight size={22} />
        </a>
      </> : <>
        <p className="company-fullname">{empresa.nombre}</p>
        <LemaCasa casaId={empresa.id} />
        <div className="company-stat"><strong>{porcentaje(resultado?.porcentajes[empresa.id] ?? 0)}</strong><span>del área de estudio · {numero(area / 1000000)} km²</span></div>
        <p className="detail-description">{empresa.descripcion}</p>
        <div className="address"><span className="eyebrow">AL FRENTE</span><p>{empresa.representante}</p></div>
        <h3><IconoBastion size={22} />Sus Bastiones <span>{propios.length}</span></h3>
        <ul className="developments-list">{propios.map(d => <li key={d.id}><button onClick={() => { onSelect({ tipo: 'desarrollo', id: d.id }); onLocate(d); }}><IconoTipo tipo={d.tipo} /><span>{d.nombre}<small>{d.municipio}</small></span><ArrowUpRight size={16} /></button></li>)}</ul>
      </>}
      <button className="back-map" onClick={onClose}><ArrowLeft size={16} />Volver al tablero</button>
    </div>
  </aside>;
}
