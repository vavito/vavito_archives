'use client';

import 'client-only';

import { ApiClientError, type ApiClient, type components } from '@vavito/api-client';

import { createWebAuthenticatedApiClient } from '@web/lib/api/api-client';
import { createBrowserSupabaseClient } from '@web/lib/auth/supabase/client';

import type {
  AdminDraftDocument,
  AdminDraftGateway,
  AdminPostDraft,
} from '../types/admin-draft.types';

type ApiAdminPost = components['schemas']['PostAdminDetailDto'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function normalizeAdminPost(post: ApiAdminPost | undefined): AdminPostDraft {
  if (
    !post ||
    typeof post.id !== 'string' ||
    typeof post.title !== 'string' ||
    !isRecord(post.content) ||
    !Number.isInteger(post.contentSchemaVersion) ||
    !['ARCHIVED', 'DRAFT', 'PUBLISHED'].includes(post.status) ||
    typeof post.updatedAt !== 'string'
  ) {
    throw new Error('Não foi possível confirmar os dados do rascunho.');
  }

  return {
    content: post.content,
    contentSchemaVersion: post.contentSchemaVersion,
    coverAlt: typeof post.coverAlt === 'string' ? post.coverAlt : null,
    coverMediaId: typeof post.coverMediaId === 'string' ? post.coverMediaId : null,
    coverPositionX: typeof post.coverPositionX === 'number' ? post.coverPositionX : 50,
    coverPositionY: typeof post.coverPositionY === 'number' ? post.coverPositionY : 50,
    coverScale: typeof post.coverScale === 'number' ? post.coverScale : 100,
    coverUrl: typeof post.coverUrl === 'string' ? post.coverUrl : null,
    excerpt: typeof post.excerpt === 'string' ? post.excerpt : '',
    hasPendingChanges: post.hasPendingChanges === true,
    id: post.id,
    slug: typeof post.slug === 'string' ? post.slug : '',
    status: post.status,
    tagNames: Array.isArray(post.tagNames)
      ? post.tagNames.filter((name): name is string => typeof name === 'string')
      : post.tags.map(({ name }) => name),
    title: post.title,
    updatedAt: post.updatedAt,
  };
}

function createAdminPostsApiClient(): ApiClient {
  const supabase = createBrowserSupabaseClient();

  return createWebAuthenticatedApiClient(async () => {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      throw ApiClientError.missingAccessToken();
    }

    return data.session?.access_token;
  });
}

export async function createAdminDraft(
  title: string,
  client: ApiClient = createAdminPostsApiClient(),
): Promise<AdminPostDraft> {
  const normalizedTitle = title.trim();
  const response = await client.POST('/api/v1/admin/posts', {
    body: normalizedTitle ? { title: normalizedTitle } : {},
  });

  return normalizeAdminPost(response.data);
}

export async function getAdminDraft(
  id: string,
  client: ApiClient = createAdminPostsApiClient(),
): Promise<AdminPostDraft> {
  const response = await client.GET('/api/v1/admin/posts/{id}', {
    params: { path: { id } },
  });

  return normalizeAdminPost(response.data);
}

export async function updateAdminDraft(
  id: string,
  draft: AdminDraftDocument,
  client: ApiClient = createAdminPostsApiClient(),
): Promise<AdminPostDraft> {
  const response = await client.PATCH('/api/v1/admin/posts/{id}', {
    body: {
      content: draft.content,
      contentSchemaVersion: draft.contentSchemaVersion,
      coverMediaId: draft.coverMediaId,
      ...(draft.coverPositionX !== undefined ? { coverPositionX: draft.coverPositionX } : {}),
      ...(draft.coverPositionY !== undefined ? { coverPositionY: draft.coverPositionY } : {}),
      ...(draft.coverScale !== undefined ? { coverScale: draft.coverScale } : {}),
      coverAlt: draft.coverAlt,
      excerpt: draft.excerpt,
      ...(draft.slug.trim() ? { slug: draft.slug.trim() } : {}),
      tagNames: draft.tagNames,
      title: draft.title,
    },
    params: { path: { id } },
  });

  return normalizeAdminPost(response.data);
}

export const adminDraftGateway: AdminDraftGateway = {
  create: (title) => createAdminDraft(title),
  get: (id) => getAdminDraft(id),
  update: (id, draft) => updateAdminDraft(id, draft),
};
