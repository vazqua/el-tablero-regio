import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 60000,
  use: { baseURL: process.env.E2E_DEV_URL ?? 'http://127.0.0.1:5173', channel: 'msedge', launchOptions: { args: ['--enable-webgl', '--ignore-gpu-blocklist'] }, screenshot: 'only-on-failure' },
  projects: [
    { name: 'escritorio', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'movil', use: { viewport: { width: 390, height: 844 }, isMobile: true, deviceScaleFactor: 1 } },
  ],
});
