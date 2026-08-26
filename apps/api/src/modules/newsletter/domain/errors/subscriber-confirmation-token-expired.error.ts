export const SUBSCRIBER_CONFIRMATION_TOKEN_EXPIRED = 'SUBSCRIBER_CONFIRMATION_TOKEN_EXPIRED';

export class SubscriberConfirmationTokenExpiredError extends Error {
  readonly code = SUBSCRIBER_CONFIRMATION_TOKEN_EXPIRED;

  constructor() {
    super('Subscriber confirmation token has expired.');
    this.name = SubscriberConfirmationTokenExpiredError.name;
  }
}
