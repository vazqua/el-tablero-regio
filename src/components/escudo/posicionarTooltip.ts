export interface Caja { x: number; y: number; width: number; height: number }

export function posicionarTooltip(cursor: { x: number; y: number }, ancho: number, alto: number, mapa: { width: number; height: number }, obstaculos: Caja[]) {
  const margen = 12, espacio = 20;
  const candidatos = [
    { x: cursor.x + espacio, y: cursor.y + espacio },
    { x: cursor.x - ancho - espacio, y: cursor.y + espacio },
    { x: cursor.x + espacio, y: cursor.y - alto - espacio },
    { x: cursor.x - ancho - espacio, y: cursor.y - alto - espacio },
    ...obstaculos.flatMap(b => [
      { x: b.x + b.width + espacio, y: cursor.y },
      { x: b.x - ancho - espacio, y: cursor.y },
      { x: cursor.x, y: b.y + b.height + espacio },
      { x: cursor.x, y: b.y - alto - espacio },
    ]),
    { x: margen, y: margen }, { x: mapa.width - ancho - margen, y: margen },
    { x: margen, y: mapa.height - alto - margen }, { x: mapa.width - ancho - margen, y: mapa.height - alto - margen },
  ].map(p => ({
    x: Math.max(margen, Math.min(p.x, mapa.width - ancho - margen)),
    y: Math.max(margen, Math.min(p.y, mapa.height - alto - margen)),
  }));
  // Prioriza espacio libre; en un mapa saturado minimiza el área tapada.
  const solape = (p: { x: number; y: number }) => obstaculos.reduce((s, b) =>
    s + Math.max(0, Math.min(p.x + ancho, b.x + b.width + margen) - Math.max(p.x, b.x - margen))
      * Math.max(0, Math.min(p.y + alto, b.y + b.height + margen) - Math.max(p.y, b.y - margen)), 0);
  return candidatos.sort((a, b) => solape(a) - solape(b)
    || Math.hypot(a.x - cursor.x, a.y - cursor.y) - Math.hypot(b.x - cursor.x, b.y - cursor.y))[0];
}
