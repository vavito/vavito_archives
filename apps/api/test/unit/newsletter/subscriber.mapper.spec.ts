import { SubscriberStatus as PrismaSubscriberStatus } from '@api/generated/prisma/client';
import { Subscriber } from '@api/modules/newsletter/domain/entities/subscriber.entity';
import { SubscriberConsentSource } from '@api/modules/newsletter/domain/enums/subscriber-consent-source.enum';
import { SubscriberStatus } from '@api/modules/newsletter/domain/enums/subscriber-status.enum';
import { SubscriberConsent } from '@api/modules/newsletter/domain/value-objects/subscriber-consent.value-object';
import { SubscriberEmail } from '@api/modules/newsletter/domain/value-objects/subscriber-email.value-object';
import { SubscriberTokenHash } from '@api/modules/newsletter/domain/value-objects/subscriber-token-hash.value-object';
import { SubscriberMapper } from '@api/modules/newsletter/mappers/subscriber.mapper';

const ID = '2813645a-8b74-4d1f-96c3-72cf3c594ad3';
const CREATED_AT = new Date('2026-08-25T10:00:00.000Z');
const EXPIRES_AT = new Date('2026-08-26T10:00:00.000Z');
const CONFIRMATION_HASH = 'a'.repeat(64);
const UNSUBSCRIBE_HASH = 'b'.repeat(64);

function pendingSubscriber(): Subscriber {
  return Subscriber.subscribe({
    confirmationExpiresAt: EXPIRES_AT,
    confirmationTokenHash: SubscriberTokenHash.create(CONFIRMATION_HASH),
    consent: SubscriberConsent.create({
      consentedAt: CREATED_AT,
      source: SubscriberConsentSource.ARTICLE,
    }),
    email: SubscriberEmail.create('Leitor@Example.com'),
    id: ID,
    now: CREATED_AT,
    unsubscribeTokenHash: SubscriberTokenHash.create(UNSUBSCRIBE_HASH),
  });
}

describe('SubscriberMapper', () => {
  it('mapeia inscrição pendente para persistência', () => {
    expect(SubscriberMapper.toPersistence(pendingSubscriber())).toEqual({
      bouncedAt: null,
      complainedAt: null,
      confirmationExpiresAt: EXPIRES_AT,
      confirmationTokenHash: CONFIRMATION_HASH,
      confirmedAt: null,
      consentedAt: CREATED_AT,
      consentSource: SubscriberConsentSource.ARTICLE,
      createdAt: CREATED_AT,
      email: 'leitor@example.com',
      id: ID,
      status: PrismaSubscriberStatus.PENDING,
      unsubscribedAt: null,
      unsubscribeTokenHash: UNSUBSCRIBE_HASH,
      updatedAt: CREATED_AT,
    });
  });

  it('restaura inscrição confirmada sem token temporário', () => {
    const confirmedAt = new Date('2026-08-25T11:00:00.000Z');
    const subscriber = SubscriberMapper.toDomain({
      bouncedAt: null,
      complainedAt: null,
      confirmationExpiresAt: null,
      confirmationTokenHash: null,
      confirmedAt,
      consentedAt: CREATED_AT,
      consentSource: SubscriberConsentSource.HOME,
      createdAt: CREATED_AT,
      email: 'leitor@example.com',
      id: ID,
      status: PrismaSubscriberStatus.CONFIRMED,
      unsubscribedAt: null,
      unsubscribeTokenHash: UNSUBSCRIBE_HASH,
      updatedAt: confirmedAt,
    });

    expect(subscriber.status).toBe(SubscriberStatus.CONFIRMED);
    expect(subscriber.confirmedAt).toEqual(confirmedAt);
    expect(subscriber.confirmationTokenHash).toBeNull();
  });

  it('mapeia somente campos mutáveis na atualização', () => {
    const subscriber = pendingSubscriber();
    subscriber.confirm(SubscriberTokenHash.create(CONFIRMATION_HASH), CREATED_AT);

    expect(SubscriberMapper.toUpdate(subscriber)).toMatchObject({
      confirmationExpiresAt: null,
      confirmationTokenHash: null,
      confirmedAt: CREATED_AT,
      status: PrismaSubscriberStatus.CONFIRMED,
    });
    expect(SubscriberMapper.toUpdate(subscriber)).not.toHaveProperty('email');
  });
});
