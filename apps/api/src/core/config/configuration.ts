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
      swaggerEnabled: requiredEnvironmentValue('SWAGGER_ENABLED') === 'true',
      version: requiredEnvironmentValue('APP_VERSION'),
    },
    database: {
      connectOnStart: requiredEnvironmentValue('DATABASE_CONNECT_ON_START') === 'true',
      directUrl: requiredEnvironmentValue('DIRECT_URL'),
      url: requiredEnvironmentValue('DATABASE_URL'),
    },
    resend: {
      adminRecipient: requiredEnvironmentValue('MAIL_ADMIN_RECIPIENT'),
      apiKey: requiredEnvironmentValue('RESEND_API_KEY'),
      contactFrom: requiredEnvironmentValue('MAIL_CONTACT_FROM'),
      maxAttempts: Number(requiredEnvironmentValue('RESEND_MAX_ATTEMPTS')),
      newsletterFrom: requiredEnvironmentValue('MAIL_NEWSLETTER_FROM'),
      replyTo: requiredEnvironmentValue('MAIL_REPLY_TO'),
      timeoutMs: Number(requiredEnvironmentValue('RESEND_TIMEOUT_MS')),
    },
    security: {
      newsletterTokenSecret: requiredEnvironmentValue('NEWSLETTER_TOKEN_SECRET'),
      revalidationSecret: requiredEnvironmentValue('REVALIDATION_SECRET'),
      viewFingerprintSecret: requiredEnvironmentValue('VIEW_FINGERPRINT_SECRET'),
    },
    supabase: {
      avatarsBucket: requiredEnvironmentValue('SUPABASE_AVATARS_BUCKET'),
      mediaBucket: requiredEnvironmentValue('SUPABASE_MEDIA_BUCKET'),
      serviceRoleKey: requiredEnvironmentValue('SUPABASE_SERVICE_ROLE_KEY'),
      url: requiredEnvironmentValue('SUPABASE_URL'),
    },
  };
}
