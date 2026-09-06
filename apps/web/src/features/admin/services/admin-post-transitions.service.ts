import type { ApiClient } from '@vavito/api-client';

import { normalizeAdminPostDetail } from '../mappers/admin-post.mapper';
import type { AdminPostDetail, AdminPostTransition } from '../types/admin-post.types';

export async function transitionAdminPost(
  id: string,
  transition: AdminPostTransition,
  client: ApiClient,
): Promise<AdminPostDetail> {
  const options = { params: { path: { id } } };

  switch (transition) {
    case 'archive': {
      const response = await client.POST('/api/v1/admin/posts/{id}/archive', options);
      return normalizeAdminPostDetail(response.data);
    }
    case 'publish': {
      const response = await client.POST('/api/v1/admin/posts/{id}/publish', options);
      return normalizeAdminPostDetail(response.data);
    }
    case 'restore': {
      const response = await client.POST('/api/v1/admin/posts/{id}/restore', options);
      return normalizeAdminPostDetail(response.data);
    }
    case 'unpublish': {
      const response = await client.POST('/api/v1/admin/posts/{id}/unpublish', options);
      return normalizeAdminPostDetail(response.data);
    }
  }
}
