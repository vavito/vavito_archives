import type { ApiClient, components } from '@vavito/api-client';

import { createWebPublicApiClient } from '@web/lib/api/api-client';

import type { CommentItem, CommentsPageData } from '../types/comments.types';

export const COMMENTS_PAGE_LIMIT = 20;

type ApiComment = components['schemas']['CommentResponseDto'];

function normalizeComment(comment: ApiComment): CommentItem {
  return {
    ...comment,
    author: comment.author
      ? {
          avatarUrl: typeof comment.author.avatarUrl === 'string' ? comment.author.avatarUrl : null,
          displayName: comment.author.displayName,
          id: comment.author.id,
        }
      : null,
    content: typeof comment.content === 'string' ? comment.content : null,
    editedAt: typeof comment.editedAt === 'string' ? comment.editedAt : null,
    parentId: typeof comment.parentId === 'string' ? comment.parentId : null,
    replies: comment.replies.map(normalizeComment),
  };
}

function requireComment(comment: ApiComment | undefined): CommentItem {
  if (!comment) {
    throw new Error('Não foi possível confirmar o comentário.');
  }

  return normalizeComment(comment);
}

export async function getCommentsPage(
  slug: string,
  page = 1,
  client: ApiClient = createWebPublicApiClient(),
): Promise<CommentsPageData> {
  const response = await client.GET('/api/v1/posts/{slug}/comments', {
    params: {
      path: { slug },
      query: { limit: COMMENTS_PAGE_LIMIT, page },
    },
  });

  if (!response.data) {
    throw new Error('Não foi possível carregar os comentários.');
  }

  return {
    items: response.data.items.map(normalizeComment),
    meta: response.data.meta,
  };
}

export async function createComment(
  slug: string,
  content: string,
  parentId: string | null,
  client: ApiClient,
): Promise<CommentItem> {
  const response = await client.POST('/api/v1/posts/{slug}/comments', {
    body: { content, ...(parentId ? { parentId } : {}) },
    params: { path: { slug } },
  });

  return requireComment(response.data);
}

export async function updateComment(
  id: string,
  content: string,
  client: ApiClient,
): Promise<CommentItem> {
  const response = await client.PATCH('/api/v1/comments/{id}', {
    body: { content },
    params: { path: { id } },
  });

  return requireComment(response.data);
}

export async function deleteComment(id: string, client: ApiClient): Promise<void> {
  await client.DELETE('/api/v1/comments/{id}', {
    params: { path: { id } },
  });
}
