import { Link } from 'react-router';
import { ArrowUpRight, Target } from 'lucide-react';
import IconoBastion from '../components/IconoBastion';
import type { CSSProperties } from 'react';
import { useDominio } from '../lib/DominioContext';
import { porcentaje } from '../lib/presentacion';
import Escudo from '../components/escudo/Escudo';
import Castillo from '../components/castillos/Castillo';
import LemaCasa from '../components/escudo/LemaCasa';

export default function Desarrolladoras() {
  const { inicial, desarrollos, resultado, factorAplicado, calculando, error } = useDominio();
  return <main className="content-page">
    <div className="page-inner">
      <header className="page-heading">
        <div><span className="eyebrow">Conoce a los que mandan</span><h2 className="page-title" tabIndex={-1}>Casas</h2><p>Monterrey no se construyó sola. Se repartió.</p></div>
        <div className="catalog-summary"><strong>{inicial.desarrolladoras.length}<span>CASAS EN JUEGO</span></strong><span className="scope-label"><Target size={15} />Alcance {factorAplicado.toFixed(2).replace(/0$/, '')}×</span></div>
      </header>
      <details className="catalog-method">
        <summary>Criterios del catálogo</summary>
        <div className="catalog-method-content">
          <p>El catálogo compara desarrolladoras con presencia verificable y diversa en el Área Metropolitana de Monterrey. Así decidí quién entra y qué cuenta como Bastión:</p>
          <div className="catalog-method-rules">
            <p><strong>Mínimo tres proyectos documentados.</strong> Con uno solo no hay nada que comparar, la muestra sería demasiado chica y distorsionaría el mapa.</p>
            <p><strong>Desarrolladoras, no arquitectos ni dueños actuales.</strong> Lo que importa es quién promovió y pagó la obra, no quién la diseñó ni quién es dueño hoy. Por eso no entra Sordo Madaleno, que diseñó Esfera y Punto Norte pero no los desarrolló, ni los fideicomisos que compran edificios ya construidos, como FUNO, Fibra Mty y Danhos.</p>
            <p><strong>Que se pueda verificar.</strong> Nada de proyectos, años o direcciones inventados. Cuando no encontramos un año publicado, la entrada se queda sin fecha (por eso hay 49 sin año).</p>
            <p><strong>Dentro del AMM.</strong> Se excluyeron proyectos de otras ciudades.</p>
            <p><strong>Que el mapa no sea solo San Pedro.</strong> Buscamos presencia en toda la ciudad: FINSA aporta industria, Acosta Verde plazas periféricas, y cuatro Casas se especializan en vivienda de volumen.</p>
            <p><strong>Nota de diseño:</strong> cada Casa tiene un color saturado, elegido para que se distinga tanto del gris del mapa como de las otras trece. No tiene que ver con sus colores institucionales.</p>
          </div>
          <h3 className="catalog-method-subheading">Quién se quedó fuera</h3>
          <p><strong>Por no llegar a los tres proyectos:</strong> ODG (Torre Sofía), Ancore (Obispado y RISE, todavía sin terminar cuando revisamos), MIRA (Nuevo Sur) y Citelis (Esfera).</p>
          <p><strong>Por no ser desarrolladoras:</strong> Sordo Madaleno y los fideicomisos FUNO, Fibra Mty y Danhos.</p>
        </div>
      </details>
      <div className="catalog-context"><span>{desarrollos.length} Bastiones en el catálogo</span><span role="status">{calculando ? 'Trazando fronteras...' : resultado ? porcentaje(resultado.porcentajeLibre) + ' de tierras sin reclamar' : 'Sin cálculo disponible'}</span></div>
      {error && <p role="alert" className="page-warning">{error} {resultado ? 'Se conserva el último reparto calculado.' : ''}</p>}
      <div className="company-grid">
        {inicial.desarrolladoras.map((empresa, i) => {
          const proyectos = desarrollos.filter(d => d.desarrolladora === empresa.id);
          return <Link to={'/?empresa=' + encodeURIComponent(empresa.id)} key={empresa.id} className="company-card" style={{ '--faction': empresa.color } as CSSProperties} aria-label={'Ver ' + empresa.nombre + ' en el mapa'}>
            <div className="company-card-top"><span className="company-crest"><Escudo casaId={empresa.id} size={72} /></span><span className="faction-number">CASA {String(i + 1).padStart(2, '0')}</span><ArrowUpRight size={22} /></div>
            <Castillo casaId={empresa.id} nombre={empresa.nombre} />
            <h3 className="house-name">{empresa.nombre}</h3>
            <LemaCasa casaId={empresa.id} />
            <p className="company-representative"><span>AL FRENTE</span>{empresa.representante}</p>
            <div className="company-metrics"><div><strong>{resultado ? porcentaje(resultado.porcentajes[empresa.id] ?? 0) : '—'}</strong><span>Dominio</span></div><div><strong>{proyectos.length}</strong><span>Bastiones</span></div></div>
            <p className="company-story">{empresa.descripcion}</p>
            <div className="company-projects"><h4><IconoBastion size={22} />Sus Bastiones</h4><ul>{proyectos.map(d => <li key={d.id}>{d.nombre}</li>)}</ul></div>
            <span className="company-card-action">Ver su territorio<ArrowUpRight size={17} /></span>
          </Link>;
        })}
      </div>
    </div>
  </main>;
}
