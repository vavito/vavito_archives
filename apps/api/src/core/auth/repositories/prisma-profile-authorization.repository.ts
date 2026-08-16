import { Injectable } from '@nestjs/common';

import { ProfileAuthorizationRepository } from '@api/core/auth/repositories/profile-authorization.repository';
import { PrismaService } from '@api/core/database/prisma.service';
import type { UserRole } from '@api/generated/prisma/client';

@Injectable()
export class PrismaProfileAuthorizationRepository extends ProfileAuthorizationRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findActiveRoleByProfileId(profileId: string): Promise<UserRole | null> {
    const profile = await this.prisma.profile.findFirst({
      select: { role: true },
      where: { deletedAt: null, id: profileId },
    });

    return profile?.role ?? null;
  }
}
