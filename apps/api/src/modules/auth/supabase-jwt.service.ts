import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { jwtVerify, type JWTPayload, type JWTVerifyGetKey } from 'jose';

import type { ApplicationConfig } from '@api/core/config/app.config';
import { SUPABASE_JWKS, SUPABASE_JWT_AUDIENCE } from '@api/modules/auth/auth.constants';
import type { AuthenticatedUser } from '@api/modules/auth/authenticated-user';
import { supabaseIssuer } from '@api/modules/auth/supabase-jwks';
import { UnauthenticatedException } from '@api/modules/auth/unauthenticated.exception';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

interface SupabaseAccessTokenPayload extends JWTPayload {
  email?: unknown;
  role?: unknown;
}

function authenticatedUserFrom(payload: SupabaseAccessTokenPayload): AuthenticatedUser {
  if (
    typeof payload.sub !== 'string' ||
    !UUID_PATTERN.test(payload.sub) ||
    typeof payload.email !== 'string' ||
    payload.email.trim().length === 0 ||
    payload.role !== SUPABASE_JWT_AUDIENCE
  ) {
    throw new Error('O JWT autenticado não contém as claims obrigatórias esperadas.');
  }

  return {
    email: payload.email,
    id: payload.sub,
  };
}

@Injectable()
export class SupabaseJwtService {
  private readonly issuer: string;

  constructor(
    configService: ConfigService<ApplicationConfig, true>,
    @Inject(SUPABASE_JWKS) private readonly jwks: JWTVerifyGetKey,
  ) {
    this.issuer = supabaseIssuer(configService.get('supabase.url', { infer: true }));
  }

  async verify(accessToken: string): Promise<AuthenticatedUser> {
    try {
      const result = await jwtVerify<SupabaseAccessTokenPayload>(accessToken, this.jwks, {
        audience: SUPABASE_JWT_AUDIENCE,
        issuer: this.issuer,
      });

      return authenticatedUserFrom(result.payload);
    } catch (error) {
      throw new UnauthenticatedException(error);
    }
  }
}

