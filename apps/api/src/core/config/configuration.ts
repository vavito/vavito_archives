import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

import type { ApplicationConfig, AppEnvironment } from '@api/core/config/app.config';

const workingDirectory = process.cwd();
const workspaceRootCandidate = resolve(workingDirectory, '../..');
const workspaceRoot = existsSync(resolve(workingDirectory, 'pnpm-workspace.yaml'))
  ? workingDirectory
  : existsSync(resolve(workspaceRootCandidate, 'pnpm-workspace.yaml'))
    ? workspaceRootCandidate
    : workingDirectory;

export const environmentFilePaths = [
  ...new Set([
    resolve(workingDirectory, '.env.local'),
    resolve(workingDirectory, '.env'),
    resolve(workspaceRoot, '.env.local'),
    resolve(workspaceRoot, '.env'),
  ]),
];

function requiredEnvironmentValue(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Environment variable ${name} was not loaded after validation.`);
  }

  return value;
}

export default function configuration(): ApplicationConfig {
  return {
    app: {
      environment: requiredEnvironmentValue('NODE_ENV') as AppEnvironment,
      frontendUrl: requiredEnvironmentValue('FRONTEND_URL'),
      port: Number(requiredEnvironmentValue('PORT')),
      version: requiredEnvironmentValue('APP_VERSION'),
    },
    database: {
      url: requiredEnvironmentValue('DATABASE_URL'),
    },
    resend: {
      apiKey: requiredEnvironmentValue('RESEND_API_KEY'),
    },
    security: {
      revalidationSecret: requiredEnvironmentValue('REVALIDATION_SECRET'),
    },
    supabase: {
      serviceRoleKey: requiredEnvironmentValue('SUPABASE_SERVICE_ROLE_KEY'),
      url: requiredEnvironmentValue('SUPABASE_URL'),
    },
  };
}
