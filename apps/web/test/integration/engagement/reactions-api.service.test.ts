import type { ApiClient } from '@vavito/api-client';
import { describe, expect, it, vi } from 'vitest';

import {
  removeReaction,
  setReaction,
} from '@web/features/engagement/services/reactions-api.service';

describe('API de reações', () => {
  it('envia a reação e retorna os contadores confirmados', async () => {
    const put = vi.fn().mockResolvedValue({
      data: { counts: { dislike: 1, like: 5 }, reaction: 'LIKE' },
    });
    const client = { PUT: put } as unknown as ApiClient;

    await expect(setReaction('post-id', 'LIKE', client)).resolves.toEqual({
      counts: { dislike: 1, like: 5 },
      reaction: 'LIKE',
    });
    expect(put).toHaveBeenCalledWith('/api/v1/posts/{id}/reaction', {
      body: { type: 'LIKE' },
      params: { path: { id: 'post-id' } },
    });
  });

  it('remove a reação ativa pelo endpoint idempotente', async () => {
    const remove = vi.fn().mockResolvedValue({ data: undefined });
    const client = { DELETE: remove } as unknown as ApiClient;

    await expect(removeReaction('post-id', client)).resolves.toBeUndefined();
    expect(remove).toHaveBeenCalledWith('/api/v1/posts/{id}/reaction', {
      params: { path: { id: 'post-id' } },
    });
  });
});
