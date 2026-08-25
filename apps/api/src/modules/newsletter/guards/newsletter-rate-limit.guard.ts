import { createHash } from 'node:crypto';

import { NewsletterRateLimitException } from '@api/modules/newsletter/errors/newsletter-rate-limit.exception';
import {
  NEWSLETTER_RATE_LIMIT,
  NEWSLETTER_RATE_LIMIT_WINDOW_MS,
} from '@api/modules/newsletter/newsletter.constants';
import { type CanActivate, type ExecutionContext, Injectable } from '@nestjs/common';

interface NewsletterRateLimitRequest {
  ip?: string;
  path?: string;
  socket?: { remoteAddress?: string };
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

@Injectable()
export class NewsletterRateLimitGuard implements CanActivate {
  private readonly entries = new Map<string, RateLimitEntry>();

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<NewsletterRateLimitRequest>();
    const ip = request.ip ?? request.socket?.remoteAddress ?? 'unknown';
    const route = request.path ?? 'newsletter';
    const key = createHash('sha256').update(`${ip}:${route}`, 'utf8').digest('hex');
    const now = Date.now();
    const current = this.entries.get(key);

    if (!current || current.resetAt <= now) {
      this.entries.set(key, { count: 1, resetAt: now + NEWSLETTER_RATE_LIMIT_WINDOW_MS });
      this.pruneExpiredEntries(now);
      return true;
    }

    if (current.count >= NEWSLETTER_RATE_LIMIT) {
      throw new NewsletterRateLimitException();
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
