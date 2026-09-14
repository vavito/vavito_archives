import { spawn } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium } from '@playwright/test';
import lighthouse from 'lighthouse';

import { packageManagerCommand } from './package-manager-command.mjs';

const currentDirectory = dirname(fileURLToPath(import.meta.url));
const e2eDirectory = resolve(currentDirectory, '..');
const workspaceRoot = resolve(currentDirectory, '../../..');
const reportsDirectory = resolve(e2eDirectory, '.lighthouseci/reports');
const apiUrl = 'http://127.0.0.1:4100';
const webUrl = 'http://127.0.0.1:3100';
const auditedPages = [
  { name: 'home', url: `${webUrl}/` },
  { name: 'artigos', url: `${webUrl}/artigos` },
  { name: 'artigo', url: `${webUrl}/artigos/arquitetura-nestjs` },
];
const performanceEnv = {
  ...process.env,
  NEXT_PUBLIC_API_URL: apiUrl,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'lighthouse-publishable-key',
  NEXT_PUBLIC_SUPABASE_URL: 'http://localhost:54321',
  VAVITO_E2E: 'true',
};

function start(command, args, options = {}) {
  return spawn(command, args, {
    cwd: options.cwd ?? workspaceRoot,
    env: options.env ?? performanceEnv,
    shell: options.shell ?? false,
    stdio: options.stdio ?? 'inherit',
  });
}

function run(args, cwd) {
  const invocation = packageManagerCommand(args);

  return new Promise((resolveRun, rejectRun) => {
    const child = start(invocation.command, invocation.args, {
      cwd,
      shell: invocation.shell,
    });

    child.once('error', rejectRun);
    child.once('exit', (code) => {
      if (code === 0) resolveRun();
      else rejectRun(new Error(`Comando de performance finalizou com código ${code}.`));
    });
  });
}

async function availablePort() {
  const server = createServer();
  await new Promise((resolveListen, rejectListen) => {
    server.once('error', rejectListen);
    server.listen(0, '127.0.0.1', resolveListen);
  });
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 0;
  await new Promise((resolveClose) => server.close(resolveClose));
  if (!port) throw new Error('Não foi possível reservar uma porta para o Lighthouse.');
  return port;
}

async function waitFor(url, timeoutMs = 90_000) {
  const deadline = Date.now() + timeoutMs;

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

function percent(score) {
  return Math.round((score ?? 0) * 100);
}

function numericAudit(lhr, auditId) {
  return lhr.audits[auditId]?.numericValue ?? Number.POSITIVE_INFINITY;
}

function validateRuns(page, runs) {
  const best = {
    accessibility: Math.max(...runs.map((run) => run.categories.accessibility?.score ?? 0)),
    bestPractices: Math.max(...runs.map((run) => run.categories['best-practices']?.score ?? 0)),
    cls: Math.min(...runs.map((run) => numericAudit(run, 'cumulative-layout-shift'))),
    lcp: Math.min(...runs.map((run) => numericAudit(run, 'largest-contentful-paint'))),
    performance: Math.max(...runs.map((run) => run.categories.performance?.score ?? 0)),
    seo: Math.max(...runs.map((run) => run.categories.seo?.score ?? 0)),
    tbt: Math.min(...runs.map((run) => numericAudit(run, 'total-blocking-time'))),
    totalBytes: Math.min(...runs.map((run) => numericAudit(run, 'total-byte-weight'))),
  };
  const failures = [];

  if (best.performance < 0.85) failures.push(`performance ${percent(best.performance)} < 85`);
  if (best.accessibility < 0.95)
    failures.push(`acessibilidade ${percent(best.accessibility)} < 95`);
  if (best.bestPractices < 0.9) failures.push(`boas práticas ${percent(best.bestPractices)} < 90`);
  if (best.seo < 0.9) failures.push(`SEO ${percent(best.seo)} < 90`);
  if (best.lcp > 2500) failures.push(`LCP ${Math.round(best.lcp)} ms > 2500 ms`);
  if (best.cls > 0.1) failures.push(`CLS ${best.cls.toFixed(3)} > 0.1`);
  if (best.tbt > 600) failures.push(`TBT ${Math.round(best.tbt)} ms > 600 ms`);
  if (best.totalBytes > 1_000_000)
    failures.push(`transferência ${Math.round(best.totalBytes / 1024)} KB > 977 KB`);

  console.log(
    `${page}: performance ${percent(best.performance)}, acessibilidade ${percent(best.accessibility)}, LCP ${Math.round(best.lcp)} ms, CLS ${best.cls.toFixed(3)}, TBT ${Math.round(best.tbt)} ms, ${Math.round(best.totalBytes / 1024)} KB`,
  );

  return failures;
}

await run(['--filter', '@vavito/web', 'exec', 'next', 'build'], workspaceRoot);
await mkdir(reportsDirectory, { recursive: true });

const servers = start(process.execPath, [resolve(currentDirectory, 'lighthouse-server.mjs')]);
let browser;
let browserProfile;

try {
  await Promise.all([waitFor(`${apiUrl}/health`), waitFor(webUrl)]);

  const debuggingPort = await availablePort();
  browserProfile = await mkdtemp(join(tmpdir(), 'vavito-lighthouse-'));
  browser = start(
    chromium.executablePath(),
    [
      '--headless=new',
      '--no-sandbox',
      '--no-first-run',
      '--no-default-browser-check',
      `--remote-debugging-port=${debuggingPort}`,
      `--user-data-dir=${browserProfile}`,
      'about:blank',
    ],
    { stdio: 'ignore' },
  );
  await waitFor(`http://127.0.0.1:${debuggingPort}/json/version`, 30_000);

  const failures = [];

  for (const page of auditedPages) {
    const runs = [];

    for (let runIndex = 1; runIndex <= 3; runIndex += 1) {
      const result = await lighthouse(page.url, {
        logLevel: 'error',
        output: ['html', 'json'],
        port: debuggingPort,
        throttlingMethod: 'devtools',
      });

      if (!result) throw new Error(`O Lighthouse não gerou resultado para ${page.url}.`);
      runs.push(result.lhr);

      const reports = Array.isArray(result.report) ? result.report : [result.report];
      await writeFile(
        resolve(reportsDirectory, `${page.name}-${runIndex}.html`),
        reports[0] ?? '',
        'utf8',
      );
      await writeFile(
        resolve(reportsDirectory, `${page.name}-${runIndex}.json`),
        reports[1] ?? JSON.stringify(result.lhr),
        'utf8',
      );
    }

    failures.push(...validateRuns(page.name, runs).map((failure) => `${page.name}: ${failure}`));
  }

  if (failures.length > 0) {
    throw new Error(`Metas de performance não atendidas:\n- ${failures.join('\n- ')}`);
  }
} finally {
  browser?.kill();
  servers.kill();

  if (browserProfile) {
    await new Promise((resolveWait) => setTimeout(resolveWait, 500));
    await rm(browserProfile, { force: true, maxRetries: 3, recursive: true }).catch(
      () => undefined,
    );
  }
}
