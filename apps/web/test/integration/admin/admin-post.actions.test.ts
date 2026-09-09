import { ApiClientError, type ApiClient } from '@vavito/api-client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  discardAdminPostChangesAction,
  transitionAdminPostAction,
} from '@web/features/admin/actions/admin-post.actions';

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  discard: vi.fn(),
  requireAdminSession: vi.fn(),
  revalidatePath: vi.fn(),
  transition: vi.fn(),
}));

vi.mock('server-only', () => ({}));
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock('@web/lib/api/api-client', () => ({
  createWebAuthenticatedApiClient: mocks.createClient,
}));
vi.mock('@web/features/admin/services/admin-session.service', () => ({
  requireAdminSession: mocks.requireAdminSession,
}));
vi.mock('@web/features/admin/services/admin-post-transitions.service', () => ({
  discardAdminPostChanges: mocks.discard,
  transitionAdminPost: mocks.transition,
}));

const client = {} as ApiClient;
const post = {
  id: '019c2d62-6e90-7000-8000-000000000010',
  slug: 'meu-artigo',
  status: 'PUBLISHED' as const,
};

describe('ações de transição de artigos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdminSession.mockResolvedValue({ accessToken: 'token' });
    mocks.createClient.mockReturnValue(client);
    mocks.transition.mockResolvedValue(post);
    mocks.discard.mockResolvedValue(post);
  });

  it('publica com a sessão administrativa e revalida as páginas afetadas', async () => {
    await expect(transitionAdminPostAction(post.id, 'publish')).resolves.toMatchObject({
      data: post,
      message: 'Artigo publicado.',
      ok: true,
    });
    expect(mocks.transition).toHaveBeenCalledWith(post.id, 'publish', client);
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/');
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/artigos');
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/admin/posts');
    expect(mocks.revalidatePath).toHaveBeenCalledWith(`/artigos/${post.slug}`);
  });

  it('traduz os campos ausentes retornados pelo conflito de publicação', async () => {
    mocks.transition.mockRejectedValueOnce(
      new ApiClientError({
        code: 'POST_NOT_READY_FOR_PUBLICATION',
        details: [
          { field: 'excerpt', reason: 'REQUIRED_FOR_PUBLICATION' },
          { field: 'content', reason: 'REQUIRED_FOR_PUBLICATION' },
        ],
        message: 'O post ainda não possui todos os campos necessários.',
        path: `/api/v1/admin/posts/${post.id}/publish`,
        requestId: null,
        statusCode: 409,
        timestamp: null,
      }),
    );

    await expect(transitionAdminPostAction(post.id, 'publish')).resolves.toEqual({
      code: 'POST_NOT_READY_FOR_PUBLICATION',
      message: 'Complete resumo e conteúdo antes de publicar.',
      ok: false,
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/admin/posts');
  });

  it('rejeita uma referência inválida antes de consultar a sessão', async () => {
    await expect(transitionAdminPostAction('invalido', 'archive')).resolves.toEqual({
      code: 'INVALID_TRANSITION_REQUEST',
      message: 'Ação inválida.',
      ok: false,
    });
    expect(mocks.requireAdminSession).not.toHaveBeenCalled();
  });

  it('descarta alterações pendentes e revalida o preview administrativo', async () => {
    await expect(discardAdminPostChangesAction(post.id)).resolves.toMatchObject({
      data: post,
      message: 'Alterações descartadas.',
      ok: true,
    });
    expect(mocks.discard).toHaveBeenCalledWith(post.id, client);
    expect(mocks.revalidatePath).toHaveBeenCalledWith(`/admin/posts/${post.id}/preview`);
  });
});
