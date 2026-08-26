import { EmailDeliveryStatus } from '@api/modules/newsletter/domain/enums/email-delivery-status.enum';
import { EmailDeliveryEventInvalidError } from '@api/modules/newsletter/domain/errors/email-delivery-event-invalid.error';
import { EmailDeliveryStateInconsistentError } from '@api/modules/newsletter/domain/errors/email-delivery-state-inconsistent.error';

export interface RestoreEmailDeliveryProps {
  campaignId: string;
  createdAt: Date;
  failureCode: string | null;
  failureReason: string | null;
  id: string;
  lastEventAt: Date | null;
  providerEmailId: string | null;
  status: EmailDeliveryStatus;
  subscriberId: string;
  updatedAt: Date;
}

export interface ApplyEmailDeliveryEventProps {
  failureCode: string | null;
  failureReason: string | null;
  occurredAt: Date;
  status: EmailDeliveryStatus;
}

function cloneDate(value: Date): Date {
  return new Date(value.getTime());
}

function cloneNullableDate(value: Date | null): Date | null {
  return value ? cloneDate(value) : null;
}

function validDate(value: Date): boolean {
  return Number.isFinite(value.getTime());
}

export class EmailDelivery {
  private constructor(private readonly props: RestoreEmailDeliveryProps) {}

  static restore(props: RestoreEmailDeliveryProps): EmailDelivery {
    const delivery = new EmailDelivery({
      ...props,
      createdAt: cloneDate(props.createdAt),
      lastEventAt: cloneNullableDate(props.lastEventAt),
      updatedAt: cloneDate(props.updatedAt),
    });
    delivery.ensureStateIsConsistent();
    return delivery;
  }

  get campaignId(): string {
    return this.props.campaignId;
  }

  get createdAt(): Date {
    return cloneDate(this.props.createdAt);
  }

  get failureCode(): string | null {
    return this.props.failureCode;
  }

  get failureReason(): string | null {
    return this.props.failureReason;
  }

  get id(): string {
    return this.props.id;
  }

  get lastEventAt(): Date | null {
    return cloneNullableDate(this.props.lastEventAt);
  }

  get providerEmailId(): string | null {
    return this.props.providerEmailId;
  }

  get status(): EmailDeliveryStatus {
    return this.props.status;
  }

  get subscriberId(): string {
    return this.props.subscriberId;
  }

  get updatedAt(): Date {
    return cloneDate(this.props.updatedAt);
  }

  applyProviderEvent(event: ApplyEmailDeliveryEventProps): boolean {
    this.ensureEventIsValid(event);

    if (this.props.lastEventAt && event.occurredAt <= this.props.lastEventAt) return false;
    if (this.props.status === EmailDeliveryStatus.COMPLAINED) return false;
    if (
      (this.props.status === EmailDeliveryStatus.BOUNCED ||
        this.props.status === EmailDeliveryStatus.SUPPRESSED) &&
      event.status !== EmailDeliveryStatus.COMPLAINED
    ) {
      return false;
    }

    this.props.failureCode = event.failureCode;
    this.props.failureReason = event.failureReason;
    this.props.lastEventAt = cloneDate(event.occurredAt);
    this.props.status = event.status;
    this.props.updatedAt = cloneDate(
      event.occurredAt > this.props.updatedAt ? event.occurredAt : this.props.updatedAt,
    );
    return true;
  }

  private ensureEventIsValid(event: ApplyEmailDeliveryEventProps): void {
    const failureIsValid =
      event.status === EmailDeliveryStatus.DELIVERED
        ? event.failureCode === null && event.failureReason === null
        : event.failureCode !== null &&
          event.failureCode.length <= 100 &&
          event.failureReason !== null;

    if (
      !validDate(event.occurredAt) ||
      event.occurredAt < this.props.createdAt ||
      !failureIsValid
    ) {
      throw new EmailDeliveryEventInvalidError();
    }
  }

  private ensureStateIsConsistent(): void {
    const datesAreValid =
      validDate(this.props.createdAt) &&
      validDate(this.props.updatedAt) &&
      (!this.props.lastEventAt || validDate(this.props.lastEventAt)) &&
      this.props.updatedAt >= this.props.createdAt &&
      (!this.props.lastEventAt ||
        (this.props.lastEventAt >= this.props.createdAt &&
          this.props.lastEventAt <= this.props.updatedAt));
    const providerIdIsPresent =
      this.props.status === EmailDeliveryStatus.QUEUED ||
      this.props.status === EmailDeliveryStatus.FAILED ||
      Boolean(this.props.providerEmailId);

    if (!datesAreValid || !providerIdIsPresent) {
      throw new EmailDeliveryStateInconsistentError();
    }
  }
}
