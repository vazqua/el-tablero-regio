import { useMemo } from 'react';
import { ArrowUpRight, RotateCcw } from 'lucide-react';
import { TIPOS, type Desarrollo } from '../types';
import IconoTipo from './IconoTipo';
import './exploracion.css';

interface Props {
  desarrollos: Desarrollo[];
  tipos: Desarrollo['tipo'][];
  municipio: string;
  coincidencias: number;
  onTipo: (tipo: Desarrollo['tipo']) => void;
  onMunicipio: (municipio: string) => void;
  onLimpiar: () => void;
  onVerMapa: () => void;
}

export default function FiltrosBastiones({ desarrollos, tipos, municipio, coincidencias, onTipo, onMunicipio, onLimpiar, onVerMapa }: Props) {
  const municipios = useMemo(() => [...new Set(desarrollos.map(d => d.municipio))].sort((a, b) => a.localeCompare(b, 'es')), [desarrollos]);
  const activo = tipos.length > 0 || municipio !== '';
  return <section className="bastion-filters" aria-label="Filtros de Bastiones">
    <div className="filter-heading"><h3>Los Bastiones</h3><button className="clear-filters" type="button" disabled={!activo} onClick={onLimpiar} aria-label="Limpiar filtros" title="Limpiar filtros"><RotateCcw size={17} /></button></div>
    <div className="type-legend" role="group" aria-label="Tipos de Bastión">
      {TIPOS.map((tipo, i) => <button key={tipo} type="button" aria-pressed={tipos.includes(tipo)} onClick={() => onTipo(tipo)}>
        <IconoTipo tipo={tipo} />
        <span>{['Vertical', 'Horizontal', 'Oficinas', 'Comercial', 'Uso mixto', 'Industrial'][i]}</span>
      </button>)}
    </div>
    <label className="municipality-filter" htmlFor="municipio-bastiones">Municipio
      <select id="municipio-bastiones" value={municipio} onChange={e => onMunicipio(e.target.value)}>
        <option value="">Todos los municipios</option>
        {municipios.map(nombre => <option key={nombre} value={nombre}>{nombre}</option>)}
      </select>
    </label>
    <div className="filter-result" role="status">{activo ? coincidencias ? `${coincidencias} de ${desarrollos.length} Bastiones destacados` : 'Sin coincidencias' : `${desarrollos.length} Bastiones`}</div>
    <button className="view-filtered-map" type="button" onClick={onVerMapa}>Ver mapa<ArrowUpRight size={17} /></button>
  </section>;
}
