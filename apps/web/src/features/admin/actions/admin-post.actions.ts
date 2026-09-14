'use server';

import { ApiClientError } from '@vavito/api-client';
import { revalidatePath } from 'next/cache';

import { createWebAuthenticatedApiClient } from '@web/lib/api/api-client';

import {
  deleteAdminPost,
  discardAdminPostChanges,
  transitionAdminPost,
} from '../services/admin-post-transitions.service';
import { requireAdminSession } from '../services/admin-session.service';
import type {
  AdminPostDeleteResult,
  AdminPostTransition,
  AdminPostTransitionResult,
} from '../types/admin-post.types';

const transitions = new Set<AdminPostTransition>(['archive', 'publish', 'restore', 'unpublish']);
const successMessages: Readonly<Record<AdminPostTransition, string>> = {
  archive: 'Artigo arquivado.',
  publish: 'Artigo publicado.',
  restore: 'Artigo restaurado como rascunho.',
  unpublish: 'Artigo despublicado e devolvido aos rascunhos.',
};
const publicationFieldLabels: Readonly<Record<string, string>> = {
  content: 'conteúdo',
  excerpt: 'resumo',
  slug: 'endereço',
  title: 'título',
};

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(value);
}

function missingPublicationFields(details: unknown): string[] {
  if (!Array.isArray(details)) return [];

  return details.flatMap((detail) => {
    if (typeof detail !== 'object' || detail === null) return [];
    const field = (detail as Record<string, unknown>)['field'];
    return typeof field === 'string' && publicationFieldLabels[field]
      ? [publicationFieldLabels[field]]
      : [];
  });
}

function friendlyTransitionError(
  error: unknown,
): Extract<AdminPostTransitionResult, { ok: false }> {
  if (!(error instanceof ApiClientError)) {
    return {
      code: null,
      message: 'Não foi possível atualizar o artigo agora. Tente novamente.',
      ok: false,
    };
  }

  if (error.code === 'POST_NOT_READY_FOR_PUBLICATION') {
    const fields = missingPublicationFields(error.details);
    return {
      code: error.code,
      message:
        fields.length > 0
          ? `Complete ${new Intl.ListFormat('pt-BR').format(fields)} antes de publicar.`
          : 'Complete os dados obrigatórios antes de publicar.',
      ok: false,
    };
  }

  if (error.code === 'INVALID_POST_STATUS_TRANSITION') {
    return {
      code: error.code,
      message: 'O estado deste artigo mudou. A página foi atualizada para você tentar novamente.',
      ok: false,
    };
  }

  if (error.code === 'SLUG_ALREADY_EXISTS') {
    return {
      code: error.code,
      message: 'Este endereço já está sendo usado por outro artigo.',
      ok: false,
    };
  }

  return { code: error.code, message: error.message, ok: false };
}

function revalidatePostPaths(id: string, slug: string | null): void {
  revalidatePath('/');
  revalidatePath('/artigos');
  revalidatePath('/admin');
  revalidatePath('/admin/posts');
  revalidatePath(`/admin/posts/${id}/preview`);
  if (slug) revalidatePath(`/artigos/${slug}`);
}

export async function transitionAdminPostAction(
  id: string,
  transition: AdminPostTransition,
): Promise<AdminPostTransitionResult> {
  if (!isUuid(id) || !transitions.has(transition)) {
    return { code: 'INVALID_TRANSITION_REQUEST', message: 'Ação inválida.', ok: false };
  }

  const session = await requireAdminSession();

  try {
    const post = await transitionAdminPost(
      id,
      transition,
      createWebAuthenticatedApiClient(() => session.accessToken),
    );
    revalidatePostPaths(id, post.slug);
    return { data: post, message: successMessages[transition], ok: true };
  } catch (error) {
    revalidatePostPaths(id, null);
    return friendlyTransitionError(error);
  }
}

export async function discardAdminPostChangesAction(
  id: string,
): Promise<AdminPostTransitionResult> {
  if (!isUuid(id)) {
    return { code: 'INVALID_POST_REQUEST', message: 'Artigo inválido.', ok: false };
  }

  const session = await requireAdminSession();

  try {
    const post = await discardAdminPostChanges(
      id,
      createWebAuthenticatedApiClient(() => session.accessToken),
    );
    revalidatePostPaths(id, post.slug);
    return { data: post, message: 'Alterações descartadas.', ok: true };
  } catch (error) {
    revalidatePostPaths(id, null);
    return friendlyTransitionError(error);
  }
}

export async function deleteAdminPostAction(
  id: string,
  slug: string | null,
): Promise<AdminPostDeleteResult> {
  if (!isUuid(id)) {
    return { code: 'INVALID_POST_REQUEST', message: 'Artigo inválido.', ok: false };
  }

  const session = await requireAdminSession();

  try {
    await deleteAdminPost(
      id,
      createWebAuthenticatedApiClient(() => session.accessToken),
    );
    revalidatePostPaths(id, slug);
    return { message: 'Artigo excluído definitivamente.', ok: true };
  } catch (error) {
    revalidatePostPaths(id, slug);
    const failure = friendlyTransitionError(error);
    return { code: failure.code, message: failure.message, ok: false };
  }
}
