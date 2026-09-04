import type { ApiClient } from '@vavito/api-client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createCommentAction,
  deleteCommentAction,
  listCommentsAction,
  updateCommentAction,
} from '@web/features/comments/actions/comment.actions';

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  createComment: vi.fn(),
  deleteComment: vi.fn(),
  getCommentsPage: vi.fn(),
  getSession: vi.fn(),
  revalidatePath: vi.fn(),
  updateComment: vi.fn(),
}));

vi.mock('server-only', () => ({}));
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock('@web/lib/auth/authenticated-session', () => ({
  getAuthenticatedSession: mocks.getSession,
}));
vi.mock('@web/lib/api/api-client', () => ({
  createWebAuthenticatedApiClient: mocks.createClient,
}));
vi.mock('@web/features/comments/services/comments-api.service', () => ({
  createComment: mocks.createComment,
  deleteComment: mocks.deleteComment,
  getCommentsPage: mocks.getCommentsPage,
  updateComment: mocks.updateComment,
}));

const client = {} as ApiClient;
const comment = {
  author: { avatarUrl: null, displayName: 'Maria', id: 'user-id' },
  content: 'Mensagem',
  createdAt: '2026-09-03T12:00:00.000Z',
  edited: false,
  editedAt: null,
  id: 'comment-id',
  parentId: null,
  postId: 'post-id',
  replies: [],
  status: 'VISIBLE' as const,
};

describe('ações de comentários', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createClient.mockReturnValue(client);
    mocks.getSession.mockResolvedValue({ accessToken: 'token', email: 'maria@example.com' });
    mocks.createComment.mockResolvedValue(comment);
    mocks.updateComment.mockResolvedValue({ ...comment, edited: true });
    mocks.deleteComment.mockResolvedValue(undefined);
    mocks.getCommentsPage.mockResolvedValue({
      items: [comment],
      meta: { limit: 20, page: 1, total: 1, totalPages: 1 },
    });
  });

  it('lista comentários públicos sem exigir sessão', async () => {
    await expect(listCommentsAction('artigo', 1)).resolves.toEqual({
      data: {
        items: [comment],
        meta: { limit: 20, page: 1, total: 1, totalPages: 1 },
      },
      ok: true,
    });
    expect(mocks.getSession).not.toHaveBeenCalled();
  });

  it('valida e publica conteúdo normalizado com a sessão atual', async () => {
    await expect(createCommentAction('artigo', '  Mensagem  ', null)).resolves.toEqual({
      data: comment,
      ok: true,
    });
    expect(mocks.createComment).toHaveBeenCalledWith('artigo', 'Mensagem', null, client);
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/artigos/artigo');
  });

  it('rejeita conteúdo vazio e sessão ausente', async () => {
    await expect(createCommentAction('artigo', '  ', null)).resolves.toEqual({
      message: 'Escreva uma mensagem antes de publicar.',
      ok: false,
    });

    mocks.getSession.mockResolvedValueOnce(null);
    await expect(updateCommentAction('artigo', comment.id, 'Atualização')).resolves.toEqual({
      message: 'Sua sessão expirou. Entre novamente para continuar.',
      ok: false,
    });
    expect(mocks.updateComment).not.toHaveBeenCalled();
  });

  it('edita e exclui revalidando o artigo', async () => {
    await expect(updateCommentAction('artigo', comment.id, 'Atualizado')).resolves.toMatchObject({
      ok: true,
    });
    await expect(deleteCommentAction('artigo', comment.id)).resolves.toEqual({
      data: undefined,
      ok: true,
    });
    expect(mocks.revalidatePath).toHaveBeenCalledTimes(2);
  });
});
