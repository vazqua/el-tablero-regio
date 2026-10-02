import { useCallback, useEffect, useRef, useState } from 'react';
import { Pause, Play, Shuffle } from 'lucide-react';
import './exploracion.css';

const sugerencias = [
  'Encuentra una Casa con Bastiones en distintos municipios.',
  'Elige un municipio y descubre qué tipos de proyecto aparecen ahí.',
  'Busca un Bastión industrial y conoce la Casa que lo promueve.',
  'Compara una Casa con proyectos residenciales y comerciales.',
  'Explora qué cambia al filtrar por oficinas.',
  'Encuentra un proyecto cuyo año no esté documentado.',
  'Busca una Casa con presencia tanto al norte como al sur del área metropolitana.',
  'Elige un tipo de Bastión y compara las Casas que lo tienen.',
  'Toca un territorio y descubre qué Bastión cercano representa a esa Casa.',
  'Ajusta el alcance de influencia y observa cómo cambian las fronteras.',
];

export default function SugerenciaExploracion({ activa }: { activa: boolean }) {
  const [indice, setIndice] = useState(() => Math.floor(Math.random() * sugerencias.length));
  const [pausada, setPausada] = useState(false);
  const actual = useRef(indice);
  const pendientes = useRef(sugerencias.map((_, i) => i).filter(i => i !== indice));
  const contenedor = useRef<HTMLElement>(null);
  const mostrarOtra = useCallback(() => {
    if (!pendientes.current.length) pendientes.current = sugerencias.map((_, i) => i).filter(i => i !== actual.current);
    const posicion = Math.floor(Math.random() * pendientes.current.length);
    actual.current = pendientes.current.splice(posicion, 1)[0];
    setIndice(actual.current);
  }, []);

  useEffect(() => {
    const elemento = contenedor.current;
    if (!activa || pausada || !elemento) return;
    let temporizador: ReturnType<typeof setTimeout> | undefined;
    let desmontado = false;
    let leyendo = false;
    const programar = () => {
      clearTimeout(temporizador);
      if (desmontado || document.visibilityState !== 'visible' || leyendo || elemento.contains(document.activeElement)) return;
      temporizador = setTimeout(() => { mostrarOtra(); programar(); }, 75000);
    };
    const entrar = (e: PointerEvent) => { if (e.pointerType === 'mouse') { leyendo = true; programar(); } };
    const salir = () => { leyendo = false; programar(); };
    const foco = () => queueMicrotask(programar);
    // Cualquier interacción reinicia los 75 segundos; leer la sugerencia detiene el cambio.
    const eventos = ['pointerdown', 'pointermove', 'wheel', 'keydown', 'visibilitychange'] as const;
    eventos.forEach(evento => document.addEventListener(evento, programar, { passive: true }));
    elemento.addEventListener('pointerenter', entrar);
    elemento.addEventListener('pointerleave', salir);
    elemento.addEventListener('focusin', foco);
    elemento.addEventListener('focusout', foco);
    programar();
    return () => {
      desmontado = true;
      clearTimeout(temporizador);
      eventos.forEach(evento => document.removeEventListener(evento, programar));
      elemento.removeEventListener('pointerenter', entrar);
      elemento.removeEventListener('pointerleave', salir);
      elemento.removeEventListener('focusin', foco);
      elemento.removeEventListener('focusout', foco);
    };
  }, [activa, pausada, mostrarOtra]);

  return <section className="exploration-prompt" aria-label="Sugerencia de exploración" ref={contenedor}>
    <div className="exploration-prompt-heading">
      <h3>Por descubrir</h3>
      <div>
        <button type="button" className="exploration-action" onClick={() => setPausada(!pausada)} aria-pressed={pausada}
          aria-label={pausada ? 'Reanudar sugerencias automáticas' : 'Pausar sugerencias automáticas'} title={pausada ? 'Reanudar sugerencias automáticas' : 'Pausar sugerencias automáticas'}>{pausada ? <Play size={16} /> : <Pause size={16} />}</button>
        <button type="button" className="exploration-action" onClick={mostrarOtra} aria-label="Otra sugerencia" title="Otra sugerencia"><Shuffle size={17} /></button>
      </div>
    </div>
    <p>{sugerencias[indice]}</p>
  </section>;
}
