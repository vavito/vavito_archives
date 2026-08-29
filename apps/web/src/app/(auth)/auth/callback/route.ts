import type { NextRequest } from 'next/server';

import { getSafeRedirectPath } from '@web/lib/auth/redirect-path';
import { createPrivateAuthRedirect } from '@web/lib/auth/redirect-response';
import { createServerSupabaseClient } from '@web/lib/auth/supabase/server';

const CALLBACK_ERROR_PATH = '/auth?auth_error=callback_failed';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const flowId = request.nextUrl.searchParams.get('sb_flow_id');
  const nextPath = getSafeRedirectPath(request.nextUrl.searchParams.get('next'));

  if (code) {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.exchangeCodeForSession(
      code,
      flowId ? { flowId } : undefined,
    );

    if (!error) {
      return createPrivateAuthRedirect(request, nextPath);
    }
  }

  return createPrivateAuthRedirect(request, CALLBACK_ERROR_PATH);
}
