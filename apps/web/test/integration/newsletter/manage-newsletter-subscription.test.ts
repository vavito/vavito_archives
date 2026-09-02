import type { ApiClient } from '@vavito/api-client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  confirmNewsletterSubscription,
  unsubscribeFromNewsletter,
} from '@web/features/newsletter/services/manage-newsletter-subscription';

const apiMocks = {
  POST: vi.fn(),
};
const client = apiMocks as unknown as ApiClient;
const token = 'A'.repeat(43);

describe('gestão da inscrição na newsletter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiMocks.POST.mockResolvedValue({ data: undefined });
  });

  it('confirma a inscrição usando o token recebido por e-mail', async () => {
    await confirmNewsletterSubscription(token, client);

    expect(apiMocks.POST).toHaveBeenCalledWith('/api/v1/newsletter/subscriptions/confirm', {
      body: { token },
    });
  });

  it('cancela a inscrição usando o token recebido por e-mail', async () => {
    await unsubscribeFromNewsletter(token, client);

    expect(apiMocks.POST).toHaveBeenCalledWith('/api/v1/newsletter/subscriptions/unsubscribe', {
      body: { token },
    });
  });
});
