import type { ExecutionContext } from '@nestjs/common';

import { PostViewRateLimitException } from '@api/modules/posts/errors/post-view-rate-limit.exception';
import {
  POST_VIEWS_RATE_LIMIT,
  POST_VIEWS_RATE_LIMIT_WINDOW_MS,
  PostViewsRateLimitGuard,
} from '@api/modules/posts/guards/post-views-rate-limit.guard';
import type { PostViewFingerprintService } from '@api/modules/posts/services/post-view-fingerprint.service';

describe('PostViewsRateLimitGuard', () => {
  const createRateLimitKey = jest.fn(() => 'rate-limit-key');
  const fingerprintService = {
    createRateLimitKey,
  } as unknown as PostViewFingerprintService;
  let guard: PostViewsRateLimitGuard;
  const context = {
    switchToHttp: () => ({ getRequest: () => ({ ip: '203.0.113.10' }) }),
  } as unknown as ExecutionContext;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers().setSystemTime(new Date('2026-08-19T12:00:00.000Z'));
    guard = new PostViewsRateLimitGuard(fingerprintService);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('aceita até trinta registros por IP na janela de um minuto', () => {
    for (let attempt = 0; attempt < POST_VIEWS_RATE_LIMIT; attempt += 1) {
      expect(guard.canActivate(context)).toBe(true);
    }

    expect(() => guard.canActivate(context)).toThrow(PostViewRateLimitException);
  });

  it('abre uma nova janela depois de um minuto', () => {
    expect(guard.canActivate(context)).toBe(true);
    jest.advanceTimersByTime(POST_VIEWS_RATE_LIMIT_WINDOW_MS);

    expect(guard.canActivate(context)).toBe(true);
  });
});
