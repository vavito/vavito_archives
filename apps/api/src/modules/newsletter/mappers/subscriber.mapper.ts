import type {
  NewsletterSubscriber as PrismaNewsletterSubscriber,
  Prisma,
} from '@api/generated/prisma/client';
import { SubscriberStatus as PrismaSubscriberStatus } from '@api/generated/prisma/client';
import { Subscriber } from '@api/modules/newsletter/domain/entities/subscriber.entity';
import type { SubscriberConsentSource } from '@api/modules/newsletter/domain/enums/subscriber-consent-source.enum';
import { SubscriberStatus } from '@api/modules/newsletter/domain/enums/subscriber-status.enum';
import { SubscriberConsent } from '@api/modules/newsletter/domain/value-objects/subscriber-consent.value-object';
import { SubscriberEmail } from '@api/modules/newsletter/domain/value-objects/subscriber-email.value-object';
import { SubscriberTokenHash } from '@api/modules/newsletter/domain/value-objects/subscriber-token-hash.value-object';

const domainStatusByPrisma: Readonly<Record<PrismaSubscriberStatus, SubscriberStatus>> = {
  [PrismaSubscriberStatus.BOUNCED]: SubscriberStatus.BOUNCED,
  [PrismaSubscriberStatus.COMPLAINED]: SubscriberStatus.COMPLAINED,
  [PrismaSubscriberStatus.CONFIRMED]: SubscriberStatus.CONFIRMED,
  [PrismaSubscriberStatus.PENDING]: SubscriberStatus.PENDING,
  [PrismaSubscriberStatus.UNSUBSCRIBED]: SubscriberStatus.UNSUBSCRIBED,
};

const prismaStatusByDomain: Readonly<Record<SubscriberStatus, PrismaSubscriberStatus>> = {
  [SubscriberStatus.BOUNCED]: PrismaSubscriberStatus.BOUNCED,
  [SubscriberStatus.COMPLAINED]: PrismaSubscriberStatus.COMPLAINED,
  [SubscriberStatus.CONFIRMED]: PrismaSubscriberStatus.CONFIRMED,
  [SubscriberStatus.PENDING]: PrismaSubscriberStatus.PENDING,
  [SubscriberStatus.UNSUBSCRIBED]: PrismaSubscriberStatus.UNSUBSCRIBED,
};

function persistenceFields(subscriber: Subscriber) {
  return {
    bouncedAt: subscriber.bouncedAt,
    complainedAt: subscriber.complainedAt,
    confirmationExpiresAt: subscriber.confirmationExpiresAt,
    confirmationTokenHash: subscriber.confirmationTokenHash?.value ?? null,
    confirmedAt: subscriber.confirmedAt,
    consentedAt: subscriber.consent.consentedAt,
    consentSource: subscriber.consent.source,
    status: prismaStatusByDomain[subscriber.status],
    unsubscribedAt: subscriber.unsubscribedAt,
    unsubscribeTokenHash: subscriber.unsubscribeTokenHash.value,
    updatedAt: subscriber.updatedAt,
  };
}

export class SubscriberMapper {
  static toDomain(record: PrismaNewsletterSubscriber): Subscriber {
    return Subscriber.restore({
      bouncedAt: record.bouncedAt,
      complainedAt: record.complainedAt,
      confirmationExpiresAt: record.confirmationExpiresAt,
      confirmationTokenHash: record.confirmationTokenHash
        ? SubscriberTokenHash.create(record.confirmationTokenHash)
        : null,
      confirmedAt: record.confirmedAt,
      consent: SubscriberConsent.create({
        consentedAt: record.consentedAt,
        source: record.consentSource as SubscriberConsentSource,
      }),
      createdAt: record.createdAt,
      email: SubscriberEmail.create(record.email),
      id: record.id,
      status: domainStatusByPrisma[record.status],
      unsubscribedAt: record.unsubscribedAt,
      unsubscribeTokenHash: SubscriberTokenHash.create(record.unsubscribeTokenHash),
      updatedAt: record.updatedAt,
    });
  }

  static toPersistence(subscriber: Subscriber): Prisma.NewsletterSubscriberCreateManyInput {
    return {
      ...persistenceFields(subscriber),
      createdAt: subscriber.createdAt,
      email: subscriber.email.value,
      id: subscriber.id,
    };
  }

  static toUpdate(subscriber: Subscriber): Prisma.NewsletterSubscriberUncheckedUpdateInput {
    return persistenceFields(subscriber);
  }
}
