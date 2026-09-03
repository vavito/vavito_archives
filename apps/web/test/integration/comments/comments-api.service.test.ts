import type { ApiClient, components } from '@vavito/api-client';
import { describe, expect, it, vi } from 'vitest';

import {
  createComment,
  deleteComment,
  getCommentsPage,
  updateComment,
} from '@web/features/comments/services/comments-api.service';

const apiComment: components['schemas']['CommentResponseDto'] = {
  author: {
    avatarUrl: 'https://cdn.example.com/avatar.webp',
    displayName: 'Maria',
    id: '019c2d62-6e90-7000-8000-000000000001',
  },
  content: 'Comentário público',
  createdAt: '2026-09-03T12:00:00.000Z',
  edited: false,
  editedAt: null,
  id: '019c2d62-6e90-7000-8000-000000000002',
  parentId: null,
  postId: '019c2d62-6e90-7000-8000-000000000003',
  replies: [],
  status: 'VISIBLE',
};

describe('contrato HTTP de comentários', () => {
  it('lista e normaliza uma página de threads públicas', async () => {
    const get = vi.fn().mockResolvedValue({
      data: { items: [apiComment], meta: { limit: 20, page: 1, total: 1, totalPages: 1 } },
    });
    const client = { GET: get } as unknown as ApiClient;

    await expect(getCommentsPage('artigo', 1, client)).resolves.toEqual({
      items: [apiComment],
      meta: { limit: 20, page: 1, total: 1, totalPages: 1 },
    });
    expect(get).toHaveBeenCalledWith('/api/v1/posts/{slug}/comments', {
      params: { path: { slug: 'artigo' }, query: { limit: 20, page: 1 } },
    });
  });

  it('publica comentário e resposta pelo mesmo endpoint autenticado', async () => {
    const post = vi.fn().mockResolvedValue({ data: apiComment });
    const client = { POST: post } as unknown as ApiClient;

    await createComment('artigo', 'Mensagem', null, client);
    await createComment('artigo', 'Resposta', apiComment.id, client);

    expect(post).toHaveBeenNthCalledWith(1, '/api/v1/posts/{slug}/comments', {
      body: { content: 'Mensagem' },
      params: { path: { slug: 'artigo' } },
    });
    expect(post).toHaveBeenNthCalledWith(2, '/api/v1/posts/{slug}/comments', {
      body: { content: 'Resposta', parentId: apiComment.id },
      params: { path: { slug: 'artigo' } },
    });
  });

  it('edita e exclui pelo identificador do comentário', async () => {
    const patch = vi.fn().mockResolvedValue({ data: { ...apiComment, edited: true } });
    const remove = vi.fn().mockResolvedValue({ data: undefined });
    const client = { DELETE: remove, PATCH: patch } as unknown as ApiClient;

    await updateComment(apiComment.id, 'Atualizado', client);
    await deleteComment(apiComment.id, client);

    expect(patch).toHaveBeenCalledWith('/api/v1/comments/{id}', {
      body: { content: 'Atualizado' },
      params: { path: { id: apiComment.id } },
    });
    expect(remove).toHaveBeenCalledWith('/api/v1/comments/{id}', {
      params: { path: { id: apiComment.id } },
    });
  });
});
