'use server';

import { ApiClientError } from '@vavito/api-client';
import { revalidatePath } from 'next/cache';

import { createWebAuthenticatedApiClient } from '@web/lib/api/api-client';
import { getAuthenticatedSession } from '@web/lib/auth/authenticated-session';

import { normalizeCommentContent, validateCommentContent } from '../schemas/comment.schema';
import {
  createComment,
  deleteComment,
  getCommentsPage,
  updateComment,
} from '../services/comments-api.service';
import type { CommentActionResult, CommentItem, CommentsPageData } from '../types/comments.types';

const SESSION_EXPIRED_MESSAGE = 'Sua sessão expirou. Entre novamente para continuar.';

function safeFailure(error: unknown, fallback: string): CommentActionResult<never> {
  return {
    message: error instanceof ApiClientError ? error.message : fallback,
    ok: false,
  };
}

async function authenticatedClient() {
  const session = await getAuthenticatedSession();

  return session ? createWebAuthenticatedApiClient(() => session.accessToken) : null;
}

export async function listCommentsAction(
  slug: string,
  page: number,
): Promise<CommentActionResult<CommentsPageData>> {
  if (!slug || !Number.isInteger(page) || page < 1) {
    return { message: 'Não foi possível carregar os comentários.', ok: false };
  }

  try {
    return { data: await getCommentsPage(slug, page), ok: true };
  } catch (error) {
    return safeFailure(error, 'Não foi possível carregar os comentários agora.');
  }
}

export async function createCommentAction(
  slug: string,
  content: string,
  parentId: string | null,
): Promise<CommentActionResult<CommentItem>> {
  const validationError = validateCommentContent(content);
  if (validationError) return { message: validationError, ok: false };

  const client = await authenticatedClient();
  if (!client) return { message: SESSION_EXPIRED_MESSAGE, ok: false };

  try {
    const comment = await createComment(slug, normalizeCommentContent(content), parentId, client);
    revalidatePath(`/artigos/${slug}`);
    return { data: comment, ok: true };
  } catch (error) {
    return safeFailure(error, 'Não foi possível publicar seu comentário agora.');
  }
}

export async function updateCommentAction(
  slug: string,
  id: string,
  content: string,
): Promise<CommentActionResult<CommentItem>> {
  const validationError = validateCommentContent(content);
  if (validationError) return { message: validationError, ok: false };

  const client = await authenticatedClient();
  if (!client) return { message: SESSION_EXPIRED_MESSAGE, ok: false };

  try {
    const comment = await updateComment(id, normalizeCommentContent(content), client);
    revalidatePath(`/artigos/${slug}`);
    return { data: comment, ok: true };
  } catch (error) {
    return safeFailure(error, 'Não foi possível editar seu comentário agora.');
  }
}

export async function deleteCommentAction(slug: string, id: string): Promise<CommentActionResult> {
  const client = await authenticatedClient();
  if (!client) return { message: SESSION_EXPIRED_MESSAGE, ok: false };

  try {
    await deleteComment(id, client);
    revalidatePath(`/artigos/${slug}`);
    return { data: undefined, ok: true };
  } catch (error) {
    return safeFailure(error, 'Não foi possível excluir seu comentário agora.');
  }
}
