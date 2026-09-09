import { getProfile } from '@web/features/profile';
import { createWebAuthenticatedApiClient } from '@web/lib/api/api-client';
import { getAuthenticatedSession } from '@web/lib/auth/authenticated-session';

import { AccountNavigationAction, type AccountSummary } from './account-navigation-action';

function fallbackDisplayName(email: string): string {
  return email.split('@')[0]?.trim() || 'Minha conta';
}

export async function AccountNavigation() {
  const session = await getAuthenticatedSession();

  if (!session) {
    return <AccountNavigationAction account={null} />;
  }

  let account: AccountSummary = {
    avatarUrl: null,
    displayName: fallbackDisplayName(session.email),
    isAdmin: false,
  };

  try {
    const profile = await getProfile(createWebAuthenticatedApiClient(() => session.accessToken));
    account = {
      avatarUrl: profile.avatarUrl,
      displayName: profile.displayName,
      isAdmin: profile.role === 'ADMIN',
    };
  } catch {
    // A sessão continua válida mesmo quando os dados complementares estão temporariamente indisponíveis.
  }

  return <AccountNavigationAction account={account} />;
}
