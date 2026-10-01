import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { blasones } from './blasones';
import LemaCasa from './LemaCasa';

// Texto fuente anterior a la migración: debe conservarse exactamente.
const originales = {
  'gm-desarrollos': 'Fiesta en el Valle de Oriente',
  idei: 'El cielo queda de vecino',
  'grupo-acosta-verde': 'Todos los senderos llevan aquí',
  finsa: 'Este reino mueve la máquina',
  'gp-vivienda': 'Hogares que avanzan al horizonte',
  'grupo-javer': 'De cuadra en cuadra conquistamos',
  ruba: 'Del norte para el barrio',
  vidusa: 'Vivienda masiva, gente contenta',
  'grupo-sadasi': 'Heroico hogar, heroica cuna',
  'proyectos-9': 'El centro reclama su corona',
  'dm-desarrolladora': 'El lujo tiene un punto',
  gim: 'La garza de la alta moda',
  'altea-desarrollos': 'Movemos el norte',
  'u-calli': 'El valle se traza aquí',
};

// Inventario léxico revisado manualmente; no es un analizador automático de latín.
// Una forma nueva necesita revisión antes de incorporarse a este inventario.
const raices: Record<string, string> = {
  festum: 'fest', orientis: 'orient',
  caelum: 'cael', propinquum: 'propinqu',
  omnes: 'omn', semitae: 'semit', huc: 'hic', ducentes: 'duc',
  regnum: 'reg', machinam: 'machin', movens: 'mov',
  domus: 'dom', ad: 'ad', horizontem: 'horizont', tendentes: 'tend',
  singulae: 'singul', insulae: 'insul', expugnatae: 'pugn',
  ab: 'ab', aquilone: 'aquilon', pro: 'pro', vico: 'vic',
  aedes: 'aed', multae: 'mult', populus: 'popul', laetus: 'laet',
  focus: 'foc', heroum: 'hero', cunae: 'cun', fortium: 'fort',
  centrum: 'centr', coronam: 'coron', vindicans: 'vindic',
  punctum: 'punct', luxus: 'lux',
  ardea: 'arde', summae: 'summ', elegantiae: 'elegant',
  septentriones: 'septentrion', cie: 'ci',
  vallis: 'vall', delineata: 'line',
};

describe('migración de lemas al latín', () => {
  it('conserva los 14 originales sin reescribirlos', () => {
    expect(Object.fromEntries(Object.entries(blasones).map(([id, b]) => [id, b.lemaOriginal]))).toEqual(originales);
    for (const b of Object.values(blasones)) expect(b).not.toHaveProperty('lema');
  });

  it('usa de 2 a 5 palabras y ninguna raíz léxica compartida entre Casas', () => {
    const casasPorRaiz = new Map<string, string>();
    for (const [casaId, b] of Object.entries(blasones)) {
      const palabras = b.lemaLatin.toLowerCase().match(/[a-z]+/g)!;
      expect(palabras.length).toBeGreaterThanOrEqual(2);
      expect(palabras.length).toBeLessThanOrEqual(5);
      for (const palabra of palabras) {
        const raiz = raices[palabra];
        expect(raiz, `Revisar la forma latina: ${palabra}`).toBeDefined();
        const otraCasa = casasPorRaiz.get(raiz);
        expect(otraCasa === undefined || otraCasa === casaId, `Raíz ${raiz}: ${otraCasa} / ${casaId}`).toBe(true);
        casasPorRaiz.set(raiz, casaId);
      }
    }
  });

  it('muestra el latín y su traducción con sus idiomas declarados', () => {
    for (const [casaId, b] of Object.entries(blasones)) {
      const html = renderToStaticMarkup(createElement(LemaCasa, { casaId }));
      expect(html).toContain(`lang="la">${b.lemaLatin}</p>`);
      expect(html).toContain(`lang="es">${b.lemaTraduccion}</p>`);
      expect(html).not.toContain('house-motto-original');
      const armorial = renderToStaticMarkup(createElement(LemaCasa, { casaId, mostrarOriginal: true }));
      expect(armorial).toContain(b.lemaOriginal);
    }
    expect(renderToStaticMarkup(createElement(LemaCasa, { casaId: 'inexistente' }))).toBe('');
  });
});
