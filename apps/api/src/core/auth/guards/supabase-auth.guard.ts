import { type CanActivate, type ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import {
  OPTIONAL_AUTH_ROUTE_METADATA_KEY,
  PUBLIC_ROUTE_METADATA_KEY,
} from '@api/core/auth/constants/auth.constants';
import { UnauthenticatedException } from '@api/core/auth/errors/unauthenticated.exception';
import type { AuthenticatedRequest } from '@api/core/auth/interfaces/authenticated-user.interface';
import { SupabaseJwtService } from '@api/core/auth/services/supabase-jwt.service';

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
  constructor(
    private readonly reflector: Reflector,
    private readonly supabaseJwtService: SupabaseJwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const targets = [context.getHandler(), context.getClass()];
    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_ROUTE_METADATA_KEY, targets);
    const isOptional = this.reflector.getAllAndOverride<boolean>(
      OPTIONAL_AUTH_ROUTE_METADATA_KEY,
      targets,
    );

    if (isPublic && !isOptional) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (isOptional && request.headers.authorization === undefined) {
      return true;
    }

    const accessToken = bearerTokenFrom(request.headers.authorization);

    request.user = await this.supabaseJwtService.verify(accessToken);

    return true;
  }
}
