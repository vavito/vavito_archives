import 'client-only';

import { createBrowserClient } from '@supabase/ssr';

import { getSupabasePublicEnvironment } from '../../env/public-env';

export function createBrowserSupabaseClient() {
  const { publishableKey, url } = getSupabasePublicEnvironment();

  return createBrowserClient(url, publishableKey);
}
