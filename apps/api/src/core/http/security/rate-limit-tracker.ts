import { createHash } from 'node:crypto';

import type { AuthenticatedUser } from '@api/core/auth/interfaces/authenticated-user.interface';

interface RateLimitRequest {
  ip?: string;
  ips?: string[];
  socket?: { remoteAddress?: string };
  user?: AuthenticatedUser;
}

export function createRateLimitTracker(request: RateLimitRequest): string {
  const forwardedIp = request.ips?.[0];
  const identity = request.user?.id
    ? `user:${request.user.id}`
    : `ip:${forwardedIp ?? request.ip ?? request.socket?.remoteAddress ?? 'unknown'}`;

  return createHash('sha256').update(identity, 'utf8').digest('hex');
}
