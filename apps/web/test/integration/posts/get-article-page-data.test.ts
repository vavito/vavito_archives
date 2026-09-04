import { ApiClientError, type ApiClient, type components } from '@vavito/api-client';
import { describe, expect, it, vi } from 'vitest';

import { getArticlePageData } from '@web/features/posts/services/get-article-page-data';

const tag: components['schemas']['TagResponseDto'] = {
  id: '019c2d62-6e90-7000-8000-000000000011',
  name: 'TypeScript',
  publishedPostCount: 3,
  slug: 'typescript',
};

const post: components['schemas']['PostDetailResponseDto'] = {
  author: { avatarUrl: null, displayName: 'João Victor' },
  content: {
    content: [{ content: [{ text: 'Conteúdo do artigo', type: 'text' }], type: 'paragraph' }],
    type: 'doc',
  },
  contentSchemaVersion: 1,
  coverAlt: 'Diagrama de arquitetura',
  coverUrl: 'https://storage.test/media/capa.webp',
  excerpt: 'Uma visão prática da arquitetura.',
  id: '019c2d62-6e90-7000-8000-000000000010',
  publishedAt: '2026-08-20T12:00:00.000Z',
  reactionCounts: { dislike: 0, like: 4 },
  readingTimeMinutes: 6,
  seoDescription: null,
  seoTitle: null,
  slug: 'arquitetura-nestjs',
  tags: [tag],
  title: 'Arquitetura NestJS',
  viewCount: 128,
  viewer: null,
};

const relatedPost: components['schemas']['PostSummaryDto'] = {
  coverAlt: null,
  coverUrl: null,
  excerpt: 'Outro conteúdo sobre TypeScript.',
  id: '019c2d62-6e90-7000-8000-000000000012',
  publishedAt: '2026-08-19T12:00:00.000Z',
  readingTimeMinutes: 4,
  slug: 'typescript-na-pratica',
  tags: [tag],
  title: 'TypeScript na prática',
  viewCount: 80,
};

describe('getArticlePageData', () => {
  it('carrega o detalhe e seleciona relacionados pela primeira tag sem repetir o artigo', async () => {
    const get = vi.fn((path: string) =>
      Promise.resolve({
        data:
          path === '/api/v1/posts/{slug}'
            ? post
            : { items: [post, relatedPost], meta: { limit: 4, page: 1, total: 2, totalPages: 1 } },
      }),
    );
    const client = { GET: get } as unknown as ApiClient;

    await expect(getArticlePageData({ client, slug: post.slug })).resolves.toEqual({
      post,
      relatedPosts: [relatedPost],
    });
    expect(get).toHaveBeenCalledWith('/api/v1/posts/{slug}', {
      params: { path: { slug: post.slug } },
    });
    expect(get).toHaveBeenCalledWith('/api/v1/posts', {
      params: { query: { limit: 4, page: 1, sort: 'recent', tag: 'typescript' } },
    });
  });

  it('retorna null quando o artigo não existe', async () => {
    const get = vi.fn().mockRejectedValue(
      new ApiClientError({
        code: 'POST_NOT_FOUND',
        details: null,
        message: 'Post não encontrado.',
        path: `/api/v1/posts/${post.slug}`,
        requestId: null,
        statusCode: 404,
        timestamp: null,
      }),
    );
    const client = { GET: get } as unknown as ApiClient;

    await expect(getArticlePageData({ client, slug: post.slug })).resolves.toBeNull();
    expect(get).toHaveBeenCalledTimes(1);
  });

  it('interrompe a renderização quando os relacionados não são retornados', async () => {
    const get = vi
      .fn()
      .mockResolvedValueOnce({ data: post })
      .mockResolvedValueOnce({ data: undefined });
    const client = { GET: get } as unknown as ApiClient;

    await expect(getArticlePageData({ client, slug: post.slug })).rejects.toThrow(
      'Não foi possível carregar os artigos relacionados.',
    );
  });
});
