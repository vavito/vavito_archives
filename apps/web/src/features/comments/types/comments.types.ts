import type { components } from '@vavito/api-client';

type ApiComment = components['schemas']['CommentResponseDto'];

export interface CommentAuthor {
  avatarUrl: string | null;
  displayName: string;
  id: string;
}

export interface CommentItem extends Omit<
  ApiComment,
  'author' | 'content' | 'editedAt' | 'parentId' | 'replies'
> {
  author: CommentAuthor | null;
  content: string | null;
  editedAt: string | null;
  parentId: string | null;
  replies: CommentItem[];
}

export interface CommentsPageData {
  items: CommentItem[];
  meta: components['schemas']['PaginationMetaDto'];
}

export interface CommentViewer extends CommentAuthor {
  role: components['schemas']['UserRole'];
}

export type CommentActionResult<T = undefined> =
  { data: T; ok: true } | { message: string; ok: false };
