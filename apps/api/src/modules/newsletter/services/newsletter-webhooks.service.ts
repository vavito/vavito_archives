import type { VerifiedMailWebhookEvent } from '@api/core/mail/services/mail-webhook-verifier.service';
import type { Subscriber } from '@api/modules/newsletter/domain/entities/subscriber.entity';
import { EmailDeliveryStatus } from '@api/modules/newsletter/domain/enums/email-delivery-status.enum';
import { SubscriberStatus } from '@api/modules/newsletter/domain/enums/subscriber-status.enum';
import {
  WebhookEventsRepository,
  WebhookProcessingResult,
} from '@api/modules/newsletter/repositories/webhook-events.repository';
import { Injectable, Logger } from '@nestjs/common';

interface DeliveryEvent {
  failureCode: string | null;
  failureReason: string | null;
  occurredAt: Date;
  status: EmailDeliveryStatus;
}

function permanentBounce(event: VerifiedMailWebhookEvent): boolean {
  const classification = `${event.bounceType ?? ''} ${event.bounceSubType ?? ''}`.toLowerCase();
  return classification.includes('permanent') || classification.includes('hard');
}

function deliveryEventFrom(event: VerifiedMailWebhookEvent): DeliveryEvent | null {
  switch (event.type) {
    case 'email.delivered':
      return {
        failureCode: null,
        failureReason: null,
        occurredAt: event.occurredAt,
        status: EmailDeliveryStatus.DELIVERED,
      };
    case 'email.delivery_delayed':
      return {
        failureCode: 'delivery_delayed',
        failureReason: 'O provedor informou atraso temporário na entrega.',
        occurredAt: event.occurredAt,
        status: EmailDeliveryStatus.DELIVERY_DELAYED,
      };
    case 'email.bounced':
      return permanentBounce(event)
        ? {
            failureCode: 'permanent_bounce',
            failureReason: 'O provedor informou falha permanente na entrega.',
            occurredAt: event.occurredAt,
            status: EmailDeliveryStatus.BOUNCED,
          }
        : {
            failureCode: 'transient_bounce',
            failureReason: 'O provedor informou falha temporária na entrega.',
            occurredAt: event.occurredAt,
            status: EmailDeliveryStatus.DELIVERY_DELAYED,
          };
    case 'email.complained':
      return {
        failureCode: 'complained',
        failureReason: 'O destinatário informou a mensagem como spam.',
        occurredAt: event.occurredAt,
        status: EmailDeliveryStatus.COMPLAINED,
      };
    case 'email.failed':
      return {
        failureCode: 'provider_failed',
        failureReason: 'O provedor informou falha no processamento da entrega.',
        occurredAt: event.occurredAt,
        status: EmailDeliveryStatus.FAILED,
      };
    case 'email.suppressed':
      return {
        failureCode: 'provider_suppressed',
        failureReason: 'O provedor suprimiu a entrega.',
        occurredAt: event.occurredAt,
        status: EmailDeliveryStatus.SUPPRESSED,
      };
    default:
      return null;
  }
}

@Injectable()
export class NewsletterWebhooksService {
  private readonly logger = new Logger(NewsletterWebhooksService.name);

  constructor(private readonly webhookEventsRepository: WebhookEventsRepository) {}

  async process(event: VerifiedMailWebhookEvent): Promise<void> {
    const context = event.providerEmailId
      ? await this.webhookEventsRepository.findDeliveryContextByProviderEmailId(
          event.providerEmailId,
        )
      : null;
    const deliveryEvent = deliveryEventFrom(event);
    const deliveryApplied =
      context && deliveryEvent ? context.delivery.applyProviderEvent(deliveryEvent) : false;
    const previousSubscriberUpdatedAt = context?.subscriber.updatedAt ?? null;
    const subscriberUpdated =
      context && deliveryApplied ? this.applySubscriberEvent(context.subscriber, event) : false;
    const result = await this.webhookEventsRepository.process({
      deliveryId: context?.delivery.id ?? null,
      deliveryUpdate: deliveryApplied ? context!.delivery : null,
      event,
      expectedSubscriberUpdatedAt: subscriberUpdated ? previousSubscriberUpdatedAt : null,
      subscriberUpdate: subscriberUpdated ? context!.subscriber : null,
    });

    this.logResult(event, result, Boolean(context), Boolean(deliveryEvent));
  }

  private applySubscriberEvent(subscriber: Subscriber, event: VerifiedMailWebhookEvent): boolean {
    if (event.occurredAt < subscriber.updatedAt) return false;

    if (event.type === 'email.bounced' && permanentBounce(event)) {
      if (subscriber.status !== SubscriberStatus.CONFIRMED) return false;
      subscriber.markBounced(event.occurredAt);
      return true;
    }
    if (event.type === 'email.complained') {
      if (
        subscriber.status !== SubscriberStatus.CONFIRMED &&
        subscriber.status !== SubscriberStatus.BOUNCED
      ) {
        return false;
      }
      subscriber.markComplained(event.occurredAt);
      return true;
    }

    return false;
  }

  private logResult(
    event: VerifiedMailWebhookEvent,
    result: WebhookProcessingResult,
    deliveryFound: boolean,
    eventHandled: boolean,
  ): void {
    if (result === WebhookProcessingResult.CONFLICT) {
      this.logger.error(`Webhook ${event.providerEventId} repetido com payload divergente.`);
      return;
    }
    if (result === WebhookProcessingResult.DUPLICATE) {
      this.logger.log(`Webhook ${event.providerEventId} já processado.`);
      return;
    }
    if (result === WebhookProcessingResult.STALE) {
      this.logger.log(
        `Webhook ${event.providerEventId} ignorado por ser anterior ao estado atual.`,
      );
      return;
    }
    if (!deliveryFound || !eventHandled) {
      this.logger.log(`Webhook ${event.providerEventId} reconhecido sem alteração de entrega.`);
      return;
    }
    this.logger.log(`Webhook ${event.providerEventId} processado com sucesso.`);
  }
}
