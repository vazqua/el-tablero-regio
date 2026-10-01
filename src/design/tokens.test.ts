import { describe, expect, it } from 'vitest';
import { colors, fonts, palette } from './tokens';

describe('sistema visual', () => {
  it('registra las cinco familias completas', () => {
    expect(Object.keys(palette)).toEqual(['pearl-beige', 'deep-crimson', 'clay-soil', 'beige', 'brandy']);
    for (const familia of Object.values(palette)) expect(Object.keys(familia).map(Number)).toEqual([50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]);
  });
  it('resuelve exactamente los diez alias solicitados', () => {
    expect(colors).toEqual({ bg: '#f9f6eb', surface: '#f4edd7', ink: '#180e0b', 'ink-soft': '#683b31', border: '#452721', accent: '#821719', 'accent-hover': '#ad1f21', highlight: '#d5522a', crown: '#c7a638', 'neutral-land': '#dec0ba' });
  });
  it('separa identidad, títulos e información', () => {
    expect(fonts).toEqual({ display: ['Macondo', 'cursive'], title: ['Nunito', 'sans-serif'], body: ['Nunito', 'sans-serif'] });
  });
});
