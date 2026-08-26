import type { ExecutionContext } from '@nestjs/common';

import { NewsletterRateLimitException } from '@api/modules/newsletter/errors/newsletter-rate-limit.exception';
import { NewsletterRateLimitGuard } from '@api/modules/newsletter/guards/newsletter-rate-limit.guard';
import {
  NEWSLETTER_RATE_LIMIT,
  NEWSLETTER_RATE_LIMIT_WINDOW_MS,
} from '@api/modules/newsletter/newsletter.constants';

function context(path = '/newsletter/subscriptions'): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ ip: '203.0.113.10', path }),
    }),
  } as unknown as ExecutionContext;
}

describe('NewsletterRateLimitGuard', () => {
  let guard: NewsletterRateLimitGuard;

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-08-25T12:00:00.000Z'));
    guard = new NewsletterRateLimitGuard();
  });

  afterEach(() => jest.useRealTimers());

  it('aceita cinco solicitações por IP e rota a cada minuto', () => {
    for (let attempt = 0; attempt < NEWSLETTER_RATE_LIMIT; attempt += 1) {
      expect(guard.canActivate(context())).toBe(true);
    }

    expect(() => guard.canActivate(context())).toThrow(NewsletterRateLimitException);
  });

  it('isola endpoints e abre uma nova janela depois de um minuto', () => {
    for (let attempt = 0; attempt < NEWSLETTER_RATE_LIMIT; attempt += 1) {
      guard.canActivate(context());
    }

    expect(guard.canActivate(context('/newsletter/subscriptions/confirm'))).toBe(true);
    jest.advanceTimersByTime(NEWSLETTER_RATE_LIMIT_WINDOW_MS);
    expect(guard.canActivate(context())).toBe(true);
  });
});
