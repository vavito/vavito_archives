import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

import { UnauthenticatedException } from '@api/core/auth/errors/unauthenticated.exception';
import type {
  AuthenticatedRequest,
  AuthenticatedUser,
} from '@api/core/auth/interfaces/authenticated-user.interface';

/** Extrai do request o usuário validado pelo SupabaseAuthGuard. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedUser => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (!request.user) {
      throw new UnauthenticatedException();
    }

    return request.user;
  },
);
