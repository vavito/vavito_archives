import { SubscriberStatus } from '@api/modules/newsletter/domain/enums/subscriber-status.enum';
import { InvalidSubscriberStatusTransitionError } from '@api/modules/newsletter/domain/errors/invalid-subscriber-status-transition.error';
import { SubscriberConfirmationTokenExpiredError } from '@api/modules/newsletter/domain/errors/subscriber-confirmation-token-expired.error';
import { SubscriberConfirmationTokenInvalidError } from '@api/modules/newsletter/domain/errors/subscriber-confirmation-token-invalid.error';
import { SubscriberConsentRequiredError } from '@api/modules/newsletter/domain/errors/subscriber-consent-required.error';
import { SubscriberNotEligibleError } from '@api/modules/newsletter/domain/errors/subscriber-not-eligible.error';
import { SubscriberStateInconsistentError } from '@api/modules/newsletter/domain/errors/subscriber-state-inconsistent.error';
import { SubscriberSuppressedError } from '@api/modules/newsletter/domain/errors/subscriber-suppressed.error';
import type { SubscriberConsent } from '@api/modules/newsletter/domain/value-objects/subscriber-consent.value-object';
import type { SubscriberEmail } from '@api/modules/newsletter/domain/value-objects/subscriber-email.value-object';
import type { SubscriberTokenHash } from '@api/modules/newsletter/domain/value-objects/subscriber-token-hash.value-object';

export interface SubscribeSubscriberProps {
  confirmationExpiresAt: Date;
  confirmationTokenHash: SubscriberTokenHash;
  consent: SubscriberConsent;
  email: SubscriberEmail;
  id: string;
  now: Date;
  unsubscribeTokenHash: SubscriberTokenHash;
}

export interface ResubscribeSubscriberProps {
  confirmationExpiresAt: Date;
  confirmationTokenHash: SubscriberTokenHash;
  consent: SubscriberConsent;
  now: Date;
}

export interface RestoreSubscriberProps {
  bouncedAt: Date | null;
  complainedAt: Date | null;
  confirmationExpiresAt: Date | null;
  confirmationTokenHash: SubscriberTokenHash | null;
  confirmedAt: Date | null;
  consent: SubscriberConsent;
  createdAt: Date;
  email: SubscriberEmail;
  id: string;
  status: SubscriberStatus;
  unsubscribedAt: Date | null;
  unsubscribeTokenHash: SubscriberTokenHash;
  updatedAt: Date;
}

function cloneDate(date: Date): Date {
  return new Date(date.getTime());
}

function cloneNullableDate(date: Date | null): Date | null {
  return date ? cloneDate(date) : null;
}

function validDate(date: Date): boolean {
  return Number.isFinite(date.getTime());
}

export class Subscriber {
  private constructor(private readonly props: RestoreSubscriberProps) {}

  static subscribe(props: SubscribeSubscriberProps): Subscriber {
    Subscriber.ensureNewConsentIsValid(props.consent, props.confirmationExpiresAt, props.now);

    return new Subscriber({
      bouncedAt: null,
      complainedAt: null,
      confirmationExpiresAt: cloneDate(props.confirmationExpiresAt),
      confirmationTokenHash: props.confirmationTokenHash,
      confirmedAt: null,
      consent: props.consent,
      createdAt: cloneDate(props.now),
      email: props.email,
      id: props.id,
      status: SubscriberStatus.PENDING,
      unsubscribedAt: null,
      unsubscribeTokenHash: props.unsubscribeTokenHash,
      updatedAt: cloneDate(props.now),
    });
  }

  static restore(props: RestoreSubscriberProps): Subscriber {
    const subscriber = new Subscriber({
      ...props,
      bouncedAt: cloneNullableDate(props.bouncedAt),
      complainedAt: cloneNullableDate(props.complainedAt),
      confirmationExpiresAt: cloneNullableDate(props.confirmationExpiresAt),
      confirmedAt: cloneNullableDate(props.confirmedAt),
      createdAt: cloneDate(props.createdAt),
      unsubscribedAt: cloneNullableDate(props.unsubscribedAt),
      updatedAt: cloneDate(props.updatedAt),
    });

    subscriber.ensureStateIsConsistent();

    return subscriber;
  }

  get bouncedAt(): Date | null {
    return cloneNullableDate(this.props.bouncedAt);
  }

  get complainedAt(): Date | null {
    return cloneNullableDate(this.props.complainedAt);
  }

  get confirmationExpiresAt(): Date | null {
    return cloneNullableDate(this.props.confirmationExpiresAt);
  }

  get confirmationTokenHash(): SubscriberTokenHash | null {
    return this.props.confirmationTokenHash;
  }

  get confirmedAt(): Date | null {
    return cloneNullableDate(this.props.confirmedAt);
  }

  get consent(): SubscriberConsent {
    return this.props.consent;
  }

  get createdAt(): Date {
    return cloneDate(this.props.createdAt);
  }

  get email(): SubscriberEmail {
    return this.props.email;
  }

  get id(): string {
    return this.props.id;
  }

  get isEligibleForCampaign(): boolean {
    return this.props.status === SubscriberStatus.CONFIRMED;
  }

  get status(): SubscriberStatus {
    return this.props.status;
  }

  get unsubscribedAt(): Date | null {
    return cloneNullableDate(this.props.unsubscribedAt);
  }

  get unsubscribeTokenHash(): SubscriberTokenHash {
    return this.props.unsubscribeTokenHash;
  }

  get updatedAt(): Date {
    return cloneDate(this.props.updatedAt);
  }

  confirm(tokenHash: SubscriberTokenHash, now: Date): void {
    this.ensureStatus('confirm', SubscriberStatus.PENDING);
    this.ensureTransitionDate(now);

    if (!this.props.confirmationTokenHash?.equals(tokenHash)) {
      throw new SubscriberConfirmationTokenInvalidError();
    }
    if (!this.props.confirmationExpiresAt || now >= this.props.confirmationExpiresAt) {
      throw new SubscriberConfirmationTokenExpiredError();
    }

    this.props.confirmationExpiresAt = null;
    this.props.confirmationTokenHash = null;
    this.props.confirmedAt = cloneDate(now);
    this.props.status = SubscriberStatus.CONFIRMED;
    this.props.updatedAt = cloneDate(now);
  }

  unsubscribe(now: Date): void {
    this.ensureStatus('unsubscribe', SubscriberStatus.PENDING, SubscriberStatus.CONFIRMED);
    this.ensureTransitionDate(now);

    this.props.confirmationExpiresAt = null;
    this.props.confirmationTokenHash = null;
    this.props.status = SubscriberStatus.UNSUBSCRIBED;
    this.props.unsubscribedAt = cloneDate(now);
    this.props.updatedAt = cloneDate(now);
  }

  markBounced(now: Date): void {
    this.ensureStatus('mark bounced', SubscriberStatus.CONFIRMED);
    this.ensureTransitionDate(now);

    this.props.bouncedAt = cloneDate(now);
    this.props.status = SubscriberStatus.BOUNCED;
    this.props.updatedAt = cloneDate(now);
  }

  markComplained(now: Date): void {
    this.ensureStatus('mark complained', SubscriberStatus.CONFIRMED, SubscriberStatus.BOUNCED);
    this.ensureTransitionDate(now);

    this.props.complainedAt = cloneDate(now);
    this.props.status = SubscriberStatus.COMPLAINED;
    this.props.updatedAt = cloneDate(now);
  }

  resubscribe(props: ResubscribeSubscriberProps): void {
    if (this.props.status === SubscriberStatus.COMPLAINED) {
      throw new SubscriberSuppressedError();
    }

    this.ensureStatus('resubscribe', SubscriberStatus.UNSUBSCRIBED, SubscriberStatus.BOUNCED);
    this.ensureTransitionDate(props.now);
    Subscriber.ensureNewConsentIsValid(props.consent, props.confirmationExpiresAt, props.now);

    this.props.bouncedAt = null;
    this.props.complainedAt = null;
    this.props.confirmationExpiresAt = cloneDate(props.confirmationExpiresAt);
    this.props.confirmationTokenHash = props.confirmationTokenHash;
    this.props.confirmedAt = null;
    this.props.consent = props.consent;
    this.props.status = SubscriberStatus.PENDING;
    this.props.unsubscribedAt = null;
    this.props.updatedAt = cloneDate(props.now);
  }

  ensureEligibleForCampaign(): void {
    if (!this.isEligibleForCampaign) {
      throw new SubscriberNotEligibleError();
    }
  }

  private static ensureNewConsentIsValid(
    consent: SubscriberConsent,
    confirmationExpiresAt: Date,
    now: Date,
  ): void {
    if (!validDate(now) || !validDate(confirmationExpiresAt) || consent.consentedAt > now) {
      throw new SubscriberConsentRequiredError();
    }
    if (confirmationExpiresAt <= now) {
      throw new SubscriberConfirmationTokenExpiredError();
    }
  }

  private ensureStateIsConsistent(): void {
    const lifecycleDates = [
      this.props.confirmedAt,
      this.props.unsubscribedAt,
      this.props.bouncedAt,
      this.props.complainedAt,
    ].filter((date): date is Date => date !== null);
    const consentedAt = this.props.consent.consentedAt;
    const datesAreConsistent =
      validDate(this.props.createdAt) &&
      validDate(this.props.updatedAt) &&
      validDate(consentedAt) &&
      (!this.props.confirmationExpiresAt || validDate(this.props.confirmationExpiresAt)) &&
      lifecycleDates.every(validDate) &&
      this.props.updatedAt >= this.props.createdAt &&
      consentedAt >= this.props.createdAt &&
      consentedAt <= this.props.updatedAt &&
      lifecycleDates.every((date) => date >= this.props.createdAt && date <= this.props.updatedAt);
    const pendingIsConsistent =
      this.props.status !== SubscriberStatus.PENDING ||
      (this.props.confirmationTokenHash !== null &&
        this.props.confirmationExpiresAt !== null &&
        this.props.confirmedAt === null &&
        this.props.unsubscribedAt === null &&
        this.props.bouncedAt === null &&
        this.props.complainedAt === null);
    const confirmedIsConsistent =
      this.props.status !== SubscriberStatus.CONFIRMED ||
      (this.confirmationIsCleared() &&
        this.props.confirmedAt !== null &&
        this.props.unsubscribedAt === null &&
        this.props.bouncedAt === null &&
        this.props.complainedAt === null);
    const unsubscribedIsConsistent =
      this.props.status !== SubscriberStatus.UNSUBSCRIBED ||
      (this.confirmationIsCleared() &&
        this.props.unsubscribedAt !== null &&
        this.props.bouncedAt === null &&
        this.props.complainedAt === null);
    const bouncedIsConsistent =
      this.props.status !== SubscriberStatus.BOUNCED ||
      (this.confirmationIsCleared() &&
        this.props.confirmedAt !== null &&
        this.props.unsubscribedAt === null &&
        this.props.bouncedAt !== null &&
        this.props.complainedAt === null);
    const complainedIsConsistent =
      this.props.status !== SubscriberStatus.COMPLAINED ||
      (this.confirmationIsCleared() &&
        this.props.confirmedAt !== null &&
        this.props.unsubscribedAt === null &&
        this.props.complainedAt !== null);

    if (
      !datesAreConsistent ||
      !pendingIsConsistent ||
      !confirmedIsConsistent ||
      !unsubscribedIsConsistent ||
      !bouncedIsConsistent ||
      !complainedIsConsistent
    ) {
      throw new SubscriberStateInconsistentError();
    }
  }

  private confirmationIsCleared(): boolean {
    return this.props.confirmationTokenHash === null && this.props.confirmationExpiresAt === null;
  }

  private ensureStatus(action: string, ...allowedStatuses: SubscriberStatus[]): void {
    if (!allowedStatuses.includes(this.props.status)) {
      throw new InvalidSubscriberStatusTransitionError(action, this.props.status);
    }
  }

  private ensureTransitionDate(now: Date): void {
    if (!validDate(now) || now < this.props.updatedAt) {
      throw new SubscriberStateInconsistentError();
    }
  }
}
