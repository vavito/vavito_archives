import type { ExecutionContext } from '@nestjs/common';

import { CommentsRateLimitException } from '@api/modules/comments/errors/comments-rate-limit.exception';
import {
  COMMENTS_RATE_LIMIT,
  COMMENTS_RATE_LIMIT_WINDOW_MS,
  CommentsRateLimitGuard,
} from '@api/modules/comments/guards/comments-rate-limit.guard';

describe('CommentsRateLimitGuard', () => {
  let guard: CommentsRateLimitGuard;
  const context = {
    switchToHttp: () => ({
      getRequest: () => ({ user: { email: 'leitor@example.com', id: 'user-id' } }),
    }),
  } as unknown as ExecutionContext;

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-08-22T12:00:00.000Z'));
    guard = new CommentsRateLimitGuard();
  });

  afterEach(() => jest.useRealTimers());

  it('aceita cinco comentários por usuário na janela de um minuto', () => {
    for (let attempt = 0; attempt < COMMENTS_RATE_LIMIT; attempt += 1) {
      expect(guard.canActivate(context)).toBe(true);
    }

    expect(() => guard.canActivate(context)).toThrow(CommentsRateLimitException);
  });

  it('abre nova janela depois de um minuto', () => {
    expect(guard.canActivate(context)).toBe(true);
    jest.advanceTimersByTime(COMMENTS_RATE_LIMIT_WINDOW_MS);
    expect(guard.canActivate(context)).toBe(true);
  });
});
