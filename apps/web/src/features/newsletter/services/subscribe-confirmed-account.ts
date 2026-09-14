import { getApiBaseUrl } from '@web/lib/env/public-env';

const CONFIRMED_ACCOUNT_SUBSCRIPTION_TIMEOUT_MS = 20_000;

export async function subscribeConfirmedAccount(accessToken: string): Promise<void> {
  const response = await fetch(
    new URL('/api/v1/newsletter/subscriptions/account', getApiBaseUrl()),
    {
      cache: 'no-store',
      headers: { authorization: `Bearer ${accessToken}` },
      method: 'POST',
      signal: AbortSignal.timeout(CONFIRMED_ACCOUNT_SUBSCRIPTION_TIMEOUT_MS),
    },
  );

  if (!response.ok) throw new Error('Account newsletter subscription failed.');
}
