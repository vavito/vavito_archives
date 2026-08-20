import { type CanActivate, type ExecutionContext, Injectable } from '@nestjs/common';

import { PostViewRateLimitException } from '@api/modules/posts/errors/post-view-rate-limit.exception';
import { PostViewFingerprintService } from '@api/modules/posts/services/post-view-fingerprint.service';

export const POST_VIEWS_RATE_LIMIT = 30;
export const POST_VIEWS_RATE_LIMIT_WINDOW_MS = 60_000;

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface PostViewRateLimitRequest {
  ip: string;
}

@Injectable()
export class PostViewsRateLimitGuard implements CanActivate {
  private readonly entries = new Map<string, RateLimitEntry>();

  constructor(private readonly fingerprintService: PostViewFingerprintService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<PostViewRateLimitRequest>();
    const key = this.fingerprintService.createRateLimitKey(request.ip);
    const now = Date.now();
    const current = this.entries.get(key);

    if (!current || current.resetAt <= now) {
      this.entries.set(key, { count: 1, resetAt: now + POST_VIEWS_RATE_LIMIT_WINDOW_MS });
      this.pruneExpiredEntries(now);
      return true;
    }

    if (current.count >= POST_VIEWS_RATE_LIMIT) {
      throw new PostViewRateLimitException();
    }

    current.count += 1;
    return true;
  }

  private pruneExpiredEntries(now: number): void {
    if (this.entries.size < 1_000) {
      return;
    }

    for (const [key, entry] of this.entries) {
      if (entry.resetAt <= now) {
        this.entries.delete(key);
      }
    }
  }
}
