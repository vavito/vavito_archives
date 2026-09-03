import 'client-only';

import {
  createCommentAction,
  deleteCommentAction,
  listCommentsAction,
  updateCommentAction,
} from '../actions/comment.actions';
import type { CommentActionResult, CommentItem, CommentsPageData } from '../types/comments.types';

export class SafeCommentActionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SafeCommentActionError';
  }
}

function unwrap<T>(result: CommentActionResult<T>): T {
  if (!result.ok) throw new SafeCommentActionError(result.message);
  return result.data;
}

export async function loadComments(slug: string, page: number): Promise<CommentsPageData> {
  return unwrap(await listCommentsAction(slug, page));
}

export async function publishComment(
  slug: string,
  content: string,
  parentId: string | null,
): Promise<CommentItem> {
  return unwrap(await createCommentAction(slug, content, parentId));
}

export async function editComment(slug: string, id: string, content: string): Promise<CommentItem> {
  return unwrap(await updateCommentAction(slug, id, content));
}

export async function removeComment(slug: string, id: string): Promise<void> {
  unwrap(await deleteCommentAction(slug, id));
}
