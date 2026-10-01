import { useEffect, useRef } from 'react';
import { Link } from 'react-router';
import { ArrowUpRight, Flag, Target } from 'lucide-react';
import type { CSSProperties } from 'react';
import { colors } from '../design/tokens';
import { useDominio } from '../lib/DominioContext';
import './estilo.css';

export default function Estilo() {
  const titulo = useRef<HTMLHeadingElement>(null);
  const { inicial } = useDominio();
  const casa = inicial.desarrolladoras[0];
  useEffect(() => { titulo.current?.focus({ preventScroll: true }); }, []);
  return <main className="content-page style-guide">
    <div className="page-inner">
      <header className="page-heading"><div><span className="eyebrow">LABORATORIO VISUAL · SOLO DESARROLLO</span><h2 ref={titulo} className="page-title" tabIndex={-1}>Sistema de diseño</h2><p>Un tablero. Un lenguaje.</p></div></header>
      <section className="style-section"><h3>01 / Tokens semánticos</h3><div className="token-grid">{Object.entries(colors).map(([nombre, hex]) => <div className="token-sample" key={nombre}><div className="token-color" style={{ background: hex }} /><div><strong>{nombre}</strong><code>{hex}</code></div></div>)}</div><p className="style-note">Crown se reserva al primer lugar de La Corona. Los colores de las Casas provienen de su catálogo, no de esta paleta.</p></section>
      <section className="style-section"><h3>02 / Escala tipográfica</h3>
        <div className="type-family"><header><h4>Macondo</h4><span>Display · Regular 400 · mínimo 24 px</span></header>{[56, 40, 32, 24].map(size => <div className="type-specimen" key={size}><code>{size} / 400</code><span className="font-display" style={{ fontSize: size }}>{size > 32 ? 'LA CORONA · 24.80 %' : 'DOMINIO MTY'}</span></div>)}<p className="style-note">Identidad, titulares, cifras de dominio, nombres de Casa en su ficha y lemas.</p></div>
        <div className="type-family"><header><h4>Nunito Bold</h4><span>Etiquetas y títulos de apoyo · Bold 700</span></header>{[64, 48, 32, 24, 14, 12].map(size => <div className="type-specimen" key={size}><code>{size} / {700}</code><span className="font-title" style={{ fontSize: size, fontWeight: 700 }}>{size > 32 ? 'FRONTERAS' : 'ALCANCE DE INFLUENCIA'}</span></div>)}</div>
        <div className="type-family"><header><h4>Nunito</h4><span>Cuerpo y UI · Regular 400 / Medium 500 / Semibold 600 / Bold 700</span></header>{[18, 16, 14, 12].map(size => <div className="type-specimen" key={size}><code>{size} / 400</code><span className="font-body" style={{ fontSize: size }}>La ciudad tiene sus bandos.</span></div>)}<div className="type-weights font-body"><span>Regular 400</span><span style={{ fontWeight: 500 }}>Medium 500</span><span style={{ fontWeight: 600 }}>Semibold 600</span><strong>Bold 700</strong></div></div>
      </section>
      <section className="style-section"><h3>03 / Componentes</h3><div className="component-examples">
        <section className="specimen-panel"><header><span className="eyebrow">EJEMPLO DE PANEL</span><h4>El territorio en juego</h4></header><div><p>Superficie clara, borde de tablero y sombra sólida.</p><div className="specimen-legend"><span className="swatch neutral" />Tierras sin reclamar</div><div className="specimen-legend"><span className="swatch striped" />Frontera en disputa</div><Link className="design-button bg-accent text-bg hover:bg-accent-hover border-border font-body" to="/"><Target size={17} />Volver al mapa<ArrowUpRight size={17} /></Link></div></section>
        <Link to={'/?empresa=' + encodeURIComponent(casa.id)} className="company-card" style={{ '--faction': casa.color } as CSSProperties} aria-label={'Ver ' + casa.nombre + ' en el mapa'}><div className="company-card-top"><span className="company-flag"><Flag size={26} /></span><span className="faction-number">EJEMPLO DE TARJETA</span><ArrowUpRight size={22} /></div><h3 className="house-name">{casa.nombre}</h3><p className="company-story">Identidad de Casa independiente del sistema de interfaz.</p><span className="company-card-action">Ver su territorio<ArrowUpRight size={17} /></span></Link>
      </div></section>
    </div>
  </main>;
}
