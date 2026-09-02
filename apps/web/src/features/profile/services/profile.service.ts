import 'client-only';

import { createBrowserSupabaseClient } from '@web/lib/auth/supabase/client';

import {
  deleteProfileAccountAction,
  removeProfileAvatarAction,
  type ProfileActionResult,
  updateProfileNameAction,
  uploadProfileAvatarAction,
} from '../actions/profile.actions';
import { DELETE_ACCOUNT_CONFIRMATION } from './profile-api.service';
import type { Profile } from '../types/profile.types';

export class SafeProfileActionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SafeProfileActionError';
  }
}

function unwrapProfileResult(result: ProfileActionResult<Profile>): Profile {
  if (!result.ok) {
    throw new SafeProfileActionError(result.message);
  }

  return result.data;
}

function unwrapEmptyResult(result: ProfileActionResult): void {
  if (!result.ok) {
    throw new SafeProfileActionError(result.message);
  }
}

export async function updateProfileName(displayName: string): Promise<Profile> {
  return unwrapProfileResult(await updateProfileNameAction(displayName));
}

export async function uploadProfileAvatar(file: File): Promise<Profile> {
  return unwrapProfileResult(await uploadProfileAvatarAction(file));
}

export async function removeProfileAvatar(): Promise<void> {
  unwrapEmptyResult(await removeProfileAvatarAction());
}

export async function deleteProfileAccount(): Promise<void> {
  unwrapEmptyResult(await deleteProfileAccountAction(DELETE_ACCOUNT_CONFIRMATION));
}

export async function clearDeletedAccountSession(): Promise<void> {
  const supabase = createBrowserSupabaseClient();
  const { error } = await supabase.auth.signOut({ scope: 'local' });

  if (error) {
    // A identidade já pode ter sido removida; limpar o estado local continua sendo suficiente.
    return;
  }
}
