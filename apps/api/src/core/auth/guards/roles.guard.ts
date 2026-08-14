import { type CanActivate, type ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import {
  PUBLIC_ROUTE_METADATA_KEY,
  ROLES_METADATA_KEY,
} from '@api/core/auth/constants/auth.constants';
import { ForbiddenAccessException } from '@api/core/auth/errors/forbidden-access.exception';
import { UnauthenticatedException } from '@api/core/auth/errors/unauthenticated.exception';
import type { AuthenticatedRequest } from '@api/core/auth/interfaces/authenticated-user.interface';
import { ProfileAuthorizationRepository } from '@api/core/auth/repositories/profile-authorization.repository';
import type { UserRole } from '@api/generated/prisma/client';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly profileAuthorizationRepository: ProfileAuthorizationRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const targets = [context.getHandler(), context.getClass()];
    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_ROUTE_METADATA_KEY, targets);

    if (isPublic) {
      return true;
    }

    const acceptedRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_METADATA_KEY, targets);

    if (!acceptedRoles?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (!request.user) {
      throw new UnauthenticatedException();
    }

    const role = await this.profileAuthorizationRepository.findActiveRoleByProfileId(
      request.user.id,
    );

    if (!role || !acceptedRoles.includes(role)) {
      throw new ForbiddenAccessException();
    }

    return true;
  }
}
