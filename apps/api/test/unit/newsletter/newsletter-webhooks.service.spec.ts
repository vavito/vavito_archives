import type { VerifiedMailWebhookEvent } from '@api/core/mail/services/mail-webhook-verifier.service';
import { EmailDelivery } from '@api/modules/newsletter/domain/entities/email-delivery.entity';
import { Subscriber } from '@api/modules/newsletter/domain/entities/subscriber.entity';
import { EmailDeliveryStatus } from '@api/modules/newsletter/domain/enums/email-delivery-status.enum';
import { SubscriberConsentSource } from '@api/modules/newsletter/domain/enums/subscriber-consent-source.enum';
import { SubscriberStatus } from '@api/modules/newsletter/domain/enums/subscriber-status.enum';
import { SubscriberConsent } from '@api/modules/newsletter/domain/value-objects/subscriber-consent.value-object';
import { SubscriberEmail } from '@api/modules/newsletter/domain/value-objects/subscriber-email.value-object';
import { SubscriberTokenHash } from '@api/modules/newsletter/domain/value-objects/subscriber-token-hash.value-object';
import { WebhookProcessingResult } from '@api/modules/newsletter/repositories/webhook-events.repository';
import type {
  ProcessWebhookEventCommand,
  WebhookDeliveryContext,
  WebhookEventsRepository,
} from '@api/modules/newsletter/repositories/webhook-events.repository';
import { NewsletterWebhooksService } from '@api/modules/newsletter/services/newsletter-webhooks.service';

const CREATED_AT = new Date('2026-08-25T10:00:00.000Z');
const CONFIRMED_AT = new Date('2026-08-25T10:01:00.000Z');
const EVENT_AT = new Date('2026-08-25T10:05:00.000Z');

function delivery(): EmailDelivery {
  return EmailDelivery.restore({
    campaignId: '0b68ee40-f392-49cb-95c4-dd19cdd1bd43',
    createdAt: CREATED_AT,
    failureCode: null,
    failureReason: null,
    id: '49244eb5-fd04-438f-8d1d-a42e318c9bcd',
    lastEventAt: null,
    providerEmailId: 'email-provider-id',
    status: EmailDeliveryStatus.SENT,
    subscriberId: '2813645a-8b74-4d1f-96c3-72cf3c594ad3',
    updatedAt: CREATED_AT,
  });
}

function confirmedSubscriber(): Subscriber {
  return Subscriber.restore({
    bouncedAt: null,
    complainedAt: null,
    confirmationExpiresAt: null,
    confirmationTokenHash: null,
    confirmedAt: CONFIRMED_AT,
    consent: SubscriberConsent.create({
      consentedAt: CREATED_AT,
      source: SubscriberConsentSource.HOME,
    }),
    createdAt: CREATED_AT,
    email: SubscriberEmail.create('leitor@example.com'),
    id: '2813645a-8b74-4d1f-96c3-72cf3c594ad3',
    status: SubscriberStatus.CONFIRMED,
    unsubscribedAt: null,
    unsubscribeTokenHash: SubscriberTokenHash.create('b'.repeat(64)),
    updatedAt: CONFIRMED_AT,
  });
}

function webhook(
  type: string,
  overrides: Partial<VerifiedMailWebhookEvent> = {},
): VerifiedMailWebhookEvent {
  return {
    bounceSubType: null,
    bounceType: null,
    occurredAt: EVENT_AT,
    payloadHash: 'a'.repeat(64),
    providerEmailId: 'email-provider-id',
    providerEventId: 'event-provider-id',
    type,
    ...overrides,
  };
}

describe('NewsletterWebhooksService', () => {
  const findDeliveryContextByProviderEmailId = jest.fn<
    Promise<WebhookDeliveryContext | null>,
    [string]
  >();
  const process = jest.fn<Promise<WebhookProcessingResult>, [ProcessWebhookEventCommand]>();
  const repository = {
    findDeliveryContextByProviderEmailId,
    process,
  } as unknown as WebhookEventsRepository;
  const service = new NewsletterWebhooksService(repository);

  beforeEach(() => {
    jest.clearAllMocks();
    process.mockResolvedValue(WebhookProcessingResult.PROCESSED);
    findDeliveryContextByProviderEmailId.mockResolvedValue({
      delivery: delivery(),
      subscriber: confirmedSubscriber(),
    });
  });

  it('marca a entrega como entregue sem alterar o assinante', async () => {
    await service.process(webhook('email.delivered'));

    const command = process.mock.calls[0]![0];
    expect(command.deliveryUpdate?.status).toBe(EmailDeliveryStatus.DELIVERED);
    expect(command.expectedSubscriberUpdatedAt).toBeNull();
    expect(command.subscriberUpdate).toBeNull();
  });

  it('marca entrega e assinante em um bounce permanente', async () => {
    await service.process(
      webhook('email.bounced', { bounceSubType: 'General', bounceType: 'Permanent' }),
    );

    const command = process.mock.calls[0]![0];
    expect(command.deliveryUpdate?.status).toBe(EmailDeliveryStatus.BOUNCED);
    expect(command.subscriberUpdate?.status).toBe(SubscriberStatus.BOUNCED);
    expect(command.expectedSubscriberUpdatedAt).toEqual(CONFIRMED_AT);
  });

  it('mantém o assinante confirmado em um bounce transitório', async () => {
    await service.process(
      webhook('email.bounced', { bounceSubType: 'MailboxFull', bounceType: 'Transient' }),
    );

    const command = process.mock.calls[0]![0];
    expect(command.deliveryUpdate?.status).toBe(EmailDeliveryStatus.DELIVERY_DELAYED);
    expect(command.subscriberUpdate).toBeNull();
  });

  it('promove bounce anterior para reclamação de spam', async () => {
    const subscriber = confirmedSubscriber();
    subscriber.markBounced(new Date('2026-08-25T10:03:00.000Z'));
    const bouncedDelivery = delivery();
    bouncedDelivery.applyProviderEvent({
      failureCode: 'permanent_bounce',
      failureReason: 'Falha permanente.',
      occurredAt: new Date('2026-08-25T10:03:00.000Z'),
      status: EmailDeliveryStatus.BOUNCED,
    });
    findDeliveryContextByProviderEmailId.mockResolvedValueOnce({
      delivery: bouncedDelivery,
      subscriber,
    });

    await service.process(webhook('email.complained'));

    const command = process.mock.calls[0]![0];
    expect(command.deliveryUpdate?.status).toBe(EmailDeliveryStatus.COMPLAINED);
    expect(command.subscriberUpdate?.status).toBe(SubscriberStatus.COMPLAINED);
  });

  it('registra evento válido desconhecido sem alterar entrega', async () => {
    await service.process(webhook('email.opened'));

    const command = process.mock.calls[0]![0];
    expect(command.deliveryUpdate).toBeNull();
    expect(command.subscriberUpdate).toBeNull();
  });

  it('registra evento sem entrega correlacionada para responder de modo idempotente', async () => {
    findDeliveryContextByProviderEmailId.mockResolvedValueOnce(null);

    await service.process(webhook('email.delivered'));

    const command = process.mock.calls[0]![0];
    expect(command.deliveryId).toBeNull();
    expect(command.deliveryUpdate).toBeNull();
    expect(command.subscriberUpdate).toBeNull();
  });
});
