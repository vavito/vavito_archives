import { getApiBaseUrl } from '@web/lib/env/public-env';

export async function subscribeConfirmedAccount(accessToken: string): Promise<void> {
  const response = await fetch(
    new URL('/api/v1/newsletter/subscriptions/account', getApiBaseUrl()),
    {
      cache: 'no-store',
      headers: { authorization: `Bearer ${accessToken}` },
      method: 'POST',
      signal: AbortSignal.timeout(5_000),
    },
  );

  if (!response.ok) throw new Error('Account newsletter subscription failed.');
}
