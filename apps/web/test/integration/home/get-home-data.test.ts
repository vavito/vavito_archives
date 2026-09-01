import type { ApiClient, components } from '@vavito/api-client';
import { describe, expect, it, vi } from 'vitest';

import { getHomeData } from '@web/features/home/services/get-home-data';

type PaginatedPosts = components['schemas']['PaginatedPostSummaryDto'];

const post: components['schemas']['PostSummaryDto'] = {
  coverAlt: null,
  coverUrl: null,
  excerpt: 'Uma visão prática da arquitetura.',
  id: '019c2d62-6e90-7000-8000-000000000010',
  publishedAt: '2026-08-20T12:00:00.000Z',
  readingTimeMinutes: 6,
  slug: 'arquitetura-nestjs',
  tags: [
    {
      id: '019c2d62-6e90-7000-8000-000000000011',
      name: 'TypeScript',
      publishedPostCount: 3,
      slug: 'typescript',
    },
  ],
  title: 'Arquitetura NestJS',
  viewCount: 128,
};

function paginated(total: number): PaginatedPosts {
  return {
    items: [post],
    meta: { limit: 4, page: 1, total, totalPages: 1 },
  };
}

describe('getHomeData', () => {
  it('busca listas em paralelo e preserva o total global ao filtrar por tag', async () => {
    const get = vi.fn((path: string, options?: unknown) => {
      if (path === '/api/v1/tags') {
        return Promise.resolve({ data: post.tags });
      }

      const query = (
        options as { params?: { query?: { sort?: string; tag?: string } } } | undefined
      )?.params?.query;

      if (query?.sort === 'popular') {
        return Promise.resolve({ data: paginated(1) });
      }

      return Promise.resolve({ data: paginated(query?.tag ? 1 : 12) });
    });
    const client = { GET: get } as unknown as ApiClient;

    const result = await getHomeData({ client, selectedTag: ' TypeScript ' });

    expect(result.selectedTag).toBe('typescript');
    expect(result.publishedPostsCount).toBe(12);
    expect(result.recentPosts).toEqual([post]);
    expect(result.popularPosts).toEqual([post]);
    expect(result.tags).toEqual(post.tags);
    expect(get).toHaveBeenCalledTimes(4);
  });

  it('interrompe a renderização quando a API não entrega as tags', async () => {
    const get = vi.fn((path: string) =>
      Promise.resolve(path === '/api/v1/tags' ? { data: undefined } : { data: paginated(1) }),
    );
    const client = { GET: get } as unknown as ApiClient;

    await expect(getHomeData({ client })).rejects.toThrow(
      'Não foi possível carregar os tópicos da página inicial.',
    );
  });
});
