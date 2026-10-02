import { createRoot } from 'react-dom/client';
import { Component, type ErrorInfo, type ReactNode } from 'react';
import App from './App';
import '@fontsource/macondo/latin-400.css';
import '@fontsource/nunito/latin-400.css';
import '@fontsource/nunito/latin-500.css';
import '@fontsource/nunito/latin-600.css';
import '@fontsource/nunito/latin-700.css';
import 'maplibre-gl/dist/maplibre-gl.css';
import './styles.css';
import './pages.css';
import './design.css';
import './components/escudo/escudo.css';
import './mobile.css';

class ErrorBoundary extends Component<{ children: ReactNode }, { error: string | null }> {
  state: { error: string | null } = { error: null };
  static getDerivedStateFromError(error: Error) { return { error: error.message }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error(error, info); }
  render() {
    return this.state.error ? <main className="fatal" role="alert"><h1>No se pudo cargar el mapa</h1><pre>{this.state.error}</pre></main> : this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(<ErrorBoundary><App /></ErrorBoundary>);
