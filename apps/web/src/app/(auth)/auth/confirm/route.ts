import type { EmailOtpType } from '@supabase/supabase-js';
import type { NextRequest } from 'next/server';

import { getSafeRedirectPath } from '@web/lib/auth/redirect-path';
import { createPrivateAuthRedirect } from '@web/lib/auth/redirect-response';
import { createServerSupabaseClient } from '@web/lib/auth/supabase/server';

const CONFIRMATION_ERROR_PATH = '/auth?auth_error=confirmation_failed';
const EMAIL_OTP_TYPES = new Set<EmailOtpType>([
  'email',
  'email_change',
  'invite',
  'magiclink',
  'recovery',
  'signup',
]);

export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get('token_hash');
  const type = request.nextUrl.searchParams.get('type');
  const nextPath = getSafeRedirectPath(
    request.nextUrl.searchParams.get('next'),
    '/auth?auth_status=confirmed',
  );

  if (tokenHash && isEmailOtpType(type)) {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });

    if (!error) {
      return createPrivateAuthRedirect(request, nextPath);
    }
  }

  return createPrivateAuthRedirect(request, CONFIRMATION_ERROR_PATH);
}

function isEmailOtpType(value: string | null): value is EmailOtpType {
  return value !== null && EMAIL_OTP_TYPES.has(value);
}
