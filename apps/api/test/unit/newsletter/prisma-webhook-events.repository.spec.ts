import type { VerifiedMailWebhookEvent } from '@api/core/mail/services/mail-webhook-verifier.service';
import type { PrismaService } from '@api/core/database/prisma.service';
import {
  EmailDeliveryStatus as PrismaEmailDeliveryStatus,
  SubscriberStatus as PrismaSubscriberStatus,
} from '@api/generated/prisma/client';
import type { Prisma } from '@api/generated/prisma/client';
import { EmailDelivery } from '@api/modules/newsletter/domain/entities/email-delivery.entity';
import { Subscriber } from '@api/modules/newsletter/domain/entities/subscriber.entity';
import { EmailDeliveryStatus } from '@api/modules/newsletter/domain/enums/email-delivery-status.enum';
import { SubscriberConsentSource } from '@api/modules/newsletter/domain/enums/subscriber-consent-source.enum';
import { SubscriberStatus } from '@api/modules/newsletter/domain/enums/subscriber-status.enum';
import { SubscriberConsent } from '@api/modules/newsletter/domain/value-objects/subscriber-consent.value-object';
import { SubscriberEmail } from '@api/modules/newsletter/domain/value-objects/subscriber-email.value-object';
import { SubscriberTokenHash } from '@api/modules/newsletter/domain/value-objects/subscriber-token-hash.value-object';
import { PrismaWebhookEventsRepository } from '@api/modules/newsletter/repositories/prisma-webhook-events.repository';
import { WebhookProcessingResult } from '@api/modules/newsletter/repositories/webhook-events.repository';

const CREATED_AT = new Date('2026-08-25T10:00:00.000Z');
const CONFIRMED_AT = new Date('2026-08-25T10:01:00.000Z');
const EVENT_AT = new Date('2026-08-25T10:05:00.000Z');
const DELIVERY_ID = '49244eb5-fd04-438f-8d1d-a42e318c9bcd';
const SUBSCRIBER_ID = '2813645a-8b74-4d1f-96c3-72cf3c594ad3';

function event(): VerifiedMailWebhookEvent {
  return {
    bounceSubType: 'General',
    bounceType: 'Permanent',
    occurredAt: EVENT_AT,
    payloadHash: 'a'.repeat(64),
    providerEmailId: 'email-provider-id',
    providerEventId: 'event-provider-id',
    type: 'email.bounced',
  };
}

function bouncedDelivery(): EmailDelivery {
  const delivery = EmailDelivery.restore({
    campaignId: '0b68ee40-f392-49cb-95c4-dd19cdd1bd43',
    createdAt: CREATED_AT,
    failureCode: null,
    failureReason: null,
    id: DELIVERY_ID,
    lastEventAt: null,
    providerEmailId: 'email-provider-id',
    status: EmailDeliveryStatus.SENT,
    subscriberId: SUBSCRIBER_ID,
    updatedAt: CREATED_AT,
  });
  delivery.applyProviderEvent({
    failureCode: 'permanent_bounce',
    failureReason: 'Falha permanente.',
    occurredAt: EVENT_AT,
    status: EmailDeliveryStatus.BOUNCED,
  });
  return delivery;
}

function bouncedSubscriber(): Subscriber {
  const subscriber = Subscriber.restore({
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
    id: SUBSCRIBER_ID,
    status: SubscriberStatus.CONFIRMED,
    unsubscribedAt: null,
    unsubscribeTokenHash: SubscriberTokenHash.create('b'.repeat(64)),
    updatedAt: CONFIRMED_AT,
  });
  subscriber.markBounced(EVENT_AT);
  return subscriber;
}

describe('PrismaWebhookEventsRepository', () => {
  const eventCreateMany = jest.fn<
    Promise<Prisma.BatchPayload>,
    [Prisma.WebhookEventCreateManyArgs]
  >();
  const eventFindUnique = jest.fn<
    Promise<{ payloadHash: string } | null>,
    [Prisma.WebhookEventFindUniqueArgs]
  >();
  const eventUpdate = jest.fn<Promise<unknown>, [Prisma.WebhookEventUpdateArgs]>();
  const deliveryUpdateMany = jest.fn<
    Promise<Prisma.BatchPayload>,
    [Prisma.EmailDeliveryUpdateManyArgs]
  >();
  const subscriberUpdateMany = jest.fn<
    Promise<Prisma.BatchPayload>,
    [Prisma.NewsletterSubscriberUpdateManyArgs]
  >();
  const deliveryFindUnique = jest.fn<
    Promise<Prisma.EmailDeliveryGetPayload<{ include: { subscriber: true } }> | null>,
    [Prisma.EmailDeliveryFindUniqueArgs]
  >();
  const transaction = {
    emailDelivery: { updateMany: deliveryUpdateMany },
    newsletterSubscriber: { updateMany: subscriberUpdateMany },
    webhookEvent: { createMany: eventCreateMany, findUnique: eventFindUnique, update: eventUpdate },
  };
  const $transaction = jest.fn((callback: (client: typeof transaction) => Promise<unknown>) =>
    callback(transaction),
  );
  const prisma = {
    $transaction,
    emailDelivery: { findUnique: deliveryFindUnique },
  } as unknown as PrismaService;
  const repository = new PrismaWebhookEventsRepository(prisma);

  beforeEach(() => {
    jest.clearAllMocks();
    eventCreateMany.mockResolvedValue({ count: 1 });
    deliveryUpdateMany.mockResolvedValue({ count: 1 });
    subscriberUpdateMany.mockResolvedValue({ count: 1 });
    eventUpdate.mockResolvedValue({});
  });

  it('correlaciona a entrega e restaura seu assinante', async () => {
    deliveryFindUnique.mockResolvedValueOnce({
      campaignId: '0b68ee40-f392-49cb-95c4-dd19cdd1bd43',
      createdAt: CREATED_AT,
      failureCode: null,
      failureReason: null,
      id: DELIVERY_ID,
      lastEventAt: null,
      providerEmailId: 'email-provider-id',
      status: PrismaEmailDeliveryStatus.SENT,
      subscriber: {
        bouncedAt: null,
        complainedAt: null,
        confirmationExpiresAt: null,
        confirmationTokenHash: null,
        confirmedAt: CONFIRMED_AT,
        consentedAt: CREATED_AT,
        consentSource: SubscriberConsentSource.HOME,
        createdAt: CREATED_AT,
        email: 'leitor@example.com',
        id: SUBSCRIBER_ID,
        status: PrismaSubscriberStatus.CONFIRMED,
        unsubscribedAt: null,
        unsubscribeTokenHash: 'b'.repeat(64),
        updatedAt: CONFIRMED_AT,
      },
      subscriberId: SUBSCRIBER_ID,
      updatedAt: CREATED_AT,
    });

    const context = await repository.findDeliveryContextByProviderEmailId('email-provider-id');

    expect(context?.delivery.status).toBe(EmailDeliveryStatus.SENT);
    expect(context?.subscriber.status).toBe(SubscriberStatus.CONFIRMED);
  });

  it('persiste evento, entrega e assinante na mesma transação', async () => {
    const result = await repository.process({
      deliveryId: DELIVERY_ID,
      deliveryUpdate: bouncedDelivery(),
      event: event(),
      expectedSubscriberUpdatedAt: CONFIRMED_AT,
      subscriberUpdate: bouncedSubscriber(),
    });

    expect(result).toBe(WebhookProcessingResult.PROCESSED);
    const eventCreateArgs = eventCreateMany.mock.calls[0]![0];
    const deliveryUpdateArgs = deliveryUpdateMany.mock.calls[0]![0];
    const subscriberUpdateArgs = subscriberUpdateMany.mock.calls[0]![0];
    const eventUpdateArgs = eventUpdate.mock.calls[0]![0];
    expect(eventCreateArgs.data).toMatchObject({ providerEventId: 'event-provider-id' });
    expect(eventCreateArgs.skipDuplicates).toBe(true);
    expect(deliveryUpdateArgs.data).toMatchObject({ status: PrismaEmailDeliveryStatus.BOUNCED });
    expect(deliveryUpdateArgs.where).toMatchObject({ id: DELIVERY_ID });
    expect(subscriberUpdateArgs.data).toMatchObject({ status: PrismaSubscriberStatus.BOUNCED });
    expect(subscriberUpdateArgs.where).toEqual({ id: SUBSCRIBER_ID, updatedAt: CONFIRMED_AT });
    expect(eventUpdateArgs.where).toEqual({ providerEventId: 'event-provider-id' });
  });

  it('reconhece a repetição do mesmo evento pelo hash do payload', async () => {
    eventCreateMany.mockResolvedValueOnce({ count: 0 });
    eventFindUnique.mockResolvedValueOnce({ payloadHash: 'a'.repeat(64) });

    await expect(
      repository.process({
        deliveryId: null,
        deliveryUpdate: null,
        event: event(),
        expectedSubscriberUpdatedAt: null,
        subscriberUpdate: null,
      }),
    ).resolves.toBe(WebhookProcessingResult.DUPLICATE);
    expect(deliveryUpdateMany).not.toHaveBeenCalled();
    expect(eventUpdate).not.toHaveBeenCalled();
  });

  it('detecta reutilização do identificador com payload divergente', async () => {
    eventCreateMany.mockResolvedValueOnce({ count: 0 });
    eventFindUnique.mockResolvedValueOnce({ payloadHash: 'c'.repeat(64) });

    await expect(
      repository.process({
        deliveryId: null,
        deliveryUpdate: null,
        event: event(),
        expectedSubscriberUpdatedAt: null,
        subscriberUpdate: null,
      }),
    ).resolves.toBe(WebhookProcessingResult.CONFLICT);
  });

  it('registra como processado sem alterar o assinante quando o evento é antigo', async () => {
    deliveryUpdateMany.mockResolvedValueOnce({ count: 0 });

    await expect(
      repository.process({
        deliveryId: DELIVERY_ID,
        deliveryUpdate: bouncedDelivery(),
        event: event(),
        expectedSubscriberUpdatedAt: CONFIRMED_AT,
        subscriberUpdate: bouncedSubscriber(),
      }),
    ).resolves.toBe(WebhookProcessingResult.STALE);
    expect(subscriberUpdateMany).not.toHaveBeenCalled();
    expect(eventUpdate).toHaveBeenCalledTimes(1);
  });
});
