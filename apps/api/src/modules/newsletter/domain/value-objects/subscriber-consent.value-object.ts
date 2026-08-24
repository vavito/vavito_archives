import { SubscriberConsentSource } from '@api/modules/newsletter/domain/enums/subscriber-consent-source.enum';
import { SubscriberConsentRequiredError } from '@api/modules/newsletter/domain/errors/subscriber-consent-required.error';

export interface CreateSubscriberConsentProps {
  consentedAt: Date;
  source: SubscriberConsentSource;
}

function cloneDate(date: Date): Date {
  return new Date(date.getTime());
}

export class SubscriberConsent {
  private constructor(
    readonly source: SubscriberConsentSource,
    private readonly timestamp: Date,
  ) {}

  static create(props: CreateSubscriberConsentProps): SubscriberConsent {
    if (
      !Object.values(SubscriberConsentSource).includes(props.source) ||
      !Number.isFinite(props.consentedAt.getTime())
    ) {
      throw new SubscriberConsentRequiredError();
    }

    return new SubscriberConsent(props.source, cloneDate(props.consentedAt));
  }

  get consentedAt(): Date {
    return cloneDate(this.timestamp);
  }
}
