import { FlagTriangleRight } from 'lucide-react';
import { figuras } from './escudo/figuras';

export default function IconoBastion({ size = 18 }: { size?: number }) {
  return <svg className="bastion-icon" width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" focusable="false">
    <FlagTriangleRight x={15} y={0} width={16} height={16} strokeWidth={2.5} />
    <path d={figuras.torre} transform="translate(5 11) scale(.9)" fill="currentColor" fillRule="evenodd" />
  </svg>;
}
