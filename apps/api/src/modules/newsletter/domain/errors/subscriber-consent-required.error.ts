export const SUBSCRIBER_CONSENT_REQUIRED = 'SUBSCRIBER_CONSENT_REQUIRED';

export class SubscriberConsentRequiredError extends Error {
  readonly code = SUBSCRIBER_CONSENT_REQUIRED;

  constructor() {
    super('Subscriber consent source and timestamp are required.');
    this.name = SubscriberConsentRequiredError.name;
  }
}
