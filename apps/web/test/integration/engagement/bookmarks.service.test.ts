import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  SafeBookmarkActionError,
  saveBookmark,
} from '@web/features/engagement/services/bookmarks.service';

const mocks = vi.hoisted(() => ({ update: vi.fn() }));
vi.mock('@web/features/engagement/actions/bookmark.actions', () => ({
  updateBookmarkAction: mocks.update,
}));

describe('serviço de interação com artigos salvos', () => {
  beforeEach(() => vi.resetAllMocks());

  it.each([true, false])('retorna o estado confirmado %s', async (bookmarked) => {
    mocks.update.mockResolvedValue({ ok: true, bookmarked });
    await expect(saveBookmark('artigo', 'post-id', bookmarked)).resolves.toBe(bookmarked);
    expect(mocks.update).toHaveBeenCalledWith('artigo', 'post-id', bookmarked);
  });

  it('preserva apenas a mensagem segura enviada pela ação', async () => {
    mocks.update.mockResolvedValue({ ok: false, message: 'Entre novamente.' });
    await expect(saveBookmark('artigo', 'post-id', true)).rejects.toBeInstanceOf(
      SafeBookmarkActionError,
    );
  });
});
