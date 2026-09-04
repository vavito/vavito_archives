'use server';

import { revalidatePath } from 'next/cache';

import { createWebAuthenticatedApiClient } from '@web/lib/api/api-client';
import { getAuthenticatedSession } from '@web/lib/auth/authenticated-session';

import { removeBookmark, setBookmark } from '../services/bookmarks-api.service';
import type { BookmarkActionResult } from '../types/bookmarks.types';

export async function updateBookmarkAction(
  slug: string,
  postId: string,
  bookmarked: boolean,
): Promise<BookmarkActionResult> {
  if (
    typeof slug !== 'string' ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) ||
    typeof postId !== 'string' ||
    !postId ||
    typeof bookmarked !== 'boolean'
  ) {
    return { message: 'Não foi possível atualizar este artigo salvo.', ok: false };
  }

  try {
    const session = await getAuthenticatedSession();
    if (!session) {
      return { message: 'Sua sessão expirou. Entre novamente para continuar.', ok: false };
    }

    const client = createWebAuthenticatedApiClient(() => session.accessToken);
    if (bookmarked) await setBookmark(postId, client);
    else await removeBookmark(postId, client);

    revalidatePath(`/artigos/${slug}`);
    revalidatePath('/salvos');
    return { bookmarked, ok: true };
  } catch {
    return {
      message: 'Não foi possível atualizar seus artigos salvos agora. Tente novamente.',
      ok: false,
    };
  }
}
