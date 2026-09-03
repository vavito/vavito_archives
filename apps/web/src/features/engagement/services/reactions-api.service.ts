import type { ApiClient } from '@vavito/api-client';

import type { ReactionState, ReactionType } from '../types/reactions.types';

export async function setReaction(
  postId: string,
  type: ReactionType,
  client: ApiClient,
): Promise<ReactionState> {
  const response = await client.PUT('/api/v1/posts/{id}/reaction', {
    body: { type },
    params: { path: { id: postId } },
  });

  if (!response.data) {
    throw new Error('Não foi possível confirmar sua reação.');
  }

  return response.data;
}

export async function removeReaction(postId: string, client: ApiClient): Promise<void> {
  await client.DELETE('/api/v1/posts/{id}/reaction', {
    params: { path: { id: postId } },
  });
}
