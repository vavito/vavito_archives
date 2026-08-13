import { SetMetadata } from '@nestjs/common';

import { ROLES_METADATA_KEY } from '@api/core/auth/auth.constants';
import type { UserRole } from '@api/generated/prisma/client';

/** Declara as roles de Profile aceitas por uma rota protegida. */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_METADATA_KEY, roles);
