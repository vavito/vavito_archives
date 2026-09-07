import type { ApiClient } from '@vavito/api-client';
import type {
  AdminComment,
  AdminCommentsPage,
  ModerationStatus,
} from '../types/admin-community.types';

export async function listAdminComments(
  page: number,
  status: AdminComment['status'] | undefined,
  client: ApiClient,
): Promise<AdminCommentsPage> {
  const response = await client.GET('/api/v1/admin/comments', {
    params: { query: { page, limit: 20, ...(status ? { status } : {}) } },
  });
  if (!response.data) throw new Error('Missing comments response');
  return response.data;
}

export async function moderateAdminComment(
  id: string,
  status: ModerationStatus,
  reason: string,
  client: ApiClient,
): Promise<AdminComment> {
  const response = await client.PATCH('/api/v1/admin/comments/{id}/status', {
    params: { path: { id } },
    body: { status, ...(reason.trim() ? { reason: reason.trim() } : {}) },
  });
  if (!response.data) throw new Error('Missing moderation response');
  return response.data;
}
