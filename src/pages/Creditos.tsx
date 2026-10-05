import { ArrowUpRight, Code2, Crown, GitFork, ContactRound, Map } from 'lucide-react';
import { useDominio } from '../lib/DominioContext';
import proyecto from '../data/proyecto.json';

const tecnologias = [
  ['Vite', 'Construcción y desarrollo', 'https://vite.dev/'],
  ['React + TypeScript', 'Interfaz y tipos', 'https://react.dev/'],
  ['React Router', 'Navegación', 'https://reactrouter.com/'],
  ['MapLibre GL JS', 'Mapa interactivo', 'https://maplibre.org/'],
  ['d3-delaunay', 'Celdas de Voronoi', 'https://d3js.org/d3-delaunay'],
  ['Turf', 'Operaciones geométricas', 'https://turfjs.org/'],
  ['Tailwind + Lucide', 'Estilos e iconos', 'https://lucide.dev/'],
  ['Railway', 'Deployment', 'https://railway.com/'],
  ['Google Fonts', 'Tipografías Macondo y Nunito', 'https://fonts.google.com/'],
];
function enlacePersonal(url: string | null) {
  if (!url) return undefined;
  try { const parsed = new URL(url); return parsed.protocol === 'https:' ? parsed.href : undefined; } catch { return undefined; }
}
function IconoAlertaDragon() {
  return <svg className="dragon-alert-icon" viewBox="0 0 32 32" fill="none" aria-hidden="true">
    <path d="M16 2.5 29.1 26a2 2 0 0 1-1.75 3H4.65a2 2 0 0 1-1.75-3L16 2.5Z" />
    <path d="m10 19 2-2.3-.6-3.1 3.3 1.1 2.2-2.8.9 3.2 3.2.9-2.8 2 .1 3.2-2.8-1.4-2.9 1.6.6-3.1L10 19Z" />
    <path d="m16.6 14.7 2.3-2.8.1 3.6m-4 1.1.1.1" />
    <circle cx="17.8" cy="16.1" r=".55" fill="currentColor" stroke="none" />
  </svg>;
}
export default function Creditos() {
  const { desarrollos } = useDominio();
  return <main className="content-page">
    <div className="page-inner credits-inner">
      <header className="page-heading"><div><span className="eyebrow">DETRÁS DEL TABLERO</span><h2 className="page-title" tabIndex={-1}>Créditos</h2></div><span className="brand-mark credits-brand-mark" aria-hidden="true"><Crown size={34} fill="currentColor" /></span></header>
      <div className="credits-columns">
        <div>
          <section className="credit-section"><h3>Una ciudad nueva, muchas preguntas.</h3><p>No soy de aquí. Llegué a Monterrey por estudios y, sin planearlo, empecé a ver la ciudad distinto cuando entré a trabajar en una desarrolladora inmobiliaria. De repente, cada torre, cada plaza y cada distrito tenía una historia y una familia detrás, y yo no tenía ni idea de quién era quién.</p><p>De ahí salió una pregunta que no se me quitaba: ¿qué familia tiene más terrenos aquí? Luego llegó la que de verdad me enganchó: ¿y si veo esto como un juego de mesa que pueda enseñarle a más gente?</p><p>El otro pretexto fue el lanzamiento de ChatGPT Astra 6: quería probarlo y terminé apoyándome en él para todo el desarrollo, de la idea al código y del código al deployment. El Tablero Regio junta esas dos curiosidades: las ganas de aprender, el código y noches despertándome a las 3 a. m. para aprovechar mis tokens al máximo, jajaja. 😂</p><div className="author-profile"><img className="author-portrait" src="/david-vazquez.jpeg" alt="David Vázquez Moreno" width="112" height="112" /><dl className="author-line"><dt>HECHO POR</dt><dd>{proyecto.autor}</dd></dl></div>
            <div className="personal-links">{([{ nombre: 'GitHub', usuario: '@vazqua', url: proyecto.github, Icon: GitFork }, { nombre: 'LinkedIn', usuario: '@davidvazquezmore', url: proyecto.linkedin, Icon: ContactRound }]).map(({ nombre, usuario, url, Icon }) => {
              const href = enlacePersonal(url);
              return href ? <a key={nombre} href={href} target="_blank" rel="noopener noreferrer"><Icon size={18} /><span>{nombre}<small>{usuario}</small></span><ArrowUpRight size={15} /></a> : <span key={nombre} aria-disabled="true"><Icon size={18} /><span>{nombre}<small>{usuario}</small></span></span>;
            })}</div>
          </section>
          <section className="credit-section disclaimer"><div className="disclaimer-heading"><IconoAlertaDragon /><h3>Disclaimer</h3></div><p><strong>Proyecto fan-made, independiente y sin fines comerciales. Sin afiliación, patrocinio ni respaldo de las empresas mostradas.</strong></p><p>Los datos son públicos y aproximados. Pueden contener errores, omisiones o información desactualizada. Las marcas y nombres pertenecen a sus respectivos titulares.</p><p>El “dominio” es una simulación geométrica basada en diagramas de Voronoi: cada punto del mapa se asigna a la Casa más cercana, dentro del alcance que elijas con el control deslizante. No representa propiedad del suelo, participación de mercado ni una medición catastral. Los porcentajes se calculan sobre un área de estudio aproximada y cambian con el alcance elegido.</p></section>
        </div>
        <div>
          <section className="credit-section"><h3><Map size={22} />Fuentes de datos</h3><p>El catálogo reúne referencias a portafolios de las Casas, prensa, portales inmobiliarios, fuentes públicas y correcciones manuales. Cada Bastión conserva su referencia original.</p><p>Las referencias se reproducen tal como están en los datos; no todas contienen un enlace completo ni han sido verificadas de forma independiente.</p><a className="text-link" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">Cartografía: © OpenStreetMap<ArrowUpRight size={15} /></a><p className="credit-small">Mapa base sin API key. La cartografía requiere conexión; los datos del proyecto viven en archivos JSON locales.</p></section>
          <section className="credit-section"><h3><Code2 size={22} />Con qué se armó</h3><ul className="stack-list">{tecnologias.map(([nombre, uso, url]) => <li key={nombre}><a href={url} target="_blank" rel="noopener noreferrer"><strong>{nombre}</strong><span>{uso}</span><ArrowUpRight size={15} /></a></li>)}</ul></section>
        </div>
      </div>
      <section className="source-section"><details><summary>Referencias por Bastión <span>{desarrollos.length}</span></summary><ul className="source-list">{desarrollos.map(d => <li key={d.id}><strong>{d.nombre}</strong><span>{d.fuente || 'Sin fuente registrada'}</span></li>)}</ul></details></section>
    </div>
  </main>;
}
