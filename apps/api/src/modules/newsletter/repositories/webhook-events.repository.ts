import type { VerifiedMailWebhookEvent } from '@api/core/mail/services/mail-webhook-verifier.service';
import type { EmailDelivery } from '@api/modules/newsletter/domain/entities/email-delivery.entity';
import type { Subscriber } from '@api/modules/newsletter/domain/entities/subscriber.entity';

export interface WebhookDeliveryContext {
  delivery: EmailDelivery;
  subscriber: Subscriber;
}

export interface ProcessWebhookEventCommand {
  deliveryId: string | null;
  deliveryUpdate: EmailDelivery | null;
  event: VerifiedMailWebhookEvent;
  expectedSubscriberUpdatedAt: Date | null;
  subscriberUpdate: Subscriber | null;
}

export enum WebhookProcessingResult {
  CONFLICT = 'CONFLICT',
  DUPLICATE = 'DUPLICATE',
  PROCESSED = 'PROCESSED',
  STALE = 'STALE',
}

export abstract class WebhookEventsRepository {
  abstract findDeliveryContextByProviderEmailId(
    providerEmailId: string,
  ): Promise<WebhookDeliveryContext | null>;
  abstract process(command: ProcessWebhookEventCommand): Promise<WebhookProcessingResult>;
}
