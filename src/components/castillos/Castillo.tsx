import './castillos.css';

const imagenes = import.meta.glob<string>('./optimized/*.webp', {
  eager: true, query: '?url', import: 'default',
});

interface Props {
  casaId: string;
  nombre: string;
  contexto?: 'catalogo' | 'ficha' | 'tooltip';
}

export default function Castillo({ casaId, nombre, contexto = 'catalogo' }: Props) {
  const imagen = (ancho: number) => imagenes[`./optimized/${casaId}-${ancho}.webp`];
  const tooltip = contexto === 'tooltip';
  const src = imagen(tooltip ? 160 : 384);
  if (!src) return null;
  const srcSet = tooltip ? undefined : [384, 768, 1280].map(ancho => `${imagen(ancho)} ${ancho}w`).join(', ');
  const sizes = tooltip ? undefined : contexto === 'ficha' ? '(max-width: 900px) 160px, 300px'
    : '(min-width: 1280px) 334px, (min-width: 1101px) calc((100vw - 282px) / 3), (min-width: 701px) calc((100vw - 203px) / 2), calc(100vw - 82px)';
  return <img className={'castillo castillo-' + contexto} data-casa={casaId}
    src={src} srcSet={srcSet} sizes={sizes} alt={tooltip ? '' : 'Castillo de ' + nombre}
    width={tooltip ? 160 : 384} height={tooltip ? 160 : 384} decoding="async"
    loading={contexto === 'catalogo' ? 'lazy' : 'eager'} />;
}
