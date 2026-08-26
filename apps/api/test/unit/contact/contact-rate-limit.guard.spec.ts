import type { ExecutionContext } from '@nestjs/common';

import {
  CONTACT_RATE_LIMIT,
  CONTACT_RATE_LIMIT_WINDOW_MS,
} from '@api/modules/contact/contact.constants';
import { ContactRateLimitException } from '@api/modules/contact/errors/contact-rate-limit.exception';
import { ContactRateLimitGuard } from '@api/modules/contact/guards/contact-rate-limit.guard';

function context(ip = '203.0.113.10'): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ ip }) }),
  } as unknown as ExecutionContext;
}

describe('ContactRateLimitGuard', () => {
  let guard: ContactRateLimitGuard;

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-08-26T12:00:00.000Z'));
    guard = new ContactRateLimitGuard();
  });

  afterEach(() => jest.useRealTimers());

  it('aceita cinco mensagens por IP a cada minuto', () => {
    for (let attempt = 0; attempt < CONTACT_RATE_LIMIT; attempt += 1) {
      expect(guard.canActivate(context())).toBe(true);
    }

    expect(() => guard.canActivate(context())).toThrow(ContactRateLimitException);
  });

  it('isola IPs e abre uma nova janela depois de um minuto', () => {
    for (let attempt = 0; attempt < CONTACT_RATE_LIMIT; attempt += 1) {
      guard.canActivate(context());
    }

    expect(guard.canActivate(context('198.51.100.20'))).toBe(true);
    jest.advanceTimersByTime(CONTACT_RATE_LIMIT_WINDOW_MS);
    expect(guard.canActivate(context())).toBe(true);
  });
});
