import type { ApiClient, components } from '@vavito/api-client';

import { createWebPublicApiClient } from '@web/lib/api/api-client';

import type { ArticlesData, ArticlesFilters } from '../types/posts.types';

const ARTICLES_PER_PAGE = 12;

type PaginatedPosts = components['schemas']['PaginatedPostSummaryDto'];

interface GetArticlesDataOptions {
  client?: ApiClient;
  filters: ArticlesFilters;
}

export async function getArticlesData({
  client = createWebPublicApiClient(),
  filters,
}: GetArticlesDataOptions): Promise<ArticlesData> {
  const normalizedTag = filters.tag?.trim().toLowerCase() || null;
  const normalizedPage = Number.isSafeInteger(filters.page) && filters.page > 0 ? filters.page : 1;

  const [postsResponse, tagsResponse] = await Promise.all([
    client.GET('/api/v1/posts', {
      params: {
        query: {
          limit: ARTICLES_PER_PAGE,
          page: normalizedPage,
          sort: 'recent',
          ...(normalizedTag ? { tag: normalizedTag } : {}),
        },
      },
    }),
    client.GET('/api/v1/tags'),
  ]);

  const posts = postsResponse.data as PaginatedPosts | undefined;

  if (!posts) {
    throw new Error('A API não retornou a listagem de artigos esperada.');
  }

  if (!tagsResponse.data) {
    throw new Error('A API não retornou as tags esperadas para a listagem de artigos.');
  }

  return {
    filters: {
      page: normalizedPage,
      tag: normalizedTag,
    },
    pagination: posts.meta,
    posts: posts.items,
    tags: tagsResponse.data,
  };
}
