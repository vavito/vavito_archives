import { beforeEach, describe, expect, it, vi } from 'vitest';

import { updateBookmarkAction } from '@web/features/engagement/actions/bookmark.actions';

const mocks = vi.hoisted(() => ({
  session: vi.fn(),
  client: vi.fn<(getAccessToken: () => string) => object>(),
  save: vi.fn(),
  remove: vi.fn(),
  revalidate: vi.fn(),
}));
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidate }));
vi.mock('@web/lib/auth/authenticated-session', () => ({ getAuthenticatedSession: mocks.session }));
vi.mock('@web/lib/api/api-client', () => ({ createWebAuthenticatedApiClient: mocks.client }));
vi.mock('@web/features/engagement/services/bookmarks-api.service', () => ({
  setBookmark: mocks.save,
  removeBookmark: mocks.remove,
}));

describe('ações de artigos salvos', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.session.mockResolvedValue({ accessToken: 'reader-token' });
    mocks.client.mockReturnValue({});
    mocks.save.mockResolvedValue({});
    mocks.remove.mockResolvedValue(undefined);
  });

  it.each([true, false])(
    'persiste bookmarked=%s com a sessão atual e revalida artigo e biblioteca',
    async (saved) => {
      await expect(updateBookmarkAction('meu-artigo', 'post-id', saved)).resolves.toEqual({
        ok: true,
        bookmarked: saved,
      });
      expect(saved ? mocks.save : mocks.remove).toHaveBeenCalledWith('post-id', {});
      expect(mocks.client.mock.calls[0]?.[0]()).toBe('reader-token');
      expect(mocks.revalidate).toHaveBeenCalledWith('/artigos/meu-artigo');
      expect(mocks.revalidate).toHaveBeenCalledWith('/salvos');
    },
  );

  it('bloqueia chamadas sem autenticação', async () => {
    mocks.session.mockResolvedValue(null);
    await expect(updateBookmarkAction('artigo', 'post-id', true)).resolves.toEqual({
      ok: false,
      message: 'Sua sessão expirou. Entre novamente para continuar.',
    });
    expect(mocks.save).not.toHaveBeenCalled();
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });

  it('rejeita parâmetros inválidos antes de persistir ou invalidar caminhos', async () => {
    await expect(updateBookmarkAction('../perfil', 'post-id', true)).resolves.toMatchObject({
      ok: false,
    });
    await expect(updateBookmarkAction('artigo', '', true)).resolves.toMatchObject({ ok: false });
    expect(mocks.session).not.toHaveBeenCalled();
  });

  it.each([true, false])('oculta detalhes internos em falha de bookmarked=%s', async (saved) => {
    (saved ? mocks.save : mocks.remove).mockRejectedValue(new Error('internal database secret'));
    const result = await updateBookmarkAction('artigo', 'post-id', saved);
    expect(result).toMatchObject({ ok: false });
    expect(JSON.stringify(result)).not.toContain('secret');
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });
});
