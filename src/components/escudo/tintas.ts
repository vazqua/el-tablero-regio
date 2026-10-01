export const tintas = { argen: '#F5F2EA', sable: '#1A1A1A' } as const;

function luminancia(hex: string) {
  const rgb = hex.slice(1).match(/../g)!.map(c => {
    const v = parseInt(c, 16) / 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
}

export function contraste(a: string, b: string) {
  const x = luminancia(a), y = luminancia(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

export function tintaSobre(color: string) {
  return contraste(color, tintas.argen) >= contraste(color, tintas.sable) ? tintas.argen : tintas.sable;
}
