import { useEffect, useRef, type CSSProperties } from 'react';
import { Link } from 'react-router';
import { ArrowUpRight } from 'lucide-react';
import casas from '../data/desarrolladoras.json';
import { Escudo, Estandarte } from '../components/escudo/Escudo';
import { blasones, obtenerBlason } from '../components/escudo/blasones';
import LemaCasa from '../components/escudo/LemaCasa';
import { tintaSobre } from '../components/escudo/tintas';

export default function Escudos() {
  const titulo = useRef<HTMLHeadingElement>(null);
  useEffect(() => { titulo.current?.focus({ preventScroll: true }); }, []);
  return <main className="content-page heraldry-guide"><div className="page-inner">
    <header className="page-heading"><div><span className="eyebrow">ARMORIAL REGIO · SOLO DESARROLLO</span>
      <h2 className="page-title" ref={titulo} tabIndex={-1}>Los escudos</h2>
      <p>Catorce Casas. Un mismo tablero.</p></div>
      <div className="catalog-summary"><strong>{Object.keys(blasones).length}<span>BLASONES</span></strong></div>
    </header>
    <div className="catalog-context"><span>Armorial independiente · Emblemas ficticios, no oficiales</span><Link to="/estilo">Sistema de diseño</Link></div>
    <div className="armorial-grid">{casas.map((casa, i) => {
      const blason = obtenerBlason(casa.id)!;
      return <article className="armorial-card" key={casa.id} data-casa={casa.id} style={{ '--faction': casa.color, '--tinta-casa': tintaSobre(casa.color) } as CSSProperties}>
        <header><span className="eyebrow">CASA {String(i + 1).padStart(2, '0')}</span><Link to={'/?empresa=' + casa.id} aria-label={'Ver ' + casa.nombre + ' en el mapa'}><ArrowUpRight size={20} /></Link></header>
        <h3 className="house-name">{casa.nombre}</h3>
        <div className="shield-sizes">{[24, 48, 120].map(size => <figure key={size}><Escudo casaId={casa.id} size={size} /><figcaption>{size} px</figcaption></figure>)}</div>
        <LemaCasa casaId={casa.id} mostrarOriginal />
        <p className="blazon-description">{blason.particion} · {blason.figuras.join(' + ')}</p>
        <div className="armorial-variants"><figure className="mono-sample"><Escudo casaId={casa.id} size={64} variante="silueta" /><figcaption>Una tinta</figcaption></figure>
          <figure><Estandarte casaId={casa.id} size={80} /><figcaption>Estandarte</figcaption></figure></div>
      </article>;
    })}</div>
  </div></main>;
}
