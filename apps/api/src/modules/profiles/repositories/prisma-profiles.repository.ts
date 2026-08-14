import { Injectable } from '@nestjs/common';

import { PrismaService } from '@api/core/database/prisma.service';
import type { Profile } from '@api/modules/profiles/domain/entities/profile.entity';
import { ProfileMapper } from '@api/modules/profiles/mappers/profile.mapper';
import { ProfilesRepository } from '@api/modules/profiles/repositories/profiles.repository';

@Injectable()
export class PrismaProfilesRepository implements ProfilesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async anonymizeAccount(profile: Profile): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.reaction.deleteMany({ where: { profileId: profile.id } }),
      this.prisma.bookmark.deleteMany({ where: { profileId: profile.id } }),
      this.prisma.profile.update({
        data: {
          avatarPath: profile.avatarPath,
          deletedAt: profile.deletedAt,
          displayName: profile.displayName,
          updatedAt: profile.updatedAt,
        },
        where: { id: profile.id },
      }),
    ]);
  }

  async findActiveById(id: string): Promise<Profile | null> {
    const profile = await this.prisma.profile.findFirst({ where: { deletedAt: null, id } });

    return profile ? ProfileMapper.toDomain(profile) : null;
  }

  async findById(id: string): Promise<Profile | null> {
    const profile = await this.prisma.profile.findUnique({ where: { id } });

    return profile ? ProfileMapper.toDomain(profile) : null;
  }

  async save(profile: Profile): Promise<void> {
    await this.prisma.profile.update({
      data: {
        avatarPath: profile.avatarPath,
        displayName: profile.displayName,
        updatedAt: profile.updatedAt,
      },
      where: { id: profile.id },
    });
  }
}
