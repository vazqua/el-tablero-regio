import { createServer, preview } from 'vite';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const dev = await createServer({ server: { host: '127.0.0.1', port: 0, open: false } });
let produccion;
try {
  await dev.listen();
  produccion = await preview({ preview: { host: '127.0.0.1', port: 0, open: false } });
  const child = spawn(process.execPath, [fileURLToPath(new URL('../node_modules/@playwright/test/cli.js', import.meta.url)), 'test', ...process.argv.slice(2)], {
    stdio: 'inherit',
    env: { ...process.env, E2E_DEV_URL: dev.resolvedUrls.local[0], E2E_PROD_URL: produccion.resolvedUrls.local[0] },
  });
  process.exitCode = await new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('exit', code => resolve(code ?? 1));
  });
} finally {
  await dev.close();
  if (produccion) {
    produccion.httpServer.closeAllConnections();
    await new Promise(resolve => produccion.httpServer.close(resolve));
  }
}

