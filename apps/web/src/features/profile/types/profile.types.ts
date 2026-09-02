import type { components } from '@vavito/api-client';

type ApiProfile = components['schemas']['ProfileResponseDto'];

export interface Profile extends Omit<ApiProfile, 'avatarUrl'> {
  avatarUrl: string | null;
}

export type ProfileOperation = 'avatar' | 'delete' | 'name' | null;
