import './castillos.css';

const imagenes = import.meta.glob<string>('./*.png', {
  eager: true, query: '?url', import: 'default',
});

interface Props {
  casaId: string;
  nombre: string;
  contexto?: 'catalogo' | 'ficha' | 'tooltip';
}

export default function Castillo({ casaId, nombre, contexto = 'catalogo' }: Props) {
  const src = imagenes[`./${casaId}.png`];
  if (!src) return null;
  return <img className={'castillo castillo-' + contexto} data-casa={casaId}
    src={src} alt={contexto === 'tooltip' ? '' : 'Castillo de ' + nombre}
    width={2048} height={2048} decoding="async"
    loading={contexto === 'catalogo' ? 'lazy' : 'eager'} />;
}
