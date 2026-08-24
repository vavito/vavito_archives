export const SUBSCRIBER_CONFIRMATION_TOKEN_INVALID = 'SUBSCRIBER_CONFIRMATION_TOKEN_INVALID';

export class SubscriberConfirmationTokenInvalidError extends Error {
  readonly code = SUBSCRIBER_CONFIRMATION_TOKEN_INVALID;

  constructor() {
    super('Subscriber confirmation token is invalid.');
    this.name = SubscriberConfirmationTokenInvalidError.name;
  }
}
