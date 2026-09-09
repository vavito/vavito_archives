import type { ApiClient } from '@vavito/api-client';
import { describe, expect, it, vi } from 'vitest';

import {
  discardAdminPostChanges,
  transitionAdminPost,
} from '@web/features/admin/services/admin-post-transitions.service';
import type { AdminPostTransition } from '@web/features/admin/types/admin-post.types';

const post = {
  archivedAt: null,
  author: { displayName: 'João Victor', id: '019c2d62-6e90-7000-8000-000000000002' },
  content: { content: [{ type: 'paragraph' }], type: 'doc' },
  contentSchemaVersion: 1,
  coverAlt: null,
  coverMediaId: null,
  coverUrl: null,
  createdAt: '2026-09-05T12:00:00.000Z',
  editedAt: null,
  excerpt: 'Resumo do artigo.',
  id: '019c2d62-6e90-7000-8000-000000000010',
  publishedAt: null,
  readingTimeMinutes: 1,
  seoDescription: null,
  seoTitle: null,
  slug: 'meu-artigo',
  status: 'DRAFT',
  tagNames: [],
  tags: [],
  title: 'Meu artigo',
  updatedAt: '2026-09-05T13:00:00.000Z',
  viewCount: 0,
};

describe('transições administrativas de artigos', () => {
  it.each<readonly [AdminPostTransition, string]>([
    ['publish', '/api/v1/admin/posts/{id}/publish'],
    ['unpublish', '/api/v1/admin/posts/{id}/unpublish'],
    ['archive', '/api/v1/admin/posts/{id}/archive'],
    ['restore', '/api/v1/admin/posts/{id}/restore'],
  ])('executa %s no endpoint correspondente', async (transition, path) => {
    const client = {
      POST: vi.fn().mockResolvedValue({ data: post }),
    } as unknown as ApiClient;

    await expect(transitionAdminPost(post.id, transition, client)).resolves.toMatchObject(post);
    expect(client.POST).toHaveBeenCalledWith(path, {
      params: { path: { id: post.id } },
    });
  });

  it('descarta as alterações pendentes no endpoint dedicado', async () => {
    const client = {
      POST: vi.fn().mockResolvedValue({ data: post }),
    } as unknown as ApiClient;

    await expect(discardAdminPostChanges(post.id, client)).resolves.toMatchObject(post);
    expect(client.POST).toHaveBeenCalledWith('/api/v1/admin/posts/{id}/discard-changes', {
      params: { path: { id: post.id } },
    });
  });
});
