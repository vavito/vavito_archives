import 'server-only';

import { cache } from 'react';
import { redirect } from 'next/navigation';

import { getProfile } from '@web/features/profile';
import { createWebAuthenticatedApiClient } from '@web/lib/api/api-client';
import { getAuthenticatedSession } from '@web/lib/auth/authenticated-session';

export const requireAdminSession = cache(async () => {
  const session = await getAuthenticatedSession();

  if (!session) {
    redirect('/auth?next=/admin');
  }

  const profile = await getProfile(createWebAuthenticatedApiClient(() => session.accessToken));

  if (profile.role !== 'ADMIN') {
    redirect('/unauthorized');
  }

  return session;
});
