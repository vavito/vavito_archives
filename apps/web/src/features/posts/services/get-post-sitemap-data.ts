import type { ApiClient } from '@vavito/api-client';

import { createWebPublicApiClient } from '@web/lib/api/api-client';

const SITEMAP_PAGE_SIZE = 100;

export interface PostSitemapEntry {
  publishedAt: string;
  slug: string;
}

interface GetPostSitemapDataOptions {
  client?: ApiClient;
}

export async function getPostSitemapData({
  client = createWebPublicApiClient(),
}: GetPostSitemapDataOptions = {}): Promise<PostSitemapEntry[]> {
  const entries: PostSitemapEntry[] = [];
  let currentPage = 1;
  let totalPages = 1;

  do {
    const response = await client.GET('/api/v1/posts', {
      params: {
        query: {
          limit: SITEMAP_PAGE_SIZE,
          page: currentPage,
          sort: 'recent',
        },
      },
    });

    if (!response.data) {
      throw new Error('Não foi possível carregar os artigos para o sitemap.');
    }

    entries.push(
      ...response.data.items.map((post) => ({
        publishedAt: post.publishedAt,
        slug: post.slug,
      })),
    );
    totalPages = response.data.meta.totalPages;
    currentPage += 1;
  } while (currentPage <= totalPages);

  return entries;
}
