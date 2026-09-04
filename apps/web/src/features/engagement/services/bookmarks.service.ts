import 'client-only';

import { updateBookmarkAction } from '../actions/bookmark.actions';

export class SafeBookmarkActionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SafeBookmarkActionError';
  }
}

export async function saveBookmark(
  slug: string,
  postId: string,
  bookmarked: boolean,
): Promise<boolean> {
  const result = await updateBookmarkAction(slug, postId, bookmarked);
  if (!result.ok) throw new SafeBookmarkActionError(result.message);
  return result.bookmarked;
}
