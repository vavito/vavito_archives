'use server';

import { ApiClientError } from '@vavito/api-client';
import { revalidatePath } from 'next/cache';

import { createWebAuthenticatedApiClient } from '@web/lib/api/api-client';
import { WEB_API_UPLOAD_REQUEST_TIMEOUT_MS } from '@web/lib/api/page-data-timeout';
import { getAuthenticatedSession } from '@web/lib/auth/authenticated-session';

import {
  normalizeDisplayName,
  validateAvatar,
  validateDisplayName,
} from '../schemas/profile.schema';
import {
  DELETE_ACCOUNT_CONFIRMATION,
  deleteProfileAccount,
  removeProfileAvatar,
  updateProfileName,
  uploadProfileAvatar,
} from '../services/profile-api.service';
import type { Profile } from '../types/profile.types';

export type ProfileActionResult<T = undefined> =
  { data: T; ok: true } | { message: string; ok: false };

const SESSION_EXPIRED_MESSAGE = 'Sua sessão expirou. Entre novamente para continuar.';

async function getAuthenticatedProfileClient(requestTimeoutMs?: number) {
  const session = await getAuthenticatedSession();

  if (!session) {
    return null;
  }

  return createWebAuthenticatedApiClient(() => session.accessToken, requestTimeoutMs);
}

function safeFailure(error: unknown, fallback: string): ProfileActionResult<never> {
  return {
    message: error instanceof ApiClientError ? error.message : fallback,
    ok: false,
  };
}

export async function updateProfileNameAction(
  displayName: string,
): Promise<ProfileActionResult<Profile>> {
  const validationError = validateDisplayName(displayName);

  if (validationError) {
    return { message: validationError, ok: false };
  }

  const client = await getAuthenticatedProfileClient();
  if (!client) {
    return { message: SESSION_EXPIRED_MESSAGE, ok: false };
  }

  try {
    const profile = await updateProfileName(normalizeDisplayName(displayName), client);
    revalidatePath('/perfil');
    return { data: profile, ok: true };
  } catch (error) {
    return safeFailure(error, 'Não foi possível atualizar seu nome agora.');
  }
}

export async function uploadProfileAvatarAction(file: File): Promise<ProfileActionResult<Profile>> {
  const validationError = validateAvatar(file);

  if (validationError) {
    return { message: validationError, ok: false };
  }

  const client = await getAuthenticatedProfileClient(WEB_API_UPLOAD_REQUEST_TIMEOUT_MS);
  if (!client) {
    return { message: SESSION_EXPIRED_MESSAGE, ok: false };
  }

  try {
    const profile = await uploadProfileAvatar(file, client);
    revalidatePath('/perfil');
    return { data: profile, ok: true };
  } catch (error) {
    return safeFailure(error, 'Não foi possível atualizar sua foto agora.');
  }
}

export async function removeProfileAvatarAction(): Promise<ProfileActionResult> {
  const client = await getAuthenticatedProfileClient();
  if (!client) {
    return { message: SESSION_EXPIRED_MESSAGE, ok: false };
  }

  try {
    await removeProfileAvatar(client);
    revalidatePath('/perfil');
    return { data: undefined, ok: true };
  } catch (error) {
    return safeFailure(error, 'Não foi possível remover sua foto agora.');
  }
}

export async function deleteProfileAccountAction(
  confirmation: string,
): Promise<ProfileActionResult> {
  if (confirmation !== DELETE_ACCOUNT_CONFIRMATION) {
    return { message: 'Digite a confirmação exatamente como exibida.', ok: false };
  }

  const client = await getAuthenticatedProfileClient();
  if (!client) {
    return { message: SESSION_EXPIRED_MESSAGE, ok: false };
  }

  try {
    await deleteProfileAccount(client);
    return { data: undefined, ok: true };
  } catch (error) {
    return safeFailure(error, 'Não foi possível excluir sua conta agora.');
  }
}
