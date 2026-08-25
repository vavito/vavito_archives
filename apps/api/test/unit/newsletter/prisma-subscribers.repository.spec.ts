import type { PrismaService } from '@api/core/database/prisma.service';
import type {
  NewsletterSubscriber as PrismaNewsletterSubscriber,
  Prisma,
} from '@api/generated/prisma/client';
import { SubscriberStatus as PrismaSubscriberStatus } from '@api/generated/prisma/client';
import { Subscriber } from '@api/modules/newsletter/domain/entities/subscriber.entity';
import { SubscriberConsentSource } from '@api/modules/newsletter/domain/enums/subscriber-consent-source.enum';
import { SubscriberConsent } from '@api/modules/newsletter/domain/value-objects/subscriber-consent.value-object';
import { SubscriberEmail } from '@api/modules/newsletter/domain/value-objects/subscriber-email.value-object';
import { SubscriberTokenHash } from '@api/modules/newsletter/domain/value-objects/subscriber-token-hash.value-object';
import { PrismaSubscribersRepository } from '@api/modules/newsletter/repositories/prisma-subscribers.repository';

const ID = '2813645a-8b74-4d1f-96c3-72cf3c594ad3';
const CREATED_AT = new Date('2026-08-25T10:00:00.000Z');
const EXPIRES_AT = new Date('2026-08-26T10:00:00.000Z');
const CONFIRMATION_HASH = 'a'.repeat(64);
const UNSUBSCRIBE_HASH = 'b'.repeat(64);

function subscriber(): Subscriber {
  return Subscriber.subscribe({
    confirmationExpiresAt: EXPIRES_AT,
    confirmationTokenHash: SubscriberTokenHash.create(CONFIRMATION_HASH),
    consent: SubscriberConsent.create({
      consentedAt: CREATED_AT,
      source: SubscriberConsentSource.HOME,
    }),
    email: SubscriberEmail.create('leitor@example.com'),
    id: ID,
    now: CREATED_AT,
    unsubscribeTokenHash: SubscriberTokenHash.create(UNSUBSCRIBE_HASH),
  });
}

function record(): PrismaNewsletterSubscriber {
  return {
    bouncedAt: null,
    complainedAt: null,
    confirmationExpiresAt: EXPIRES_AT,
    confirmationTokenHash: CONFIRMATION_HASH,
    confirmedAt: null,
    consentedAt: CREATED_AT,
    consentSource: SubscriberConsentSource.HOME,
    createdAt: CREATED_AT,
    email: 'leitor@example.com',
    id: ID,
    status: PrismaSubscriberStatus.PENDING,
    unsubscribedAt: null,
    unsubscribeTokenHash: UNSUBSCRIBE_HASH,
    updatedAt: CREATED_AT,
  };
}

describe('PrismaSubscribersRepository', () => {
  const createMany = jest.fn<
    Promise<Prisma.BatchPayload>,
    [Prisma.NewsletterSubscriberCreateManyArgs]
  >();
  const findUnique = jest.fn<
    Promise<PrismaNewsletterSubscriber | null>,
    [Prisma.NewsletterSubscriberFindUniqueArgs]
  >();
  const update = jest.fn<
    Promise<PrismaNewsletterSubscriber>,
    [Prisma.NewsletterSubscriberUpdateArgs]
  >();
  const prisma = {
    newsletterSubscriber: { createMany, findUnique, update },
  } as unknown as PrismaService;
  const repository = new PrismaSubscribersRepository(prisma);

  beforeEach(() => jest.clearAllMocks());

  it('cria de forma concorrente sem duplicar email', async () => {
    createMany.mockResolvedValueOnce({ count: 1 }).mockResolvedValueOnce({ count: 0 });

    await expect(repository.createIfEmailAvailable(subscriber())).resolves.toBe(true);
    await expect(repository.createIfEmailAvailable(subscriber())).resolves.toBe(false);
    expect(createMany.mock.calls[0]?.[0]).toMatchObject({
      data: { email: 'leitor@example.com', id: ID },
      skipDuplicates: true,
    });
  });

  it.each([
    ['email', 'leitor@example.com', { email: 'leitor@example.com' }],
    ['confirmação', CONFIRMATION_HASH, { confirmationTokenHash: CONFIRMATION_HASH }],
    ['cancelamento', UNSUBSCRIBE_HASH, { unsubscribeTokenHash: UNSUBSCRIBE_HASH }],
  ] as const)('consulta por %s único', async (kind, value, where) => {
    findUnique.mockResolvedValueOnce(record());
    const result =
      kind === 'email'
        ? repository.findByEmail(value)
        : kind === 'confirmação'
          ? repository.findByConfirmationTokenHash(value)
          : repository.findByUnsubscribeTokenHash(value);

    await expect(result).resolves.toMatchObject({ id: ID });
    expect(findUnique).toHaveBeenCalledWith({ where });
  });

  it('atualiza somente o assinante informado', async () => {
    const pending = subscriber();

    await repository.save(pending);

    expect(update.mock.calls[0]?.[0]).toMatchObject({
      data: { status: PrismaSubscriberStatus.PENDING },
      where: { id: ID },
    });
  });
});
