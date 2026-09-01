import type { ApiClient } from '@vavito/api-client';

import { createWebPublicApiClient } from '@web/lib/api/api-client';

export async function subscribeToNewsletter(
  email: string,
  client: ApiClient = createWebPublicApiClient(),
): Promise<void> {
  await client.POST('/api/v1/newsletter/subscriptions', {
    body: { consent: true, email, source: 'HOME' },
  });
}
