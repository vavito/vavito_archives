import type { UserRole } from '@api/generated/prisma/client';

export abstract class ProfileAuthorizationRepository {
  abstract findActiveRoleByProfileId(profileId: string): Promise<UserRole | null>;
}
