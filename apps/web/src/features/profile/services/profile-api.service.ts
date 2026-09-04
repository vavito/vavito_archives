import type { ApiClient, components } from '@vavito/api-client';

import type { Profile } from '../types/profile.types';

export const DELETE_ACCOUNT_CONFIRMATION = 'EXCLUIR MINHA CONTA';

type ApiProfile = components['schemas']['ProfileResponseDto'];

function normalizeProfile(profile: ApiProfile | undefined): Profile {
  if (!profile || typeof profile !== 'object' || !('displayName' in profile)) {
    throw new Error('Não foi possível confirmar os dados do perfil.');
  }

  return {
    ...profile,
    avatarUrl: typeof profile.avatarUrl === 'string' ? profile.avatarUrl : null,
  };
}

export async function getProfile(client: ApiClient): Promise<Profile> {
  const response = await client.GET('/api/v1/profiles/me');
  return normalizeProfile(response.data);
}

export async function updateProfileName(displayName: string, client: ApiClient): Promise<Profile> {
  const response = await client.PATCH('/api/v1/profiles/me', {
    body: { displayName },
  });

  return normalizeProfile(response.data);
}

export async function uploadProfileAvatar(file: File, client: ApiClient): Promise<Profile> {
  const response = await client.PUT('/api/v1/profiles/me/avatar', {
    body: { file: file as unknown as string },
    bodySerializer() {
      const formData = new FormData();
      formData.set('file', file);
      return formData;
    },
  });

  return normalizeProfile(response.data);
}

export async function removeProfileAvatar(client: ApiClient): Promise<void> {
  await client.DELETE('/api/v1/profiles/me/avatar');
}

export async function deleteProfileAccount(client: ApiClient): Promise<void> {
  await client.DELETE('/api/v1/profiles/me', {
    body: { confirmation: DELETE_ACCOUNT_CONFIRMATION },
  });
}
