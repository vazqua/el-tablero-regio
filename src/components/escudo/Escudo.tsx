import { useId } from 'react';
import casas from '../../data/desarrolladoras.json';
import { obtenerBlason, type Blason } from './blasones';
import { figuras } from './figuras';
import { particiones } from './particiones';
import { siluetas, VIEWBOX_ESCUDO } from './siluetas';
import { tintas, tintaSobre } from './tintas';

export interface EscudoProps {
  casaId: string;
  /** Altura en px; la anchura conserva la proporción 4:5. */
  size?: number;
  variante?: 'completo' | 'silueta';
}

function Figuras({ blason }: { blason: Blason }) {
  const doble = blason.figuras.length === 2;
  const y = blason.disposicion === 'jefe' ? 15 : blason.disposicion === 'punta' ? 43 : doble ? 16 : 24;
  return <g fillRule="evenodd">
    <path d={figuras[blason.figuras[0]]} transform={`translate(14 ${y}) scale(1.625)`} />
    {doble && <path d={figuras[blason.figuras[1]!]} transform="translate(29 71) scale(.6875)" />}
  </g>;
}

function Campo({ casaId, clipId, mono = false }: { casaId: string; clipId: string; mono?: boolean }) {
  const casa = casas.find(c => c.id === casaId), blason = obtenerBlason(casaId);
  if (!casa || !blason) return null;
  if (mono) return <g fill="currentColor"><Figuras blason={blason} /></g>;
  const tinta = tintaSobre(casa.color), division = particiones[blason.particion];
  const contraria = tinta === tintas.argen ? tintas.sable : tintas.argen;
  return <>
    <path d="M0 0H80V100H0Z" fill={casa.color} />
    {division && <path d={division} fill={tinta} />}
    <g fill={tinta}><Figuras blason={blason} /></g>
    {division && <>
      <defs><clipPath id={clipId}><path d={division} /></clipPath></defs>
      {/* Contracambio: cada fragmento de figura contrasta con su propio campo. */}
      <g clipPath={`url(#${clipId})`} fill={contraria}><Figuras blason={blason} /></g>
    </>}
  </>;
}

export function Escudo({ casaId, size = 48, variante = 'completo' }: EscudoProps) {
  const id = useId(), casa = casas.find(c => c.id === casaId);
  const blason = obtenerBlason(casaId), path = siluetas[blason?.silueta ?? 'iberico'];
  const mono = variante === 'silueta';
  return <svg xmlns="http://www.w3.org/2000/svg" className="escudo" viewBox={VIEWBOX_ESCUDO}
    width={size * .8} height={size} role="img" aria-label={`Escudo de ${casa?.nombre ?? 'Casa sin blasón'}`}
    data-casa={casaId} data-variante={variante} focusable="false">
    <defs><clipPath id={id + '-escudo'}><path d={path} /></clipPath></defs>
    <g clipPath={`url(#${id}-escudo)`}><Campo casaId={casaId} clipId={id + '-campo'} mono={mono} /></g>
    {!mono && <path d={path} fill="none" stroke={tintas.argen} strokeWidth="6" />}
    <path d={path} fill="none" stroke={mono ? 'currentColor' : tintas.sable} strokeWidth="3" />
  </svg>;
}

export function Estandarte({ casaId, size = 80 }: Pick<EscudoProps, 'casaId' | 'size'>) {
  const id = useId(), casa = casas.find(c => c.id === casaId);
  return <svg xmlns="http://www.w3.org/2000/svg" className="estandarte" viewBox="0 0 80 100"
    width={size * .8} height={size} role="img" aria-label={`Estandarte de ${casa?.nombre ?? 'Casa sin blasón'}`}
    data-casa={casaId} focusable="false">
    <path d="M8 2V100" fill="none" stroke={tintas.argen} strokeWidth="7" />
    <path d="M8 2V100" fill="none" stroke={tintas.sable} strokeWidth="3" />
    <g transform="translate(9 4) scale(.82 .74)">
      <Campo casaId={casaId} clipId={id + '-bandera'} />
      <path d="M0 0H80V100H0Z" fill="none" stroke={tintas.argen} strokeWidth="5" />
      <path d="M0 0H80V100H0Z" fill="none" stroke={tintas.sable} strokeWidth="3" />
    </g>
  </svg>;
}

export default Escudo;
