import { describe, expect, it, vi } from 'vitest';

import type { ApiClient } from '@vavito/api-client';

import {
  createAdminDraft,
  getAdminDraft,
  updateAdminDraft,
} from '@web/features/admin/services/admin-posts.service';

const apiPost = {
  content: {
    content: [{ content: [{ text: 'Conteúdo salvo', type: 'text' }], type: 'paragraph' }],
    type: 'doc',
  },
  contentSchemaVersion: 1,
  excerpt: 'Resumo do rascunho',
  id: '019c2d62-6e90-7000-8000-000000000010',
  slug: 'meu-rascunho',
  status: 'DRAFT',
  title: 'Meu rascunho',
  updatedAt: '2026-09-05T13:00:00.000Z',
};

function apiClient(method: 'GET' | 'PATCH' | 'POST', data: unknown): ApiClient {
  return {
    [method]: vi.fn().mockResolvedValue({ data }),
  } as unknown as ApiClient;
}

describe('serviço de posts administrativos', () => {
  it('cria um rascunho com o título normalizado', async () => {
    const client = apiClient('POST', apiPost);

    await expect(createAdminDraft('  Meu rascunho  ', client)).resolves.toMatchObject(apiPost);
    expect(client.POST).toHaveBeenCalledWith('/api/v1/admin/posts', {
      body: { title: 'Meu rascunho' },
    });
  });

  it('recupera o conteúdo administrativo pelo identificador', async () => {
    const client = apiClient('GET', apiPost);

    await expect(getAdminDraft(apiPost.id, client)).resolves.toMatchObject(apiPost);
    expect(client.GET).toHaveBeenCalledWith('/api/v1/admin/posts/{id}', {
      params: { path: { id: apiPost.id } },
    });
  });

  it('atualiza título e documento versionado do rascunho', async () => {
    const client = apiClient('PATCH', apiPost);
    const draft = {
      content: apiPost.content,
      contentSchemaVersion: 1,
      excerpt: apiPost.excerpt,
      slug: 'meu-rascunho',
      title: 'Meu rascunho',
    };

    await expect(updateAdminDraft(apiPost.id, draft, client)).resolves.toMatchObject(apiPost);
    expect(client.PATCH).toHaveBeenCalledWith('/api/v1/admin/posts/{id}', {
      body: draft,
      params: { path: { id: apiPost.id } },
    });
  });

  it('rejeita uma resposta que não representa um rascunho', async () => {
    const client = apiClient('GET', { id: apiPost.id });

    await expect(getAdminDraft(apiPost.id, client)).rejects.toThrow(
      'Não foi possível confirmar os dados do rascunho.',
    );
  });
});
