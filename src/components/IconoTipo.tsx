import { Building2, House, BriefcaseBusiness, ShoppingBag, Factory, Blocks } from 'lucide-react';
import type { Desarrollo } from '../types';
const iconos = {
  'residencial-alta-densidad': Building2, 'residencial-baja-densidad': House,
  oficinas: BriefcaseBusiness, comercial: ShoppingBag, 'uso-mixto': Blocks, industrial: Factory,
};
export default function IconoTipo({ tipo, size = 16 }: { tipo: Desarrollo['tipo']; size?: number }) {
  const Icono = iconos[tipo];
  return <Icono size={size} strokeWidth={2.2} aria-hidden="true" />;
}

