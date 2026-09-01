import type { ApiClient, components } from '@vavito/api-client';

import { createWebPublicApiClient } from '@web/lib/api/api-client';

import type { HomeData } from '../types/home.types';

const HOME_RECENT_POSTS_LIMIT = 4;
const HOME_POPULAR_POSTS_LIMIT = 3;

type PaginatedPosts = components['schemas']['PaginatedPostSummaryDto'];

interface GetHomeDataOptions {
  client?: ApiClient;
  selectedTag?: string | null;
}

async function listPosts(
  client: ApiClient,
  options: { limit: number; sort: 'popular' | 'recent'; tag?: string },
): Promise<PaginatedPosts> {
  const { data } = await client.GET('/api/v1/posts', {
    params: {
      query: {
        limit: options.limit,
        page: 1,
        sort: options.sort,
        ...(options.tag ? { tag: options.tag } : {}),
      },
    },
  });

  if (!data) {
    throw new Error('Não foi possível carregar os artigos da página inicial.');
  }

  return data;
}

export async function getHomeData({
  client = createWebPublicApiClient(),
  selectedTag = null,
}: GetHomeDataOptions = {}): Promise<HomeData> {
  const normalizedTag = selectedTag?.trim().toLowerCase() || null;
  const tagFilter = normalizedTag ?? undefined;
  const recentPostsPromise = listPosts(client, {
    limit: HOME_RECENT_POSTS_LIMIT,
    sort: 'recent',
    ...(tagFilter ? { tag: tagFilter } : {}),
  });
  const totalPostsPromise = normalizedTag
    ? listPosts(client, { limit: 1, sort: 'recent' })
    : recentPostsPromise;

  const [recentPosts, popularPosts, totalPosts, tagsResponse] = await Promise.all([
    recentPostsPromise,
    listPosts(client, {
      limit: HOME_POPULAR_POSTS_LIMIT,
      sort: 'popular',
      ...(tagFilter ? { tag: tagFilter } : {}),
    }),
    totalPostsPromise,
    client.GET('/api/v1/tags'),
  ]);

  if (!tagsResponse.data) {
    throw new Error('Não foi possível carregar os tópicos da página inicial.');
  }

  return {
    popularPosts: popularPosts.items,
    publishedPostsCount: totalPosts.meta.total,
    recentPosts: recentPosts.items,
    selectedTag: normalizedTag,
    tags: tagsResponse.data,
  };
}
