import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  deployTarget,
  main,
  REPOSITORY,
  REQUIRED_JOBS,
  requireSuccessfulJobs,
  selectRun,
  waitForQuality,
} from '../../scripts/deploy/require-quality.mjs';

const SHA = 'a'.repeat(40);
const successfulJobs = () =>
  REQUIRED_JOBS.map((name) => ({ name, status: 'completed', conclusion: 'success' }));
const successfulRun = () => ({
  id: 12,
  run_attempt: 2,
  path: '.github/workflows/quality.yml',
  event: 'push',
  head_branch: 'main',
  head_sha: SHA,
  repository: { full_name: REPOSITORY },
  status: 'completed',
  conclusion: 'success',
});
const renderEnv = () => ({
  RENDER_GIT_REPO_SLUG: REPOSITORY,
  RENDER_GIT_BRANCH: 'main',
  RENDER_GIT_COMMIT: SHA,
});
const vercelEnv = () => ({
  VERCEL_ENV: 'production',
  VERCEL_GIT_REPO_OWNER: 'vavito',
  VERCEL_GIT_REPO_SLUG: 'vavito_archives',
  VERCEL_GIT_COMMIT_REF: 'main',
  VERCEL_GIT_COMMIT_SHA: SHA,
});

function fixture(responses) {
  let clock = 0;
  const calls = [];
  return {
    calls,
    options: {
      fetchImpl: async (url, options) => {
        calls.push({ url, options });
        const next = responses.shift();
        assert.ok(next, 'requisição não esperada');
        return { ok: true, json: async () => next };
      },
      now: () => clock,
      pause: async (delay) => {
        clock += delay;
      },
      timeoutMs: 100,
      pollMs: 10,
      log: () => {},
    },
  };
}

test('Render e Vercel de produção exigem main, repositório e SHA exato', () => {
  assert.deepEqual(deployTarget('render', renderEnv()), { sha: SHA });
  assert.deepEqual(deployTarget('vercel', vercelEnv()), { sha: SHA });
  for (const key of Object.keys(renderEnv())) {
    assert.throws(() => deployTarget('render', { ...renderEnv(), [key]: '' }), /bloqueado/);
  }
  for (const key of Object.keys(vercelEnv())) {
    assert.throws(() => deployTarget('vercel', { ...vercelEnv(), [key]: '' }));
  }
  assert.throws(() => deployTarget('render', { ...renderEnv(), RENDER_GIT_BRANCH: 'feat/test' }));
  assert.throws(() =>
    deployTarget('vercel', { ...vercelEnv(), VERCEL_GIT_COMMIT_SHA: 'a'.repeat(7) }),
  );
});

test('somente preview explícito da Vercel dispensa o gate de produção', () => {
  assert.equal(deployTarget('vercel', { VERCEL_ENV: 'preview' }), null);
  assert.throws(() => deployTarget('vercel', {}));
  assert.throws(() => deployTarget('vercel', { VERCEL_ENV: 'development' }));
  assert.throws(() => deployTarget('unknown', { VERCEL_ENV: 'preview' }));
});

test('CLI recusa argumentos incompletos e não permite desligar o gate de produção', async () => {
  await assert.rejects(main([], {}));
  await assert.rejects(main(['--provider', 'render', '--skip'], renderEnv()));
});

test('seleciona a execução Quality mais recente para o SHA exato da main', () => {
  const correct = successfulRun();
  const invalid = [
    { ...correct, id: 50, path: '.github/workflows/spoof.yml' },
    { ...correct, id: 50, event: 'pull_request' },
    { ...correct, id: 50, head_branch: 'feat/test' },
    { ...correct, id: 50, head_sha: 'b'.repeat(40) },
    { ...correct, id: 50, repository: { full_name: 'other/repository' } },
  ];
  assert.equal(selectRun([...invalid, correct, { ...correct, id: 10 }], SHA), correct);
  assert.equal(selectRun(invalid, SHA), undefined);
});

for (const api of ['success', 'failure', 'cancelled', 'skipped']) {
  for (const web of ['success', 'failure', 'cancelled', 'skipped']) {
    test(`jobs API=${api} e Web=${web} só liberam sucesso de ambos`, () => {
      const jobs = successfulJobs();
      jobs[0].conclusion = api;
      jobs[1].conclusion = web;
      if (api === 'success' && web === 'success') {
        assert.doesNotThrow(() => requireSuccessfulJobs(jobs));
      } else {
        assert.throws(() => requireSuccessfulJobs(jobs), /bloqueado/);
      }
    });
  }
}

for (const conclusion of ['failure', 'cancelled', 'skipped', 'neutral', null]) {
  test(`Deploy Gate com ${conclusion} bloqueia mesmo com API e Web aprovadas`, () => {
    const jobs = successfulJobs();
    jobs[2].conclusion = conclusion;
    assert.throws(() => requireSuccessfulJobs(jobs), /Deploy Gate/);
  });
}

test('check ausente, ainda rodando ou duplicado não libera o gate', () => {
  assert.throws(() => requireSuccessfulJobs(successfulJobs().slice(0, 2)), /Deploy Gate/);
  assert.throws(() => requireSuccessfulJobs([...successfulJobs(), successfulJobs()[0]]));
  const running = successfulJobs();
  running[0].status = 'in_progress';
  assert.throws(() => requireSuccessfulJobs(running));
});

test('aprovação consulta os jobs da tentativa atual sem aceitar resultados de tentativas antigas', async () => {
  const f = fixture([{ workflow_runs: [successfulRun()] }, { jobs: successfulJobs() }]);
  assert.deepEqual(await waitForQuality(SHA, f.options), { runId: 12, attempt: 2, sha: SHA });
  assert.match(f.calls[0].url, new RegExp(`head_sha=${SHA}&event=push&branch=main`));
  assert.match(f.calls[1].url, /runs\/12\/attempts\/2\/jobs/);
  assert.equal(f.calls[0].options.redirect, 'error');
});

test('espera a CI sem reaproveitar uma execução verde anterior ao rerun pendente', async () => {
  const f = fixture([
    { workflow_runs: [successfulRun(), { ...successfulRun(), id: 20, status: 'in_progress' }] },
    { workflow_runs: [{ ...successfulRun(), id: 20 }] },
    { jobs: successfulJobs() },
  ]);
  const result = await waitForQuality(SHA, f.options);
  assert.equal(result.runId, 20);
  assert.equal(f.calls.length, 3);
});

test('falha real do workflow bloqueia antes de consultar os jobs', async () => {
  const f = fixture([{ workflow_runs: [{ ...successfulRun(), conclusion: 'failure' }] }]);
  await assert.rejects(waitForQuality(SHA, f.options), /workflow Quality/);
  assert.equal(f.calls.length, 1);
});

test('aprovação geral sem todos os jobs obrigatórios é rejeitada', async () => {
  const f = fixture([{ workflow_runs: [successfulRun()] }, { jobs: successfulJobs().slice(0, 2) }]);
  await assert.rejects(waitForQuality(SHA, f.options), /Deploy Gate/);
});

test('ausência de workflow correspondente expira sem liberar build', async () => {
  const f = fixture(Array.from({ length: 10 }, () => ({ workflow_runs: [] })));
  await assert.rejects(waitForQuality(SHA, f.options), /tempo esgotado/);
  assert.equal(f.calls.length, 10);
});

test('erro de rede e respostas HTTP não exibem tokens nem liberam build', async () => {
  const f = fixture([]);
  await assert.rejects(
    waitForQuality(SHA, {
      ...f.options,
      token: 'fixture-read-token',
      fetchImpl: async () => {
        throw new Error('fixture-read-token');
      },
    }),
    (error) => !error.message.includes('fixture-read-token') && /bloqueado/.test(error.message),
  );
  for (const status of [401, 403, 429, 500]) {
    await assert.rejects(
      waitForQuality(SHA, {
        ...f.options,
        fetchImpl: async () => ({ ok: false, status }),
      }),
      new RegExp(`HTTP ${status}`),
    );
  }
});

test('resposta JSON ou estrutura inválida é rejeitada', async () => {
  const f = fixture([{ workflow_runs: null }]);
  await assert.rejects(waitForQuality(SHA, f.options), /inválida/);
  const invalid = fixture([{ workflow_runs: [successfulRun()] }, { jobs: null }]);
  await assert.rejects(waitForQuality(SHA, invalid.options), /inválida/);
  await assert.rejects(waitForQuality('invalid', fixture([]).options), /SHA inválido/);
});

test('pagina os jobs sem aceitar aprovação incompleta na primeira página', async () => {
  const firstPage = Array.from({ length: 100 }, (_, index) => ({ name: `Outro job ${index}` }));
  const f = fixture([
    { workflow_runs: [successfulRun()] },
    { jobs: firstPage },
    { jobs: successfulJobs() },
  ]);
  await waitForQuality(SHA, f.options);
  assert.match(f.calls[2].url, /page=2$/);
});

test('bloqueia respostas sem tentativa válida e JSON ilegível', async () => {
  const f = fixture([{ workflow_runs: [{ ...successfulRun(), run_attempt: undefined }] }]);
  await assert.rejects(waitForQuality(SHA, f.options), /inválida/);
  await assert.rejects(
    waitForQuality(SHA, {
      ...fixture([]).options,
      fetchImpl: async () => ({
        ok: true,
        json: async () => {
          throw new Error('invalid json');
        },
      }),
    }),
    /resposta inválida/,
  );
});

test('consulta pública não precisa de token e não adiciona Authorization', async () => {
  const f = fixture([{ workflow_runs: [successfulRun()] }, { jobs: successfulJobs() }]);
  await waitForQuality(SHA, f.options);
  assert.equal(f.calls[0].options.headers.Authorization, undefined);
});

test('Render e Vercel chamam o gate antes do build, sem alterar o build local da Web', async () => {
  const render = await readFile(new URL('../../render.yaml', import.meta.url), 'utf8');
  const vercel = JSON.parse(
    await readFile(new URL('../../apps/web/vercel.json', import.meta.url), 'utf8'),
  );
  const web = JSON.parse(
    await readFile(new URL('../../apps/web/package.json', import.meta.url), 'utf8'),
  );
  assert.match(
    render,
    /buildCommand: node scripts\/deploy\/require-quality\.mjs --provider render && pnpm install/,
  );
  assert.match(render, /autoDeployTrigger: checksPass/);
  assert.match(
    render,
    /prisma:generate && pnpm --filter @vavito\/api build && pnpm --filter @vavito\/api prisma:migrate:deploy/,
  );
  assert.equal(
    vercel.buildCommand,
    'node ../../scripts/deploy/require-quality.mjs --provider vercel && pnpm build',
  );
  assert.doesNotMatch(web.scripts.build, /require-quality/);
});
