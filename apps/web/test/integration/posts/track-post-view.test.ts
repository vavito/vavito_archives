import type { ApiClient } from '@vavito/api-client';
import { describe, expect, it, vi } from 'vitest';

import { trackPostView } from '@web/features/posts/services/track-post-view';

describe('trackPostView', () => {
  it('registra a visualização pelo slug público', async () => {
    const post = vi.fn().mockResolvedValue({ data: undefined });
    const client = { POST: post } as unknown as ApiClient;

    await expect(trackPostView({ client, slug: 'arquitetura-nestjs' })).resolves.toBeUndefined();
    expect(post).toHaveBeenCalledWith('/api/v1/posts/{slug}/views', {
      params: { path: { slug: 'arquitetura-nestjs' } },
    });
  });
});
