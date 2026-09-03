import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

import type {
  AuthenticatedRequest,
  AuthenticatedUser,
} from '@api/core/auth/interfaces/authenticated-user.interface';

/** Extrai o usuário quando a rota aceita autenticação opcional. */
export const OptionalCurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedUser | null => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    return request.user ?? null;
  },
);
