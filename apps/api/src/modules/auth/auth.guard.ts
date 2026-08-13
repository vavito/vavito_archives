import { type CanActivate, type ExecutionContext, Injectable } from '@nestjs/common';

import type { AuthenticatedRequest } from '@api/modules/auth/authenticated-user';
import { SupabaseJwtService } from '@api/modules/auth/supabase-jwt.service';
import { UnauthenticatedException } from '@api/modules/auth/unauthenticated.exception';

function bearerTokenFrom(authorization: string | string[] | undefined): string {
  if (typeof authorization !== 'string') {
    throw new UnauthenticatedException();
  }

  const match = /^Bearer ([^\s]+)$/i.exec(authorization);

  if (!match?.[1]) {
    throw new UnauthenticatedException();
  }

  return match[1];
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly supabaseJwtService: SupabaseJwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const accessToken = bearerTokenFrom(request.headers.authorization);

    request.user = await this.supabaseJwtService.verify(accessToken);

    return true;
  }
}

