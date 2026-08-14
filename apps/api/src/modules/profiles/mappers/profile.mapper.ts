import type { Profile as PrismaProfile } from '@api/generated/prisma/client';
import { Profile } from '@api/modules/profiles/domain/entities/profile.entity';
import type { ProfileResponseDto } from '@api/modules/profiles/dto/response/profile-response.dto';

export class ProfileMapper {
  static toDomain(profile: PrismaProfile): Profile {
    return Profile.restore({
      avatarPath: profile.avatarPath,
      createdAt: profile.createdAt,
      deletedAt: profile.deletedAt,
      displayName: profile.displayName,
      id: profile.id,
      role: profile.role,
      updatedAt: profile.updatedAt,
    });
  }

  static toResponse(profile: Profile, avatarUrl: string | null): ProfileResponseDto {
    return {
      avatarUrl,
      createdAt: profile.createdAt.toISOString(),
      displayName: profile.displayName,
      id: profile.id,
      role: profile.role,
      updatedAt: profile.updatedAt.toISOString(),
    };
  }
}
