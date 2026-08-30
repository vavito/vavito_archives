import type { ApiClient, components } from '@vavito/api-client';
import { describe, expect, it, vi } from 'vitest';

import { getArticlesData } from '@web/features/posts/services/get-articles-data';

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

describe('getArticlesData', () => {
  it('consulta posts e tags preservando paginação e tag normalizada', async () => {
    const posts = {
      items: [post],
      meta: { limit: 12, page: 2, total: 13, totalPages: 2 },
    };
    const get = vi.fn((path: string) =>
      Promise.resolve({ data: path === '/api/v1/tags' ? post.tags : posts }),
    );
    const client = { GET: get } as unknown as ApiClient;

    const result = await getArticlesData({
      client,
      filters: { page: 2, tag: ' TypeScript ' },
    });

    expect(result).toEqual({
      filters: { page: 2, tag: 'typescript' },
      pagination: posts.meta,
      posts: [post],
      tags: post.tags,
    });
    expect(get).toHaveBeenCalledWith('/api/v1/posts', {
      params: {
        query: { limit: 12, page: 2, sort: 'recent', tag: 'typescript' },
      },
    });
    expect(get).toHaveBeenCalledWith('/api/v1/tags');
  });

  it('normaliza páginas inválidas antes de consultar a API', async () => {
    const posts = {
      items: [],
      meta: { limit: 12, page: 1, total: 0, totalPages: 0 },
    };
    const get = vi.fn((path: string) =>
      Promise.resolve({ data: path === '/api/v1/tags' ? [] : posts }),
    );
    const client = { GET: get } as unknown as ApiClient;

    const result = await getArticlesData({ client, filters: { page: 0, tag: '  ' } });

    expect(result.filters).toEqual({ page: 1, tag: null });
    expect(get).toHaveBeenCalledWith('/api/v1/posts', {
      params: { query: { limit: 12, page: 1, sort: 'recent' } },
    });
  });

  it('interrompe a renderização quando a API não entrega a listagem', async () => {
    const get = vi.fn((path: string) =>
      Promise.resolve({ data: path === '/api/v1/tags' ? [] : undefined }),
    );
    const client = { GET: get } as unknown as ApiClient;

    await expect(getArticlesData({ client, filters: { page: 1, tag: null } })).rejects.toThrow(
      'A API não retornou a listagem de artigos esperada.',
    );
  });
});
