import 'server-only';

import { createServerSupabaseClient } from './supabase/server';

export interface AuthenticatedSession {
  accessToken: string;
  email: string;
}

export async function getAuthenticatedSession(): Promise<AuthenticatedSession | null> {
  const supabase = await createServerSupabaseClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();

  if (claimsError || !claimsData?.claims.sub) {
    return null;
  }

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  const session = sessionData.session;

  if (sessionError || !session?.access_token || !session.user.email) {
    return null;
  }

  return {
    accessToken: session.access_token,
    email: session.user.email,
  };
}
