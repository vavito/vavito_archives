import type { ConfigService } from '@nestjs/config';
import { createRemoteJWKSet, type JWTVerifyGetKey } from 'jose';

import type { ApplicationConfig } from '@api/core/config/app.config';

const JWKS_CACHE_MAX_AGE_MS = 10 * 60 * 1000;
const JWKS_COOLDOWN_DURATION_MS = 30 * 1000;
const JWKS_TIMEOUT_DURATION_MS = 5 * 1000;

function normalizedSupabaseUrl(supabaseUrl: string): string {
  return supabaseUrl.replace(/\/+$/, '');
}

export function supabaseIssuer(supabaseUrl: string): string {
  return `${normalizedSupabaseUrl(supabaseUrl)}/auth/v1`;
}

export function createSupabaseJwks(
  configService: ConfigService<ApplicationConfig, true>,
): JWTVerifyGetKey {
  const issuer = supabaseIssuer(configService.get('supabase.url', { infer: true }));

  return createRemoteJWKSet(new URL(`${issuer}/.well-known/jwks.json`), {
    cacheMaxAge: JWKS_CACHE_MAX_AGE_MS,
    cooldownDuration: JWKS_COOLDOWN_DURATION_MS,
    timeoutDuration: JWKS_TIMEOUT_DURATION_MS,
  });
}

