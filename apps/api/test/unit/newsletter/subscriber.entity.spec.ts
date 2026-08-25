import { Subscriber } from '@api/modules/newsletter/domain/entities/subscriber.entity';
import { SubscriberConsentSource } from '@api/modules/newsletter/domain/enums/subscriber-consent-source.enum';
import { SubscriberStatus } from '@api/modules/newsletter/domain/enums/subscriber-status.enum';
import { InvalidSubscriberStatusTransitionError } from '@api/modules/newsletter/domain/errors/invalid-subscriber-status-transition.error';
import { SubscriberConfirmationTokenExpiredError } from '@api/modules/newsletter/domain/errors/subscriber-confirmation-token-expired.error';
import { SubscriberConfirmationTokenInvalidError } from '@api/modules/newsletter/domain/errors/subscriber-confirmation-token-invalid.error';
import { SubscriberNotEligibleError } from '@api/modules/newsletter/domain/errors/subscriber-not-eligible.error';
import { SubscriberStateInconsistentError } from '@api/modules/newsletter/domain/errors/subscriber-state-inconsistent.error';
import { SubscriberSuppressedError } from '@api/modules/newsletter/domain/errors/subscriber-suppressed.error';
import { SubscriberConsent } from '@api/modules/newsletter/domain/value-objects/subscriber-consent.value-object';
import { SubscriberEmail } from '@api/modules/newsletter/domain/value-objects/subscriber-email.value-object';
import { SubscriberTokenHash } from '@api/modules/newsletter/domain/value-objects/subscriber-token-hash.value-object';

const SUBSCRIBER_ID = '2813645a-8b74-4d1f-96c3-72cf3c594ad3';
const CREATED_AT = new Date('2026-08-24T12:00:00.000Z');
const EXPIRES_AT = new Date('2026-08-25T12:00:00.000Z');
const CONFIRMATION_HASH = SubscriberTokenHash.create('a'.repeat(64));
const OTHER_HASH = SubscriberTokenHash.create('b'.repeat(64));
const UNSUBSCRIBE_HASH = SubscriberTokenHash.create('c'.repeat(64));

function consent(
  consentedAt = CREATED_AT,
  source = SubscriberConsentSource.HOME,
): SubscriberConsent {
  return SubscriberConsent.create({ consentedAt, source });
}

function subscribe(): Subscriber {
  return Subscriber.subscribe({
    confirmationExpiresAt: EXPIRES_AT,
    confirmationTokenHash: CONFIRMATION_HASH,
    consent: consent(),
    email: SubscriberEmail.create('Leitor@Example.com'),
    id: SUBSCRIBER_ID,
    now: CREATED_AT,
    unsubscribeTokenHash: UNSUBSCRIBE_HASH,
  });
}

function confirmedSubscriber(): Subscriber {
  const subscriber = subscribe();
  subscriber.confirm(CONFIRMATION_HASH, new Date('2026-08-24T13:00:00.000Z'));
  return subscriber;
}

describe('Subscriber', () => {
  it('registra consentimento e inicia o double opt-in em PENDING', () => {
    const subscriber = subscribe();

    expect(subscriber.email.value).toBe('leitor@example.com');
    expect(subscriber.status).toBe(SubscriberStatus.PENDING);
    expect(subscriber.consent.source).toBe(SubscriberConsentSource.HOME);
    expect(subscriber.consent.consentedAt).toEqual(CREATED_AT);
    expect(subscriber.confirmationTokenHash).toBe(CONFIRMATION_HASH);
    expect(subscriber.confirmationExpiresAt).toEqual(EXPIRES_AT);
    expect(subscriber.isEligibleForCampaign).toBe(false);
  });

  it('confirma token válido e remove os dados temporários de confirmação', () => {
    const subscriber = subscribe();
    const confirmedAt = new Date('2026-08-24T13:00:00.000Z');

    subscriber.confirm(CONFIRMATION_HASH, confirmedAt);

    expect(subscriber.status).toBe(SubscriberStatus.CONFIRMED);
    expect(subscriber.confirmedAt).toEqual(confirmedAt);
    expect(subscriber.confirmationTokenHash).toBeNull();
    expect(subscriber.confirmationExpiresAt).toBeNull();
    expect(subscriber.isEligibleForCampaign).toBe(true);
    expect(() => subscriber.ensureEligibleForCampaign()).not.toThrow();
  });

  it('rejeita token de confirmação que não corresponde ao hash', () => {
    const subscriber = subscribe();

    expect(() => subscriber.confirm(OTHER_HASH, new Date('2026-08-24T13:00:00.000Z'))).toThrow(
      SubscriberConfirmationTokenInvalidError,
    );
    expect(subscriber.status).toBe(SubscriberStatus.PENDING);
  });

  it('rejeita token no instante de expiração', () => {
    const subscriber = subscribe();

    expect(() => subscriber.confirm(CONFIRMATION_HASH, EXPIRES_AT)).toThrow(
      SubscriberConfirmationTokenExpiredError,
    );
  });

  it('renova consentimento e token de uma inscrição pendente', () => {
    const subscriber = subscribe();
    const renewedAt = new Date('2026-08-24T14:00:00.000Z');
    const renewedExpiry = new Date('2026-08-25T14:00:00.000Z');

    subscriber.renewConfirmation({
      confirmationExpiresAt: renewedExpiry,
      confirmationTokenHash: OTHER_HASH,
      consent: consent(renewedAt, SubscriberConsentSource.FOOTER),
      now: renewedAt,
    });

    expect(subscriber.status).toBe(SubscriberStatus.PENDING);
    expect(subscriber.confirmationTokenHash).toBe(OTHER_HASH);
    expect(subscriber.confirmationExpiresAt).toEqual(renewedExpiry);
    expect(subscriber.consent.source).toBe(SubscriberConsentSource.FOOTER);
    expect(subscriber.updatedAt).toEqual(renewedAt);
  });

  it.each(['pending', 'confirmed'] as const)('cancela inscrição em estado %s', (state) => {
    const subscriber = state === 'pending' ? subscribe() : confirmedSubscriber();
    const unsubscribedAt = new Date('2026-08-24T14:00:00.000Z');

    subscriber.unsubscribe(unsubscribedAt);

    expect(subscriber.status).toBe(SubscriberStatus.UNSUBSCRIBED);
    expect(subscriber.unsubscribedAt).toEqual(unsubscribedAt);
    expect(subscriber.confirmationTokenHash).toBeNull();
    expect(subscriber.isEligibleForCampaign).toBe(false);
  });

  it('registra bounce somente para assinante confirmado', () => {
    const subscriber = confirmedSubscriber();
    const bouncedAt = new Date('2026-08-24T14:00:00.000Z');

    subscriber.markBounced(bouncedAt);

    expect(subscriber.status).toBe(SubscriberStatus.BOUNCED);
    expect(subscriber.bouncedAt).toEqual(bouncedAt);
    expect(() => subscriber.ensureEligibleForCampaign()).toThrow(SubscriberNotEligibleError);
  });

  it.each(['confirmed', 'bounced'] as const)(
    'registra reclamação a partir de %s e torna o estado terminal',
    (state) => {
      const subscriber = confirmedSubscriber();
      if (state === 'bounced') {
        subscriber.markBounced(new Date('2026-08-24T14:00:00.000Z'));
      }

      subscriber.markComplained(new Date('2026-08-24T15:00:00.000Z'));

      expect(subscriber.status).toBe(SubscriberStatus.COMPLAINED);
      expect(subscriber.complainedAt).toEqual(new Date('2026-08-24T15:00:00.000Z'));
      expect(() =>
        subscriber.resubscribe({
          confirmationExpiresAt: new Date('2026-08-26T16:00:00.000Z'),
          confirmationTokenHash: OTHER_HASH,
          consent: consent(new Date('2026-08-24T16:00:00.000Z')),
          now: new Date('2026-08-24T16:00:00.000Z'),
        }),
      ).toThrow(SubscriberSuppressedError);
    },
  );

  it.each(['unsubscribed', 'bounced'] as const)(
    'reativa %s como PENDING com novo consentimento e token',
    (state) => {
      const subscriber = confirmedSubscriber();
      if (state === 'unsubscribed') {
        subscriber.unsubscribe(new Date('2026-08-24T14:00:00.000Z'));
      } else {
        subscriber.markBounced(new Date('2026-08-24T14:00:00.000Z'));
      }
      const consentedAt = new Date('2026-08-24T16:00:00.000Z');
      const expiresAt = new Date('2026-08-25T16:00:00.000Z');

      subscriber.resubscribe({
        confirmationExpiresAt: expiresAt,
        confirmationTokenHash: OTHER_HASH,
        consent: consent(consentedAt, SubscriberConsentSource.ARTICLE),
        now: consentedAt,
      });

      expect(subscriber.status).toBe(SubscriberStatus.PENDING);
      expect(subscriber.consent.source).toBe(SubscriberConsentSource.ARTICLE);
      expect(subscriber.confirmationTokenHash).toBe(OTHER_HASH);
      expect(subscriber.confirmationExpiresAt).toEqual(expiresAt);
      expect(subscriber.confirmedAt).toBeNull();
      expect(subscriber.unsubscribedAt).toBeNull();
      expect(subscriber.bouncedAt).toBeNull();
    },
  );

  it.each([
    ['confirmar novamente', () => confirmedSubscriber().confirm(CONFIRMATION_HASH, new Date())],
    ['marcar PENDING como bounce', () => subscribe().markBounced(new Date())],
    [
      'reativar PENDING',
      () =>
        subscribe().resubscribe({
          confirmationExpiresAt: new Date(Date.now() + 60_000),
          confirmationTokenHash: OTHER_HASH,
          consent: consent(),
          now: new Date(),
        }),
    ],
  ] as const)('rejeita transição inválida ao %s', (_scenario, transition) => {
    expect(transition).toThrow(InvalidSubscriberStatusTransitionError);
  });

  it('aceita restauração de PENDING cujo token expirou sem mudar seu estado', () => {
    const updatedAt = new Date('2026-08-26T12:00:00.000Z');

    const subscriber = Subscriber.restore({
      bouncedAt: null,
      complainedAt: null,
      confirmationExpiresAt: EXPIRES_AT,
      confirmationTokenHash: CONFIRMATION_HASH,
      confirmedAt: null,
      consent: consent(),
      createdAt: CREATED_AT,
      email: SubscriberEmail.create('leitor@example.com'),
      id: SUBSCRIBER_ID,
      status: SubscriberStatus.PENDING,
      unsubscribedAt: null,
      unsubscribeTokenHash: UNSUBSCRIBE_HASH,
      updatedAt,
    });

    expect(subscriber.status).toBe(SubscriberStatus.PENDING);
  });

  it('rejeita restauração com campos incompatíveis com o estado', () => {
    expect(() =>
      Subscriber.restore({
        bouncedAt: null,
        complainedAt: null,
        confirmationExpiresAt: null,
        confirmationTokenHash: null,
        confirmedAt: null,
        consent: consent(),
        createdAt: CREATED_AT,
        email: SubscriberEmail.create('leitor@example.com'),
        id: SUBSCRIBER_ID,
        status: SubscriberStatus.CONFIRMED,
        unsubscribedAt: null,
        unsubscribeTokenHash: UNSUBSCRIBE_HASH,
        updatedAt: CREATED_AT,
      }),
    ).toThrow(SubscriberStateInconsistentError);
  });

  it('protege datas contra mutação externa', () => {
    const now = new Date(CREATED_AT);
    const subscriber = Subscriber.subscribe({
      confirmationExpiresAt: EXPIRES_AT,
      confirmationTokenHash: CONFIRMATION_HASH,
      consent: consent(now),
      email: SubscriberEmail.create('leitor@example.com'),
      id: SUBSCRIBER_ID,
      now,
      unsubscribeTokenHash: UNSUBSCRIBE_HASH,
    });

    now.setUTCFullYear(2030);
    const returnedCreatedAt = subscriber.createdAt;
    returnedCreatedAt.setUTCFullYear(2031);

    expect(subscriber.createdAt).toEqual(CREATED_AT);
  });
});
