import type { ApiClient, components } from '@vavito/api-client';
import { describe, expect, it, vi } from 'vitest';

import {
  POST_SEARCH_MAX_RESULTS,
  searchPublishedPosts,
} from '@web/features/posts/services/search-published-posts';

const post: components['schemas']['PostSummaryDto'] = {
  coverAlt: null,
  coverUrl: null,
  excerpt: 'Uma visão prática da arquitetura.',
  id: '019c2d62-6e90-7000-8000-000000000010',
  publishedAt: '2026-08-20T12:00:00.000Z',
  readingTimeMinutes: 6,
  slug: 'arquitetura-nestjs',
  tags: [],
  title: 'Arquitetura NestJS',
  viewCount: 128,
};

describe('searchPublishedPosts', () => {
  it('normaliza o termo e limita a resposta a oito artigos', async () => {
    const posts = Array.from({ length: POST_SEARCH_MAX_RESULTS + 1 }, (_, index) => ({
      ...post,
      id: `${post.id}-${index}`,
      slug: `${post.slug}-${index}`,
    }));
    const get = vi.fn(() => Promise.resolve({ data: posts }));
    const client = { GET: get } as unknown as ApiClient;
    const signal = new AbortController().signal;

    const result = await searchPublishedPosts({
      client,
      query: '  NESTJS   E   AÇÃO  ',
      signal,
    });

    expect(result).toHaveLength(POST_SEARCH_MAX_RESULTS);
    expect(get).toHaveBeenCalledWith('/api/v1/posts/search', {
      params: { query: { q: 'nestjs e ação' } },
      signal,
    });
  });

  it('não consulta o servidor quando o termo está vazio', async () => {
    const get = vi.fn();
    const client = { GET: get } as unknown as ApiClient;

    await expect(searchPublishedPosts({ client, query: '   ' })).resolves.toEqual([]);
    expect(get).not.toHaveBeenCalled();
  });

  it('interrompe a apresentação quando a busca não entrega dados', async () => {
    const client = {
      GET: vi.fn(() => Promise.resolve({ data: undefined })),
    } as unknown as ApiClient;

    await expect(searchPublishedPosts({ client, query: 'nestjs' })).rejects.toThrow(
      'Não foi possível buscar os artigos.',
    );
  });
});
