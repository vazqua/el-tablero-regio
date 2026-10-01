export const palette = {
  'pearl-beige': { 50: '#f9f6eb', 100: '#f4edd7', 200: '#e9dbaf', 300: '#ddc988', 400: '#d2b760', 500: '#c7a638', 600: '#9f842d', 700: '#776322', 800: '#504216', 900: '#28210b', 950: '#1c1708' },
  'deep-crimson': { 50: '#fbe9ea', 100: '#f7d4d4', 200: '#f0a8a9', 300: '#e87d7f', 400: '#e05254', 500: '#d92629', 600: '#ad1f21', 700: '#821719', 800: '#570f10', 900: '#2b0808', 950: '#1e0506' },
  'clay-soil': { 50: '#f7efee', 100: '#efe0dc', 200: '#dec0ba', 300: '#cea197', 400: '#be8274', 500: '#ad6252', 600: '#8b4f41', 700: '#683b31', 800: '#452721', 900: '#231410', 950: '#180e0b' },
  'beige': { 50: '#f9f9eb', 100: '#f4f3d7', 200: '#e8e6b0', 300: '#ddda88', 400: '#d1cd61', 500: '#c6c139', 600: '#9e9a2e', 700: '#777422', 800: '#4f4d17', 900: '#28270b', 950: '#1c1b08' },
  'brandy': { 50: '#fbeeea', 100: '#f7dcd4', 200: '#eebaaa', 300: '#e6977f', 400: '#dd7555', 500: '#d5522a', 600: '#aa4222', 700: '#803119', 800: '#552111', 900: '#2b1008', 950: '#1e0b06' }
} as const;

export const colors = {
  bg: palette['pearl-beige'][50],
  surface: palette['pearl-beige'][100],
  ink: palette['clay-soil'][950],
  'ink-soft': palette['clay-soil'][700],
  border: palette['clay-soil'][800],
  accent: palette['deep-crimson'][700],
  'accent-hover': palette['deep-crimson'][600],
  highlight: palette.brandy[500],
  crown: palette['pearl-beige'][500],
  'neutral-land': palette['clay-soil'][200],
} as const;

export const fonts = {
  display: ['Macondo', 'cursive'],
  title: ['Nunito', 'sans-serif'],
  body: ['Nunito', 'sans-serif'],
};
