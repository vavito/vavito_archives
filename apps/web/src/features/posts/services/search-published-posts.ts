import type { ApiClient } from '@vavito/api-client';

import { createWebPublicApiClient } from '@web/lib/api/api-client';

import type { PostSummary } from '../types/posts.types';

export const POST_SEARCH_MAX_RESULTS = 8;
export const POST_SEARCH_QUERY_MAX_LENGTH = 200;

interface SearchPublishedPostsOptions {
  client?: ApiClient;
  query: string;
  signal?: AbortSignal;
}

export function normalizePostSearchQuery(query: string): string {
  return query.normalize('NFC').trim().replaceAll(/\s+/g, ' ').toLocaleLowerCase('pt-BR');
}

export async function searchPublishedPosts({
  client = createWebPublicApiClient(),
  query,
  signal,
}: SearchPublishedPostsOptions): Promise<PostSummary[]> {
  const normalizedQuery = normalizePostSearchQuery(query);

  if (!normalizedQuery) {
    return [];
  }

  const response = await client.GET('/api/v1/posts/search', {
    params: { query: { q: normalizedQuery } },
    ...(signal ? { signal } : {}),
  });

  if (!response.data) {
    throw new Error('Não foi possível buscar os artigos.');
  }

  return response.data.slice(0, POST_SEARCH_MAX_RESULTS);
}
