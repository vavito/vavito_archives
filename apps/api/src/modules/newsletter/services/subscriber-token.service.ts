import { createHash, createHmac, randomBytes } from 'node:crypto';

import type { ApplicationConfig } from '@api/core/config/app.config';
import { SubscriberTokenHash } from '@api/modules/newsletter/domain/value-objects/subscriber-token-hash.value-object';
import { SUBSCRIBER_TOKEN_BYTES } from '@api/modules/newsletter/newsletter.constants';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface GeneratedSubscriberToken {
  hash: SubscriberTokenHash;
  raw: string;
}

@Injectable()
export class SubscriberTokenService {
  private readonly secret: string;

  constructor(configService: ConfigService<ApplicationConfig, true>) {
    this.secret = configService.get('security.newsletterTokenSecret', { infer: true });
  }

  generateConfirmation(): GeneratedSubscriberToken {
    const raw = randomBytes(SUBSCRIBER_TOKEN_BYTES).toString('base64url');

    return { hash: this.hash(raw), raw };
  }

  unsubscribeFor(subscriberId: string): GeneratedSubscriberToken {
    const raw = createHmac('sha256', this.secret)
      .update(`unsubscribe:${subscriberId}`, 'utf8')
      .digest('base64url');

    return { hash: this.hash(raw), raw };
  }

  hash(raw: string): SubscriberTokenHash {
    return SubscriberTokenHash.create(createHash('sha256').update(raw, 'utf8').digest('hex'));
  }
}
