import type { ApiClient } from '@vavito/api-client';

import type { BookmarksPage, BookmarkState } from '../types/bookmarks.types';

export async function getBookmarksPage(page: number, client: ApiClient): Promise<BookmarksPage> {
  const response = await client.GET('/api/v1/bookmarks', {
    cache: 'no-store',
    params: { query: { limit: 12, page } },
  });

  if (!response.data) throw new Error('Não foi possível carregar seus artigos salvos.');
  return response.data;
}

export async function setBookmark(postId: string, client: ApiClient): Promise<BookmarkState> {
  const response = await client.PUT('/api/v1/posts/{id}/bookmark', {
    params: { path: { id: postId } },
  });

  if (!response.data) throw new Error('Não foi possível confirmar o artigo salvo.');
  return response.data;
}

export async function removeBookmark(postId: string, client: ApiClient): Promise<void> {
  await client.DELETE('/api/v1/posts/{id}/bookmark', {
    params: { path: { id: postId } },
  });
}
