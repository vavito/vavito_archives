export const SUBSCRIBER_SUPPRESSED = 'SUBSCRIBER_SUPPRESSED';

export class SubscriberSuppressedError extends Error {
  readonly code = SUBSCRIBER_SUPPRESSED;

  constructor() {
    super('Complained subscriber cannot be reactivated.');
    this.name = SubscriberSuppressedError.name;
  }
}
