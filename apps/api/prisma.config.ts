import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

import { config as loadEnvironment } from 'dotenv';
import { defineConfig } from 'prisma/config';

const workingDirectory = process.cwd();
const workspaceRootCandidate = resolve(workingDirectory, '../..');
const workspaceRoot = existsSync(resolve(workingDirectory, 'pnpm-workspace.yaml'))
  ? workingDirectory
  : existsSync(resolve(workspaceRootCandidate, 'pnpm-workspace.yaml'))
    ? workspaceRootCandidate
    : workingDirectory;

loadEnvironment({
  path: [resolve(workspaceRoot, '.env.local'), resolve(workspaceRoot, '.env')],
  quiet: true,
});

export default defineConfig({
  datasource: {
    // `generate` não acessa o banco; o fallback permite gerar o client no CI
    // antes de a Task 2.6 disponibilizar o PostgreSQL de integração.
    url: process.env.DIRECT_URL ?? 'postgresql://postgres:postgres@localhost:5432/vavito_archives',
  },
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  schema: 'prisma/schema.prisma',
});
