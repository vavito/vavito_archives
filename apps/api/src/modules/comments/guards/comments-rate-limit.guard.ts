import { type CanActivate, type ExecutionContext, Injectable } from '@nestjs/common';

import { UnauthenticatedException } from '@api/core/auth/errors/unauthenticated.exception';
import type { AuthenticatedRequest } from '@api/core/auth/interfaces/authenticated-user.interface';
import { CommentsRateLimitException } from '@api/modules/comments/errors/comments-rate-limit.exception';

export const COMMENTS_RATE_LIMIT = 5;
export const COMMENTS_RATE_LIMIT_WINDOW_MS = 60_000;

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

@Injectable()
export class CommentsRateLimitGuard implements CanActivate {
  private readonly entries = new Map<string, RateLimitEntry>();

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const userId = request.user?.id;

    if (!userId) {
      throw new UnauthenticatedException();
    }

    const now = Date.now();
    const current = this.entries.get(userId);

    if (!current || current.resetAt <= now) {
      this.entries.set(userId, { count: 1, resetAt: now + COMMENTS_RATE_LIMIT_WINDOW_MS });
      this.pruneExpiredEntries(now);
      return true;
    }

    if (current.count >= COMMENTS_RATE_LIMIT) {
      throw new CommentsRateLimitException();
    }

    current.count += 1;
    return true;
  }

  private pruneExpiredEntries(now: number): void {
    if (this.entries.size < 1_000) return;

    for (const [key, entry] of this.entries) {
      if (entry.resetAt <= now) this.entries.delete(key);
    }
  }
}
