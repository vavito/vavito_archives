import { randomUUID } from 'node:crypto';

import { MailService } from '@api/core/mail/services/mail.service';
import { Subscriber } from '@api/modules/newsletter/domain/entities/subscriber.entity';
import { SubscriberStatus } from '@api/modules/newsletter/domain/enums/subscriber-status.enum';
import { SubscriberConsentSource } from '@api/modules/newsletter/domain/enums/subscriber-consent-source.enum';
import { SubscriberConsent } from '@api/modules/newsletter/domain/value-objects/subscriber-consent.value-object';
import { SubscriberEmail } from '@api/modules/newsletter/domain/value-objects/subscriber-email.value-object';
import type { ConfirmSubscriptionDto } from '@api/modules/newsletter/dto/request/confirm-subscription.dto';
import type { SubscribeNewsletterDto } from '@api/modules/newsletter/dto/request/subscribe-newsletter.dto';
import type { UnsubscribeDto } from '@api/modules/newsletter/dto/request/unsubscribe.dto';
import type {
  SubscriptionAcceptedResponseDto,
  SubscriptionConfirmedResponseDto,
} from '@api/modules/newsletter/dto/response/subscription-response.dto';
import { throwSubscriberDomainException } from '@api/modules/newsletter/errors/subscriber-domain.exception';
import { SubscriberTokenInvalidException } from '@api/modules/newsletter/errors/subscriber-token-invalid.exception';
import {
  NEWSLETTER_CONFIRMATION_TOKEN_TTL_MS,
  SUBSCRIPTION_ACCEPTED_MESSAGE,
  SUBSCRIPTION_CONFIRMED_MESSAGE,
} from '@api/modules/newsletter/newsletter.constants';
import { SubscribersRepository } from '@api/modules/newsletter/repositories/subscribers.repository';
import {
  type GeneratedSubscriberToken,
  SubscriberTokenService,
} from '@api/modules/newsletter/services/subscriber-token.service';
import { Injectable, Logger } from '@nestjs/common';

const WELCOME_RETRY_WINDOW_MS = 24 * 60 * 60 * 1_000;

@Injectable()
export class NewsletterService {
  private readonly logger = new Logger(NewsletterService.name);

  constructor(
    private readonly subscribersRepository: SubscribersRepository,
    private readonly tokenService: SubscriberTokenService,
    private readonly mailService: MailService,
  ) {}

  async subscribe(dto: SubscribeNewsletterDto): Promise<SubscriptionAcceptedResponseDto> {
    const now = new Date();
    const email = this.executeDomainAction(() => SubscriberEmail.create(dto.email));
    const consent = this.executeDomainAction(() =>
      SubscriberConsent.create({ consentedAt: now, source: dto.source }),
    );
    const existing = await this.subscribersRepository.findByEmail(email.value);

    if (!existing) {
      await this.createSubscription(email, consent, now);
    } else if (existing.status === SubscriberStatus.PENDING) {
      await this.renewPendingSubscription(existing, consent, now);
    } else if (
      existing.status === SubscriberStatus.UNSUBSCRIBED ||
      existing.status === SubscriberStatus.BOUNCED
    ) {
      await this.resubscribe(existing, consent, now);
    }

    return { message: SUBSCRIPTION_ACCEPTED_MESSAGE };
  }

  async confirm(dto: ConfirmSubscriptionDto): Promise<SubscriptionConfirmedResponseDto> {
    const tokenHash = this.tokenService.hash(dto.token);
    const subscriber = await this.subscribersRepository.findByConfirmationTokenHash(
      tokenHash.value,
    );

    if (!subscriber) throw new SubscriberTokenInvalidException();

    this.executeDomainAction(() => subscriber.confirm(tokenHash, new Date()));
    await this.subscribersRepository.save(subscriber);

    return { message: SUBSCRIPTION_CONFIRMED_MESSAGE };
  }

  async subscribeConfirmedAccount(rawEmail: string): Promise<void> {
    const now = new Date();
    const email = this.executeDomainAction(() => SubscriberEmail.create(rawEmail));
    const existing = await this.subscribersRepository.findByEmail(email.value);

    if (existing) {
      if (existing.status === SubscriberStatus.PENDING) {
        this.executeDomainAction(() => existing.confirmVerifiedAccount(now));
        await this.subscribersRepository.save(existing);
        await this.sendWelcome(existing);
      } else if (this.shouldRetryWelcome(existing, now)) {
        await this.sendWelcome(existing);
      }
      return;
    }

    const id = randomUUID();
    const confirmation = this.tokenService.generateConfirmation();
    const subscriber = this.executeDomainAction(() => {
      const pending = Subscriber.subscribe({
        confirmationExpiresAt: this.confirmationExpiry(now),
        confirmationTokenHash: confirmation.hash,
        consent: SubscriberConsent.create({
          consentedAt: now,
          source: SubscriberConsentSource.ACCOUNT,
        }),
        email,
        id,
        now,
        unsubscribeTokenHash: this.tokenService.unsubscribeFor(id).hash,
      });
      pending.confirmVerifiedAccount(now);
      return pending;
    });

    const created = await this.subscribersRepository.createIfEmailAvailable(subscriber);
    if (created) await this.sendWelcome(subscriber);
  }

  async unsubscribe(dto: UnsubscribeDto): Promise<void> {
    const tokenHash = this.tokenService.hash(dto.token);
    const subscriber = await this.subscribersRepository.findByUnsubscribeTokenHash(tokenHash.value);

    if (
      !subscriber ||
      (subscriber.status !== SubscriberStatus.PENDING &&
        subscriber.status !== SubscriberStatus.CONFIRMED)
    ) {
      return;
    }

    this.executeDomainAction(() => subscriber.unsubscribe(new Date()));
    await this.subscribersRepository.save(subscriber);
  }

  private async createSubscription(
    email: SubscriberEmail,
    consent: SubscriberConsent,
    now: Date,
  ): Promise<void> {
    const id = randomUUID();
    const confirmation = this.tokenService.generateConfirmation();
    const unsubscribe = this.tokenService.unsubscribeFor(id);
    const subscriber = this.executeDomainAction(() =>
      Subscriber.subscribe({
        confirmationExpiresAt: this.confirmationExpiry(now),
        confirmationTokenHash: confirmation.hash,
        consent,
        email,
        id,
        now,
        unsubscribeTokenHash: unsubscribe.hash,
      }),
    );
    const created = await this.subscribersRepository.createIfEmailAvailable(subscriber);

    if (created) void this.sendConfirmation(subscriber, confirmation, unsubscribe.raw);
  }

  private async renewPendingSubscription(
    subscriber: Subscriber,
    consent: SubscriberConsent,
    now: Date,
  ): Promise<void> {
    const confirmation = this.tokenService.generateConfirmation();
    const unsubscribe = this.tokenService.unsubscribeFor(subscriber.id);

    this.executeDomainAction(() =>
      subscriber.renewConfirmation({
        confirmationExpiresAt: this.confirmationExpiry(now),
        confirmationTokenHash: confirmation.hash,
        consent,
        now,
      }),
    );
    await this.subscribersRepository.save(subscriber);
    void this.sendConfirmation(subscriber, confirmation, unsubscribe.raw);
  }

  private async resubscribe(
    subscriber: Subscriber,
    consent: SubscriberConsent,
    now: Date,
  ): Promise<void> {
    const confirmation = this.tokenService.generateConfirmation();
    const unsubscribe = this.tokenService.unsubscribeFor(subscriber.id);

    this.executeDomainAction(() =>
      subscriber.resubscribe({
        confirmationExpiresAt: this.confirmationExpiry(now),
        confirmationTokenHash: confirmation.hash,
        consent,
        now,
      }),
    );
    await this.subscribersRepository.save(subscriber);
    void this.sendConfirmation(subscriber, confirmation, unsubscribe.raw);
  }

  private async sendConfirmation(
    subscriber: Subscriber,
    confirmation: GeneratedSubscriberToken,
    unsubscribeToken: string,
  ): Promise<void> {
    try {
      await this.mailService.sendNewsletterConfirmation({
        confirmationToken: confirmation.raw,
        confirmationTokenHash: confirmation.hash.value,
        recipient: subscriber.email.value,
        subscriberId: subscriber.id,
        unsubscribeToken,
      });
    } catch (error) {
      this.logger.error(
        `Falha ao solicitar confirmação da inscrição ${subscriber.id}.`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  private async sendWelcome(subscriber: Subscriber): Promise<void> {
    try {
      await this.mailService.sendWelcomeNotification({
        recipient: subscriber.email.value,
        subscriberId: subscriber.id,
      });
    } catch (error) {
      this.logger.error(
        `Falha ao enviar boas-vindas ao assinante ${subscriber.id}.`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  private shouldRetryWelcome(subscriber: Subscriber, now: Date): boolean {
    const confirmedAt = subscriber.confirmedAt;

    return (
      subscriber.status === SubscriberStatus.CONFIRMED &&
      subscriber.consent.source === SubscriberConsentSource.ACCOUNT &&
      confirmedAt !== null &&
      now >= confirmedAt &&
      now.getTime() - confirmedAt.getTime() <= WELCOME_RETRY_WINDOW_MS
    );
  }

  private confirmationExpiry(now: Date): Date {
    return new Date(now.getTime() + NEWSLETTER_CONFIRMATION_TOKEN_TTL_MS);
  }

  private executeDomainAction<T>(action: () => T): T {
    try {
      return action();
    } catch (error) {
      throwSubscriberDomainException(error);
    }
  }
}
