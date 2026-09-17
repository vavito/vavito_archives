import { resolve } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { pathToFileURL } from 'node:url';

export const REPOSITORY = 'vavito/vavito_archives';
export const REQUIRED_JOBS = ['Quality / API', 'Quality / Web', 'Quality / Deploy Gate'];
const WORKFLOW = '.github/workflows/quality.yml';
const TIMEOUT_MS = 25 * 60_000;
const POLL_MS = 45_000;

export function deployTarget(provider, env) {
  if (provider === 'vercel' && env.VERCEL_ENV === 'preview') return null;
  if (provider !== 'render' && provider !== 'vercel') {
    throw new Error('Informe --provider render ou --provider vercel.');
  }
  if (provider === 'vercel' && env.VERCEL_ENV !== 'production') {
    throw new Error('Ambiente de produção da Vercel não identificado.');
  }
  const repository =
    provider === 'render'
      ? env.RENDER_GIT_REPO_SLUG
      : `${env.VERCEL_GIT_REPO_OWNER}/${env.VERCEL_GIT_REPO_SLUG}`;
  const branch = provider === 'render' ? env.RENDER_GIT_BRANCH : env.VERCEL_GIT_COMMIT_REF;
  const sha = provider === 'render' ? env.RENDER_GIT_COMMIT : env.VERCEL_GIT_COMMIT_SHA;
  if (repository !== REPOSITORY || branch !== 'main' || !/^[a-f0-9]{40}$/u.test(sha ?? '')) {
    throw new Error(
      'Deploy bloqueado: é necessário identificar o repositório, a main e o SHA exato.',
    );
  }
  return { sha };
}

export function selectRun(runs, sha) {
  return runs
    .filter(
      (run) =>
        run.path === WORKFLOW &&
        run.event === 'push' &&
        run.head_branch === 'main' &&
        run.head_sha === sha &&
        run.repository?.full_name === REPOSITORY,
    )
    .sort((a, b) => b.id - a.id)[0];
}

export function requireSuccessfulJobs(jobs) {
  for (const name of REQUIRED_JOBS) {
    const matches = jobs.filter((job) => job.name === name);
    if (
      matches.length !== 1 ||
      matches[0].status !== 'completed' ||
      matches[0].conclusion !== 'success'
    ) {
      throw new Error(`Deploy bloqueado: ${name} ausente ou sem sucesso.`);
    }
  }
}

export async function waitForQuality(
  sha,
  {
    fetchImpl = fetch,
    now = Date.now,
    pause = sleep,
    timeoutMs = TIMEOUT_MS,
    pollMs = POLL_MS,
    log = console.log,
    token,
  } = {},
) {
  if (!/^[a-f0-9]{40}$/u.test(sha ?? '')) throw new Error('SHA inválido.');
  const deadline = now() + timeoutMs;
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'vavito-archives-deploy-gate',
    'X-GitHub-Api-Version': '2022-11-28',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  async function request(path) {
    let response;
    try {
      response = await fetchImpl(`https://api.github.com/repos/${REPOSITORY}/${path}`, {
        headers,
        signal: AbortSignal.timeout(15_000),
        redirect: 'error',
      });
    } catch {
      throw new Error('Deploy bloqueado: não foi possível consultar a CI do GitHub.');
    }
    if (!response.ok) {
      throw new Error(`Deploy bloqueado: consulta da CI retornou HTTP ${response.status}.`);
    }
    try {
      return await response.json();
    } catch {
      throw new Error('Deploy bloqueado: resposta inválida da CI do GitHub.');
    }
  }

  while (now() < deadline) {
    const data = await request(`actions/runs?head_sha=${sha}&event=push&branch=main&per_page=100`);
    if (!Array.isArray(data.workflow_runs)) throw new Error('Lista de execuções da CI inválida.');
    const run = selectRun(data.workflow_runs, sha);
    if (run?.status === 'completed') {
      if (run.conclusion !== 'success') {
        throw new Error('Deploy bloqueado: o workflow Quality não terminou com sucesso.');
      }
      if (!Number.isSafeInteger(run.id) || !Number.isSafeInteger(run.run_attempt)) {
        throw new Error('Execução da CI inválida.');
      }
      const jobs = [];
      for (let page = 1; ; page++) {
        const result = await request(
          `actions/runs/${run.id}/attempts/${run.run_attempt}/jobs?per_page=100&page=${page}`,
        );
        if (!Array.isArray(result.jobs)) throw new Error('Lista de jobs da CI inválida.');
        jobs.push(...result.jobs);
        if (result.jobs.length < 100) break;
        if (page >= 10) throw new Error('Limite de paginação dos jobs excedido.');
      }
      requireSuccessfulJobs(jobs);
      if (now() >= deadline) throw new Error('Tempo esgotado ao confirmar os checks da CI.');
      log(`CI aprovada para ${sha}: API, Web e Deploy Gate.`);
      return { runId: run.id, attempt: run.run_attempt, sha };
    }
    log(`Aguardando Quality da main para ${sha}.`);
    await pause(Math.min(pollMs, Math.max(0, deadline - now())));
  }
  throw new Error('Deploy bloqueado: tempo esgotado sem aprovação da CI para este SHA.');
}

export async function main(args = process.argv.slice(2), env = process.env) {
  if (args.length !== 2 || args[0] !== '--provider') {
    throw new Error('Informe --provider render ou --provider vercel.');
  }
  const target = deployTarget(args[1], env);
  if (!target) {
    console.log('Preview da Vercel: sem promoção para produção; gate de produção não aplicado.');
    return;
  }
  await waitForQuality(target.sha, { token: env.DEPLOY_GITHUB_READ_TOKEN });
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
