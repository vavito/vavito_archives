import type { ApiClient, components } from '@vavito/api-client';

import { createWebPublicApiClient } from '@web/lib/api/api-client';

import type { ArticlesData, ArticlesFilters } from '../types/posts.types';
import { normalizeArticlesSort } from './articles-sort';

const ARTICLES_PER_PAGE = 12;

type PaginatedPosts = components['schemas']['PaginatedPostSummaryDto'];

interface GetArticlesDataOptions {
  client?: ApiClient;
  filters: ArticlesFilters;
}

export interface ArticlesListData {
  filters: ArticlesFilters;
  pagination: PaginatedPosts['meta'];
  posts: PaginatedPosts['items'];
}

function normalizeFilters(filters: ArticlesFilters) {
  const normalizedTag = filters.tag?.trim().toLowerCase() || null;
  const sort = normalizeArticlesSort(filters.sort);
  const normalizedPage = Number.isSafeInteger(filters.page) && filters.page > 0 ? filters.page : 1;

  return { page: normalizedPage, sort, tag: normalizedTag };
}

export async function getArticlesListData({
  client = createWebPublicApiClient(),
  filters,
}: GetArticlesDataOptions): Promise<ArticlesListData> {
  const normalizedFilters = normalizeFilters(filters);
  const { data } = await client.GET('/api/v1/posts', {
    params: {
      query: {
        limit: ARTICLES_PER_PAGE,
        page: normalizedFilters.page,
        sort: normalizedFilters.sort,
        ...(normalizedFilters.tag ? { tag: normalizedFilters.tag } : {}),
      },
    },
  });

  const posts = data as PaginatedPosts | undefined;

  if (!posts) {
    throw new Error('Não foi possível carregar a listagem de artigos.');
  }

  return {
    filters: normalizedFilters,
    pagination: posts.meta,
    posts: posts.items,
  };
}

export async function getArticlesTags(client = createWebPublicApiClient()) {
  const { data } = await client.GET('/api/v1/tags');

  if (!data) {
    throw new Error('Não foi possível carregar os tópicos da listagem de artigos.');
  }

  return data;
}

export async function getArticlesData({
  client = createWebPublicApiClient(),
  filters,
}: GetArticlesDataOptions): Promise<ArticlesData> {
  const [postsResponse, tagsResponse] = await Promise.all([
    getArticlesListData({ client, filters }),
    getArticlesTags(client),
  ]);

  return {
    ...postsResponse,
    tags: tagsResponse,
  };
}
