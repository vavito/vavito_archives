import { spawn } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDirectory = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = resolve(currentDirectory, '../../..');
const webDirectory = resolve(workspaceRoot, 'apps/web');
const nextCli = resolve(webDirectory, 'node_modules/next/dist/bin/next');
const apiUrl = 'http://127.0.0.1:4100';
const webUrl = 'http://127.0.0.1:3100';
const children = [];

function start(command, args, options = {}) {
  const child = spawn(command, args, {
    cwd: options.cwd ?? workspaceRoot,
    env: { ...process.env, ...options.env },
    stdio: ['ignore', 'inherit', 'inherit'],
  });
  children.push(child);
  child.once('exit', (code) => {
    if (code && !process.exitCode) process.exitCode = code;
  });
  return child;
}

async function waitFor(url) {
  const deadline = Date.now() + 90_000;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // O processo ainda está iniciando.
    }

    await new Promise((resolveWait) => setTimeout(resolveWait, 500));
  }

  throw new Error(`Servidor de performance não respondeu em ${url}.`);
}

function stop() {
  for (const child of children) {
    if (!child.killed) child.kill();
  }
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => {
    stop();
    process.exit(0);
  });
}

start(process.execPath, [resolve(currentDirectory, 'public-api-server.mjs')], {
  env: { E2E_API_PORT: '4100' },
});

start(process.execPath, [nextCli, 'start', '--hostname', '127.0.0.1', '--port', '3100'], {
  cwd: webDirectory,
  env: {
    NEXT_PUBLIC_API_URL: apiUrl,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'lighthouse-publishable-key',
    NEXT_PUBLIC_SUPABASE_URL: 'http://localhost:54321',
    VAVITO_E2E: 'true',
  },
});

await Promise.all([waitFor(`${apiUrl}/health`), waitFor(webUrl)]);
console.log('Lighthouse servers ready');

await new Promise(() => {});
