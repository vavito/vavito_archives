import type { ApiClient, components } from '@vavito/api-client';

export type AdminTag = components['schemas']['AdminTagResponseDto'];

export async function listAdminTags(client: ApiClient): Promise<AdminTag[]> {
  const response = await client.GET('/api/v1/admin/tags');
  return response.data ?? [];
}

export async function updateAdminTagVisibility(
  id: string,
  isPublic: boolean,
  client: ApiClient,
): Promise<AdminTag> {
  const response = await client.PATCH('/api/v1/admin/tags/{id}/visibility', {
    body: { isPublic },
    params: { path: { id } },
  });
  if (!response.data) throw new Error('Não foi possível atualizar a visibilidade do tópico.');
  return response.data;
}
