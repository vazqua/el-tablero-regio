import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Link, NavLink, Route, Routes, useLocation } from 'react-router';
import { Crown, Map, Shield, Info, ArrowLeft } from 'lucide-react';
import { DominioProvider, useDominio } from './lib/DominioContext';
import Desarrolladoras from './pages/Desarrolladoras';
import Creditos from './pages/Creditos';
const Estilo = import.meta.env.DEV ? lazy(() => import('./dev/Estilo')) : null;
const Escudos = import.meta.env.DEV ? lazy(() => import('./dev/Escudos')) : null;
const PaginaMapa = lazy(() => import('./pages/PaginaMapa'));

function Contenido() {
  const { desarrollos, inicial } = useDominio();
  const { pathname, search } = useLocation();
  useEffect(() => {
    const pagina = pathname === '/' ? 'Mapa' : pathname === '/desarrolladoras' ? 'Casas' : pathname === '/creditos' ? 'Créditos' : import.meta.env.DEV && pathname === '/estilo' ? 'Sistema de diseño' : import.meta.env.DEV && pathname === '/escudos' ? 'Los escudos' : 'Página no encontrada';
    document.title = pagina + ' | El Tablero Regio';
    if (pathname !== '/') document.querySelector<HTMLElement>('.page-title')?.focus({ preventScroll: true });
  }, [pathname]);
  const editando = import.meta.env.DEV && pathname === '/' && new URLSearchParams(search).get('edit') === '1';
  return <div className={'app' + (editando ? ' editing' : '')}>
    <a className="skip-link" href="#contenido">Saltar al contenido</a>
    <header className="masthead">
      <Link to="/" className="brand" aria-label="El Tablero Regio, volver al mapa"><span className="brand-mark"><Crown className="brand-crown" size={25} fill="currentColor" /></span><h1>El Tablero Regio<small>Mapa del Dominio Inmobiliario de Monterrey</small></h1></Link>
      <nav className="site-nav" aria-label="Navegación principal">
        <NavLink to="/" end><Map size={17} />Mapa</NavLink>
        <NavLink to="/desarrolladoras"><Shield size={17} />Casas</NavLink>
        <NavLink to="/creditos"><Info size={17} />Créditos</NavLink>
      </nav>
      <div className="header-count"><strong>{desarrollos.length}</strong> Bastiones <span>/</span> <strong>{inicial.desarrolladoras.length}</strong> Casas</div>
    </header>
    <div id="contenido" className="route-content" tabIndex={-1}>
      <Suspense fallback={<div className="route-loading" role="status">Preparando el tablero...</div>}>
        <Routes>
          <Route path="/" element={<PaginaMapa />} />
          <Route path="/desarrolladoras" element={<Desarrolladoras />} />
          <Route path="/creditos" element={<Creditos />} />
          {import.meta.env.DEV && Estilo && <Route path="/estilo" element={<Estilo />} />}
          {import.meta.env.DEV && Escudos && <Route path="/escudos" element={<Escudos />} />}
          <Route path="*" element={<main className="content-page"><div className="page-inner not-found"><span className="eyebrow">FUERA DEL TABLERO · 404</span><h2 className="page-title" tabIndex={-1}>Este territorio no existe.</h2><Link to="/" className="text-link"><ArrowLeft size={18} />Volver al mapa</Link></div></main>} />
        </Routes>
      </Suspense>
    </div>
    <footer className="app-footer"><span>PROYECTO INDEPENDIENTE · FAN-MADE</span><span>Sin fines comerciales ni afiliación. El dominio es una simulación, no propiedad del suelo.</span><Link to="/creditos">Créditos y fuentes</Link></footer>
  </div>;
}
export default function App() {
  return <BrowserRouter><DominioProvider><Contenido /></DominioProvider></BrowserRouter>;
}
