import { type CanActivate, type ExecutionContext, Injectable } from '@nestjs/common';

import { UnauthenticatedException } from '@api/core/auth/errors/unauthenticated.exception';
import type { AuthenticatedRequest } from '@api/core/auth/interfaces/authenticated-user.interface';
import { SupabaseJwtService } from '@api/core/auth/supabase-jwt.service';

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
export class SupabaseAuthGuard implements CanActivate {
  constructor(private readonly supabaseJwtService: SupabaseJwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const accessToken = bearerTokenFrom(request.headers.authorization);

    request.user = await this.supabaseJwtService.verify(accessToken);

    return true;
  }
}

