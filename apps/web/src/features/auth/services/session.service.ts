'use client';

import { createBrowserSupabaseClient } from '@web/lib/auth/supabase/client';

/** Ordinary logout is local; password changes explicitly request global revocation. */
export async function signOutSession(scope: 'local' | 'global' = 'local'): Promise<void> {
  const { error } = await createBrowserSupabaseClient().auth.signOut({ scope });
  if (error) throw error;
}
