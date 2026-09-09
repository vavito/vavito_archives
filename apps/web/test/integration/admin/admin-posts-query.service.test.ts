import { describe, expect, it, vi } from 'vitest';

import type { ApiClient } from '@vavito/api-client';

import {
  getAdminPostDetail,
  listAdminPosts,
} from '@web/features/admin/services/admin-posts-query.service';

const summary = {
  author: { displayName: 'João Victor', id: '019c2d62-6e90-7000-8000-000000000002' },
  editedAt: null,
  id: '019c2d62-6e90-7000-8000-000000000010',
  publishedAt: null,
  slug: 'meu-rascunho',
  status: 'DRAFT',
  title: 'Meu rascunho',
  updatedAt: '2026-09-05T13:00:00.000Z',
};

const detail = {
  ...summary,
  archivedAt: null,
  content: { content: [{ type: 'paragraph' }], type: 'doc' },
  contentSchemaVersion: 1,
  coverAlt: null,
  coverMediaId: null,
  coverUrl: null,
  createdAt: '2026-09-05T12:00:00.000Z',
  excerpt: null,
  readingTimeMinutes: 0,
  seoDescription: null,
  seoTitle: null,
  tags: [],
  viewCount: 0,
};

function apiClient(method: 'GET', data: unknown): ApiClient {
  return { [method]: vi.fn().mockResolvedValue({ data }) } as unknown as ApiClient;
}

describe('consultas administrativas de posts', () => {
  it('normaliza filtros e lista artigos paginados por status', async () => {
    const client = apiClient('GET', {
      items: [summary],
      meta: { limit: 20, page: 2, total: 21, totalPages: 2 },
    });

    await expect(
      listAdminPosts({ page: 2, query: '  meu   rascunho ', status: 'DRAFT' }, client),
    ).resolves.toMatchObject({
      filters: { page: 2, query: 'meu rascunho', status: 'DRAFT' },
      items: [summary],
    });
    expect(client.GET).toHaveBeenCalledWith('/api/v1/admin/posts', {
      params: {
        query: { limit: 20, page: 2, q: 'meu rascunho', status: 'DRAFT' },
      },
    });
  });

  it('carrega o detalhe usado no preview protegido', async () => {
    const client = apiClient('GET', detail);

    await expect(getAdminPostDetail(summary.id, client)).resolves.toMatchObject(detail);
    expect(client.GET).toHaveBeenCalledWith('/api/v1/admin/posts/{id}', {
      params: { path: { id: summary.id } },
    });
  });

  it('rejeita respostas incompletas da listagem e do preview', async () => {
    await expect(
      listAdminPosts({ page: 1, query: '', status: null }, apiClient('GET', { items: [] })),
    ).rejects.toThrow('Não foi possível confirmar a listagem de artigos.');
    await expect(getAdminPostDetail(summary.id, apiClient('GET', summary))).rejects.toThrow(
      'Não foi possível confirmar os dados completos do artigo.',
    );
  });
});
