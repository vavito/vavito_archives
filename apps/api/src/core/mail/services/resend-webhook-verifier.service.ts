import { createHash } from 'node:crypto';

import type { ApplicationConfig } from '@api/core/config/app.config';
import { MailWebhookPayloadInvalidError } from '@api/core/mail/errors/mail-webhook-payload-invalid.error';
import { MailWebhookSignatureInvalidError } from '@api/core/mail/errors/mail-webhook-signature-invalid.error';
import { RESEND_WEBHOOK_CLIENT } from '@api/core/mail/mail.constants';
import type { ResendWebhookClient } from '@api/core/mail/providers/resend-webhook-client';
import {
  MailWebhookVerifier,
  type VerifiedMailWebhookEvent,
  type VerifyMailWebhookInput,
} from '@api/core/mail/services/mail-webhook-verifier.service';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { WebhookEventPayload } from 'resend';

function emailIdFrom(event: WebhookEventPayload): string | null {
  if (!('email_id' in event.data)) return null;
  return typeof event.data.email_id === 'string' ? event.data.email_id : null;
}

function bounceFrom(event: WebhookEventPayload): { subType: string; type: string } | null {
  if (event.type !== 'email.bounced') return null;
  return { subType: event.data.bounce.subType, type: event.data.bounce.type };
}

@Injectable()
export class ResendWebhookVerifierService implements MailWebhookVerifier {
  private readonly webhookSecret: string;

  constructor(
    @Inject(RESEND_WEBHOOK_CLIENT) private readonly resend: ResendWebhookClient,
    configService: ConfigService<ApplicationConfig, true>,
  ) {
    this.webhookSecret = configService.get('resend.webhookSecret', { infer: true });
  }

  verify(input: VerifyMailWebhookInput): VerifiedMailWebhookEvent {
    const { id, signature, timestamp } = input.headers;
    if (!id || !signature || !timestamp || !input.payload) {
      throw new MailWebhookSignatureInvalidError();
    }

    let event: WebhookEventPayload;
    try {
      event = this.resend.verify({
        headers: { id, signature, timestamp },
        payload: input.payload,
        webhookSecret: this.webhookSecret,
      });
    } catch {
      throw new MailWebhookSignatureInvalidError();
    }

    const occurredAt = new Date(event.created_at);
    const providerEmailId = emailIdFrom(event);
    const bounce = bounceFrom(event);
    const isEmailEvent = event.type.startsWith('email.');

    if (
      id.length > 255 ||
      event.type.length > 100 ||
      !Number.isFinite(occurredAt.getTime()) ||
      (isEmailEvent && (!providerEmailId || providerEmailId.length > 255))
    ) {
      throw new MailWebhookPayloadInvalidError();
    }

    return {
      bounceSubType: bounce?.subType ?? null,
      bounceType: bounce?.type ?? null,
      occurredAt,
      payloadHash: createHash('sha256').update(input.payload, 'utf8').digest('hex'),
      providerEmailId,
      providerEventId: id,
      type: event.type,
    };
  }
}
