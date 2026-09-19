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

export async function getHomeRecentPosts({
  client = createWebPublicApiClient(),
  selectedTag = null,
}: Pick<GetHomeDataOptions, 'client' | 'selectedTag'> = {}): Promise<PaginatedPosts> {
  const normalizedTag = selectedTag?.trim().toLowerCase() || undefined;

  return listPosts(client, {
    limit: HOME_RECENT_POSTS_LIMIT,
    sort: 'recent',
    ...(normalizedTag ? { tag: normalizedTag } : {}),
  });
}

export async function getHomePopularPosts({
  client = createWebPublicApiClient(),
  selectedTag = null,
}: Pick<GetHomeDataOptions, 'client' | 'selectedTag'> = {}): Promise<PaginatedPosts> {
  const normalizedTag = selectedTag?.trim().toLowerCase() || undefined;

  return listPosts(client, {
    limit: HOME_POPULAR_POSTS_LIMIT,
    sort: 'popular',
    ...(normalizedTag ? { tag: normalizedTag } : {}),
  });
}

export async function getHomeTags(client = createWebPublicApiClient()) {
  const { data } = await client.GET('/api/v1/tags');

  if (!data) {
    throw new Error('Não foi possível carregar os tópicos da página inicial.');
  }

  return data;
}

export async function getHomePublishedPostsCount(client = createWebPublicApiClient()) {
  const posts = await listPosts(client, { limit: 1, sort: 'recent' });

  return posts.meta.total;
}

export async function getHomeData({
  client = createWebPublicApiClient(),
  selectedTag = null,
}: GetHomeDataOptions = {}): Promise<HomeData> {
  const normalizedTag = selectedTag?.trim().toLowerCase() || null;
  const recentPostsPromise = getHomeRecentPosts({ client, selectedTag: normalizedTag });
  const totalPostsPromise = normalizedTag
    ? listPosts(client, { limit: 1, sort: 'recent' })
    : recentPostsPromise;

  const [recentPosts, popularPosts, totalPosts, tagsResponse] = await Promise.all([
    recentPostsPromise,
    getHomePopularPosts({ client, selectedTag: normalizedTag }),
    totalPostsPromise,
    getHomeTags(client),
  ]);

  return {
    popularPosts: popularPosts.items,
    publishedPostsCount: totalPosts.meta.total,
    recentPosts: recentPosts.items,
    selectedTag: normalizedTag,
    tags: tagsResponse,
  };
}
