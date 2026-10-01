import type { Config } from 'tailwindcss';
import plugin from 'tailwindcss/plugin';
import { palette, colors, fonts } from './src/design/tokens';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  corePlugins: { preflight: false },
  theme: { extend: { colors: { ...palette, ...colors }, fontFamily: fonts } },
  plugins: [plugin(({ addBase }) => {
    addBase({ ':root': {
      ...Object.fromEntries(Object.entries(colors).map(([name, value]) => ['--color-' + name, value])),
      ...Object.fromEntries(Object.entries(fonts).map(([name, value]) => ['--font-' + name, value.join(', ')])),
      'color-scheme': 'light',
    } });
  })],
} satisfies Config;
