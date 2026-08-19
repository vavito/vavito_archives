import { createHmac } from 'node:crypto';

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { ApplicationConfig } from '@api/core/config/app.config';

export interface PostViewSignal {
  ip: string;
  userAgent: string;
}

@Injectable()
export class PostViewFingerprintService {
  private readonly secret: string;

  constructor(configService: ConfigService<ApplicationConfig, true>) {
    this.secret = configService.get('security.viewFingerprintSecret', { infer: true });
  }

  createDailyFingerprint(signal: PostViewSignal, bucketDate: string): string {
    return this.hash(['post-view', bucketDate, signal.ip, signal.userAgent]);
  }

  createRateLimitKey(ip: string): string {
    return this.hash(['post-view-rate-limit', ip]);
  }

  private hash(parts: readonly string[]): string {
    const hmac = createHmac('sha256', this.secret);

    for (const part of parts) {
      hmac.update(part);
      hmac.update('\0');
    }

    return hmac.digest('hex');
  }
}
