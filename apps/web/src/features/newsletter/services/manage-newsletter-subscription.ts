import type { ApiClient } from '@vavito/api-client';

import { createWebPublicApiClient } from '@web/lib/api/api-client';

export async function confirmNewsletterSubscription(
  token: string,
  client: ApiClient = createWebPublicApiClient(),
): Promise<void> {
  await client.POST('/api/v1/newsletter/subscriptions/confirm', {
    body: { token },
  });
}

export async function unsubscribeFromNewsletter(
  token: string,
  client: ApiClient = createWebPublicApiClient(),
): Promise<void> {
  await client.POST('/api/v1/newsletter/subscriptions/unsubscribe', {
    body: { token },
  });
}
