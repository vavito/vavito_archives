import type { ApiClient } from '@vavito/api-client';

import { createWebPublicApiClient } from '@web/lib/api/api-client';

interface TrackPostViewOptions {
  client?: ApiClient;
  slug: string;
}

export async function trackPostView({
  client = createWebPublicApiClient(),
  slug,
}: TrackPostViewOptions): Promise<void> {
  await client.POST('/api/v1/posts/{slug}/views', {
    params: { path: { slug } },
  });
}
