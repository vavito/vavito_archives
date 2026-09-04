import type { ApiClient } from '@vavito/api-client';
import { describe, expect, it, vi } from 'vitest';

import {
  getBookmarksPage,
  removeBookmark,
  setBookmark,
} from '@web/features/engagement/services/bookmarks-api.service';

describe('API de artigos salvos', () => {
  it('consulta uma página privada de 12 artigos sem cache compartilhado', async () => {
    const data = { items: [], meta: { limit: 12, page: 2, total: 0, totalPages: 0 } };
    const get = vi.fn().mockResolvedValue({ data });
    await expect(getBookmarksPage(2, { GET: get } as unknown as ApiClient)).resolves.toEqual(data);
    expect(get).toHaveBeenCalledWith('/api/v1/bookmarks', {
      cache: 'no-store',
      params: { query: { limit: 12, page: 2 } },
    });
  });

  it('salva por PUT e remove por DELETE idempotentes', async () => {
    const put = vi.fn().mockResolvedValue({ data: { postId: 'post-id', bookmarked: true } });
    const remove = vi.fn().mockResolvedValue({});
    const client = { PUT: put, DELETE: remove } as unknown as ApiClient;
    await expect(setBookmark('post-id', client)).resolves.toBeDefined();
    await expect(removeBookmark('post-id', client)).resolves.toBeUndefined();
    expect(put).toHaveBeenCalledWith('/api/v1/posts/{id}/bookmark', {
      params: { path: { id: 'post-id' } },
    });
    expect(remove).toHaveBeenCalledWith('/api/v1/posts/{id}/bookmark', {
      params: { path: { id: 'post-id' } },
    });
  });

  it('não trata uma resposta ausente como biblioteca vazia ou gravação confirmada', async () => {
    const client = {
      GET: vi.fn().mockResolvedValue({}),
      PUT: vi.fn().mockResolvedValue({}),
    } as unknown as ApiClient;
    await expect(getBookmarksPage(1, client)).rejects.toThrow();
    await expect(setBookmark('post-id', client)).rejects.toThrow();
  });
});
