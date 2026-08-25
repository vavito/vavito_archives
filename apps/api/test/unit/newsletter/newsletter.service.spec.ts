import { Logger } from '@nestjs/common';

import type {
  MailService,
  NewsletterConfirmationNotification,
} from '@api/core/mail/services/mail.service';
import { ApplicationException } from '@api/core/http/exceptions/application.exception';
import { Subscriber } from '@api/modules/newsletter/domain/entities/subscriber.entity';
import { SubscriberConsentSource } from '@api/modules/newsletter/domain/enums/subscriber-consent-source.enum';
import { SubscriberStatus } from '@api/modules/newsletter/domain/enums/subscriber-status.enum';
import { SubscriberConsent } from '@api/modules/newsletter/domain/value-objects/subscriber-consent.value-object';
import { SubscriberEmail } from '@api/modules/newsletter/domain/value-objects/subscriber-email.value-object';
import { SubscriberTokenHash } from '@api/modules/newsletter/domain/value-objects/subscriber-token-hash.value-object';
import { SubscriberTokenInvalidException } from '@api/modules/newsletter/errors/subscriber-token-invalid.exception';
import { SUBSCRIPTION_ACCEPTED_MESSAGE } from '@api/modules/newsletter/newsletter.constants';
import type { SubscribersRepository } from '@api/modules/newsletter/repositories/subscribers.repository';
import { NewsletterService } from '@api/modules/newsletter/services/newsletter.service';
import type {
  GeneratedSubscriberToken,
  SubscriberTokenService,
} from '@api/modules/newsletter/services/subscriber-token.service';

const ID = '2813645a-8b74-4d1f-96c3-72cf3c594ad3';
const CREATED_AT = new Date('2026-08-23T10:00:00.000Z');
const NOW = new Date('2026-08-25T12:00:00.000Z');
const CONFIRMATION_RAW = 'A'.repeat(43);
const UNSUBSCRIBE_RAW = 'B'.repeat(43);
const CONFIRMATION_HASH = SubscriberTokenHash.create('a'.repeat(64));
const UNSUBSCRIBE_HASH = SubscriberTokenHash.create('b'.repeat(64));
const confirmation: GeneratedSubscriberToken = {
  hash: CONFIRMATION_HASH,
  raw: CONFIRMATION_RAW,
};
const unsubscribe: GeneratedSubscriberToken = {
  hash: UNSUBSCRIBE_HASH,
  raw: UNSUBSCRIBE_RAW,
};

function pendingSubscriber(expiresAt = new Date('2026-08-26T10:00:00.000Z')): Subscriber {
  return Subscriber.subscribe({
    confirmationExpiresAt: expiresAt,
    confirmationTokenHash: CONFIRMATION_HASH,
    consent: SubscriberConsent.create({
      consentedAt: CREATED_AT,
      source: SubscriberConsentSource.HOME,
    }),
    email: SubscriberEmail.create('leitor@example.com'),
    id: ID,
    now: CREATED_AT,
    unsubscribeTokenHash: UNSUBSCRIBE_HASH,
  });
}

function subscriberWithStatus(status: SubscriberStatus): Subscriber {
  const subscriber = pendingSubscriber();
  subscriber.confirm(CONFIRMATION_HASH, new Date('2026-08-23T11:00:00.000Z'));

  if (status === SubscriberStatus.UNSUBSCRIBED) {
    subscriber.unsubscribe(new Date('2026-08-23T12:00:00.000Z'));
  } else if (status === SubscriberStatus.BOUNCED) {
    subscriber.markBounced(new Date('2026-08-23T12:00:00.000Z'));
  } else if (status === SubscriberStatus.COMPLAINED) {
    subscriber.markComplained(new Date('2026-08-23T12:00:00.000Z'));
  }

  return subscriber;
}

describe('NewsletterService', () => {
  const createIfEmailAvailable = jest.fn<Promise<boolean>, [Subscriber]>();
  const findByConfirmationTokenHash = jest.fn<Promise<Subscriber | null>, [string]>();
  const findByEmail = jest.fn<Promise<Subscriber | null>, [string]>();
  const findByUnsubscribeTokenHash = jest.fn<Promise<Subscriber | null>, [string]>();
  const save = jest.fn<Promise<void>, [Subscriber]>();
  const generateConfirmation = jest.fn(() => confirmation);
  const hash = jest.fn((raw: string) =>
    raw === UNSUBSCRIBE_RAW ? UNSUBSCRIBE_HASH : CONFIRMATION_HASH,
  );
  const unsubscribeFor = jest.fn(() => unsubscribe);
  const sendNewsletterConfirmation = jest.fn<
    Promise<unknown>,
    [NewsletterConfirmationNotification]
  >();
  const repository = {
    createIfEmailAvailable,
    findByConfirmationTokenHash,
    findByEmail,
    findByUnsubscribeTokenHash,
    save,
  } as unknown as SubscribersRepository;
  const tokenService = {
    generateConfirmation,
    hash,
    unsubscribeFor,
  } as unknown as SubscriberTokenService;
  const mailService = { sendNewsletterConfirmation } as unknown as MailService;
  const service = new NewsletterService(repository, tokenService, mailService);
  const subscribeDto = {
    consent: true as const,
    email: 'leitor@example.com',
    source: SubscriberConsentSource.HOME,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers().setSystemTime(NOW);
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    findByEmail.mockResolvedValue(null);
    createIfEmailAvailable.mockResolvedValue(true);
    save.mockResolvedValue(undefined);
    sendNewsletterConfirmation.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('persiste PENDING antes de enviar confirmação e responde sem enumerar email', async () => {
    await expect(service.subscribe(subscribeDto)).resolves.toEqual({
      message: SUBSCRIPTION_ACCEPTED_MESSAGE,
    });
    const created = createIfEmailAvailable.mock.calls[0]?.[0];

    expect(created).toBeDefined();
    if (!created) throw new Error('Assinante não foi persistido pelo teste.');

    expect(created.status).toBe(SubscriberStatus.PENDING);
    expect(created.email.value).toBe('leitor@example.com');
    expect(created.confirmationExpiresAt).toEqual(new Date('2026-08-26T12:00:00.000Z'));
    expect(sendNewsletterConfirmation).toHaveBeenCalledWith({
      confirmationToken: CONFIRMATION_RAW,
      confirmationTokenHash: CONFIRMATION_HASH.value,
      recipient: 'leitor@example.com',
      subscriberId: created.id,
      unsubscribeToken: UNSUBSCRIBE_RAW,
    });
    expect(createIfEmailAvailable.mock.invocationCallOrder[0]).toBeLessThan(
      sendNewsletterConfirmation.mock.invocationCallOrder[0]!,
    );
  });

  it('mantém a resposta genérica quando uma criação concorrente já ocupou o email', async () => {
    createIfEmailAvailable.mockResolvedValueOnce(false);

    await expect(service.subscribe(subscribeDto)).resolves.toEqual({
      message: SUBSCRIPTION_ACCEPTED_MESSAGE,
    });
    expect(sendNewsletterConfirmation).not.toHaveBeenCalled();
  });

  it('renova confirmação de PENDING sem criar outro assinante', async () => {
    const subscriber = pendingSubscriber();
    findByEmail.mockResolvedValueOnce(subscriber);

    await service.subscribe({ ...subscribeDto, source: SubscriberConsentSource.FOOTER });

    expect(createIfEmailAvailable).not.toHaveBeenCalled();
    expect(save).toHaveBeenCalledWith(subscriber);
    expect(subscriber.confirmationTokenHash).toBe(CONFIRMATION_HASH);
    expect(subscriber.consent.source).toBe(SubscriberConsentSource.FOOTER);
    expect(sendNewsletterConfirmation).toHaveBeenCalledTimes(1);
  });

  it.each([SubscriberStatus.UNSUBSCRIBED, SubscriberStatus.BOUNCED])(
    'reativa %s com novo double opt-in',
    async (status) => {
      const subscriber = subscriberWithStatus(status);
      findByEmail.mockResolvedValueOnce(subscriber);

      await service.subscribe(subscribeDto);

      expect(subscriber.status).toBe(SubscriberStatus.PENDING);
      expect(save).toHaveBeenCalledWith(subscriber);
      expect(sendNewsletterConfirmation).toHaveBeenCalledTimes(1);
    },
  );

  it.each([SubscriberStatus.CONFIRMED, SubscriberStatus.COMPLAINED])(
    'não enumera nem envia email quando o endereço está em %s',
    async (status) => {
      findByEmail.mockResolvedValueOnce(subscriberWithStatus(status));

      await expect(service.subscribe(subscribeDto)).resolves.toEqual({
        message: SUBSCRIPTION_ACCEPTED_MESSAGE,
      });
      expect(save).not.toHaveBeenCalled();
      expect(sendNewsletterConfirmation).not.toHaveBeenCalled();
    },
  );

  it('não revela falha de entrega depois de persistir a inscrição', async () => {
    sendNewsletterConfirmation.mockRejectedValueOnce(new Error('Resend indisponível'));

    await expect(service.subscribe(subscribeDto)).resolves.toEqual({
      message: SUBSCRIPTION_ACCEPTED_MESSAGE,
    });
    expect(createIfEmailAvailable).toHaveBeenCalledTimes(1);
  });

  it('não atrasa a resposta pública enquanto o provedor processa o email', async () => {
    sendNewsletterConfirmation.mockImplementationOnce(() => new Promise(() => undefined));

    await expect(service.subscribe(subscribeDto)).resolves.toEqual({
      message: SUBSCRIPTION_ACCEPTED_MESSAGE,
    });
    expect(sendNewsletterConfirmation).toHaveBeenCalledTimes(1);
  });

  it('confirma token válido e persiste a transição', async () => {
    const subscriber = pendingSubscriber();
    findByConfirmationTokenHash.mockResolvedValueOnce(subscriber);

    await expect(service.confirm({ token: CONFIRMATION_RAW })).resolves.toEqual({
      message: 'Inscrição confirmada com sucesso.',
    });
    expect(subscriber.status).toBe(SubscriberStatus.CONFIRMED);
    expect(save).toHaveBeenCalledWith(subscriber);
  });

  it('distingue token de confirmação inválido e expirado', async () => {
    findByConfirmationTokenHash.mockResolvedValueOnce(null);
    await expect(service.confirm({ token: CONFIRMATION_RAW })).rejects.toBeInstanceOf(
      SubscriberTokenInvalidException,
    );

    const expired = pendingSubscriber(new Date('2026-08-24T10:00:00.000Z'));
    findByConfirmationTokenHash.mockResolvedValueOnce(expired);
    const result = service.confirm({ token: CONFIRMATION_RAW });

    await expect(result).rejects.toBeInstanceOf(ApplicationException);
    await expect(result).rejects.toMatchObject({ code: 'SUBSCRIBER_CONFIRMATION_TOKEN_EXPIRED' });
  });

  it('cancela token conhecido e mantém repetição ou token desconhecido idempotentes', async () => {
    const confirmed = subscriberWithStatus(SubscriberStatus.CONFIRMED);
    findByUnsubscribeTokenHash.mockResolvedValueOnce(confirmed);

    await service.unsubscribe({ token: UNSUBSCRIBE_RAW });
    expect(confirmed.status).toBe(SubscriberStatus.UNSUBSCRIBED);
    expect(save).toHaveBeenCalledWith(confirmed);

    save.mockClear();
    findByUnsubscribeTokenHash.mockResolvedValueOnce(confirmed).mockResolvedValueOnce(null);
    await expect(service.unsubscribe({ token: UNSUBSCRIBE_RAW })).resolves.toBeUndefined();
    await expect(service.unsubscribe({ token: UNSUBSCRIBE_RAW })).resolves.toBeUndefined();
    expect(save).not.toHaveBeenCalled();
  });
});
