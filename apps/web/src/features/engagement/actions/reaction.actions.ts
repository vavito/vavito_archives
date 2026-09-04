'use server';

import { revalidatePath } from 'next/cache';

import { createWebAuthenticatedApiClient } from '@web/lib/api/api-client';
import { getAuthenticatedSession } from '@web/lib/auth/authenticated-session';

import { removeReaction, setReaction } from '../services/reactions-api.service';
import type { ReactionActionResult, ReactionType } from '../types/reactions.types';

const SESSION_EXPIRED_MESSAGE = 'Sua sessão expirou. Entre novamente para continuar.';

async function authenticatedClient() {
  const session = await getAuthenticatedSession();
  return session ? createWebAuthenticatedApiClient(() => session.accessToken) : null;
}

function isReactionType(value: string): value is ReactionType {
  return value === 'LIKE' || value === 'DISLIKE';
}

export async function setReactionAction(
  slug: string,
  postId: string,
  type: string,
): Promise<ReactionActionResult> {
  if (!slug || !postId || !isReactionType(type)) {
    return { message: 'Não foi possível registrar sua reação.', ok: false };
  }

  const client = await authenticatedClient();
  if (!client) return { message: SESSION_EXPIRED_MESSAGE, ok: false };

  try {
    const state = await setReaction(postId, type, client);
    revalidatePath(`/artigos/${slug}`);
    return { data: state, ok: true };
  } catch {
    return { message: 'Não foi possível registrar sua reação agora.', ok: false };
  }
}

export async function removeReactionAction(
  slug: string,
  postId: string,
): Promise<ReactionActionResult> {
  if (!slug || !postId) {
    return { message: 'Não foi possível remover sua reação.', ok: false };
  }

  const client = await authenticatedClient();
  if (!client) return { message: SESSION_EXPIRED_MESSAGE, ok: false };

  try {
    await removeReaction(postId, client);
    revalidatePath(`/artigos/${slug}`);
    return { data: null, ok: true };
  } catch {
    return { message: 'Não foi possível remover sua reação agora.', ok: false };
  }
}
