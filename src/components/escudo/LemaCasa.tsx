import { obtenerBlason } from './blasones';

export default function LemaCasa({ casaId, mostrarOriginal = false }: { casaId: string; mostrarOriginal?: boolean }) {
  const blason = obtenerBlason(casaId);
  if (!blason) return null;

  return <div className="house-motto-block">
    <p className="house-motto" lang="la">{blason.lemaLatin}</p>
    <p className="house-motto-translation" lang="es">{blason.lemaTraduccion}</p>
    {mostrarOriginal && <p className="house-motto-original" lang="es"><span>Original: </span>{blason.lemaOriginal}</p>}
  </div>;
}
