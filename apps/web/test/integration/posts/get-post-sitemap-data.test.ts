import type { ApiClient, components } from '@vavito/api-client';
import { describe, expect, it, vi } from 'vitest';

import { getPostSitemapData } from '@web/features/posts/services/get-post-sitemap-data';

const tag: components['schemas']['TagResponseDto'] = {
  id: '019c2d62-6e90-7000-8000-000000000011',
  name: 'Arquitetura',
  publishedPostCount: 2,
  slug: 'arquitetura',
};

function post(
  id: string,
  slug: string,
  publishedAt: string,
): components['schemas']['PostSummaryDto'] {
  return {
    coverAlt: null,
    coverUrl: null,
    excerpt: `Resumo de ${slug}`,
    id,
    publishedAt,
    readingTimeMinutes: 5,
    slug,
    tags: [tag],
    title: slug,
    viewCount: 10,
  };
}

describe('getPostSitemapData', () => {
  it('percorre todas as páginas públicas com o maior limite permitido', async () => {
    const firstPost = post(
      '019c2d62-6e90-7000-8000-000000000021',
      'arquitetura-limpa',
      '2026-08-20T12:00:00.000Z',
    );
    const secondPost = post(
      '019c2d62-6e90-7000-8000-000000000022',
      'design-de-apis',
      '2026-08-21T12:00:00.000Z',
    );
    const get = vi
      .fn()
      .mockResolvedValueOnce({
        data: {
          items: [firstPost],
          meta: { limit: 100, page: 1, total: 2, totalPages: 2 },
        },
      })
      .mockResolvedValueOnce({
        data: {
          items: [secondPost],
          meta: { limit: 100, page: 2, total: 2, totalPages: 2 },
        },
      });
    const client = { GET: get } as unknown as ApiClient;

    await expect(getPostSitemapData({ client })).resolves.toEqual([
      { publishedAt: firstPost.publishedAt, slug: firstPost.slug },
      { publishedAt: secondPost.publishedAt, slug: secondPost.slug },
    ]);
    expect(get).toHaveBeenNthCalledWith(1, '/api/v1/posts', {
      params: { query: { limit: 100, page: 1, sort: 'recent' } },
    });
    expect(get).toHaveBeenNthCalledWith(2, '/api/v1/posts', {
      params: { query: { limit: 100, page: 2, sort: 'recent' } },
    });
  });

  it('interrompe a geração quando a API não retorna a página solicitada', async () => {
    const client = {
      GET: vi.fn().mockResolvedValue({ data: undefined }),
    } as unknown as ApiClient;

    await expect(getPostSitemapData({ client })).rejects.toThrow(
      'Não foi possível carregar os artigos para o sitemap.',
    );
  });
});
