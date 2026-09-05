import type { ApiClient } from '@vavito/api-client';

import { normalizeAdminPostDetail, normalizeAdminPostsPage } from '../mappers/admin-post.mapper';
import type { AdminPostDetail, AdminPostsFilters, AdminPostsPage } from '../types/admin-post.types';

export const ADMIN_POSTS_PAGE_SIZE = 20;

export async function listAdminPosts(
  filters: AdminPostsFilters,
  client: ApiClient,
): Promise<AdminPostsPage> {
  const normalizedFilters: AdminPostsFilters = {
    page: Number.isSafeInteger(filters.page) && filters.page > 0 ? filters.page : 1,
    query: filters.query.trim().replaceAll(/\s+/g, ' ').slice(0, 200),
    status: filters.status,
  };
  const response = await client.GET('/api/v1/admin/posts', {
    params: {
      query: {
        limit: ADMIN_POSTS_PAGE_SIZE,
        page: normalizedFilters.page,
        ...(normalizedFilters.query ? { q: normalizedFilters.query } : {}),
        ...(normalizedFilters.status ? { status: normalizedFilters.status } : {}),
      },
    },
  });

  return normalizeAdminPostsPage(response.data, normalizedFilters);
}

export async function getAdminPostDetail(id: string, client: ApiClient): Promise<AdminPostDetail> {
  const response = await client.GET('/api/v1/admin/posts/{id}', {
    params: { path: { id } },
  });

  return normalizeAdminPostDetail(response.data);
}
