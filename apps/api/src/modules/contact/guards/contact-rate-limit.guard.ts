import { createHash } from 'node:crypto';

import {
  CONTACT_RATE_LIMIT,
  CONTACT_RATE_LIMIT_WINDOW_MS,
} from '@api/modules/contact/contact.constants';
import { ContactRateLimitException } from '@api/modules/contact/errors/contact-rate-limit.exception';
import { type CanActivate, type ExecutionContext, Injectable } from '@nestjs/common';

interface ContactRateLimitRequest {
  ip?: string;
  socket?: { remoteAddress?: string };
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

@Injectable()
export class ContactRateLimitGuard implements CanActivate {
  private readonly entries = new Map<string, RateLimitEntry>();

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<ContactRateLimitRequest>();
    const ip = request.ip ?? request.socket?.remoteAddress ?? 'unknown';
    const key = createHash('sha256').update(ip, 'utf8').digest('hex');
    const now = Date.now();
    const current = this.entries.get(key);

    if (!current || current.resetAt <= now) {
      this.entries.set(key, { count: 1, resetAt: now + CONTACT_RATE_LIMIT_WINDOW_MS });
      this.pruneExpiredEntries(now);
      return true;
    }

    if (current.count >= CONTACT_RATE_LIMIT) throw new ContactRateLimitException();

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
