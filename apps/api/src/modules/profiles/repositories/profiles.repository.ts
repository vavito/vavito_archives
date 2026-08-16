import type { Profile } from '@api/modules/profiles/domain/entities/profile.entity';

export abstract class ProfilesRepository {
  abstract anonymizeAccount(profile: Profile): Promise<void>;
  abstract findActiveById(id: string): Promise<Profile | null>;
  abstract findById(id: string): Promise<Profile | null>;
  abstract save(profile: Profile): Promise<void>;
}
