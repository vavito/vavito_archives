export const SUBSCRIBER_EMAIL_INVALID = 'SUBSCRIBER_EMAIL_INVALID';

export class SubscriberEmailInvalidError extends Error {
  readonly code = SUBSCRIBER_EMAIL_INVALID;

  constructor() {
    super('Subscriber email is invalid.');
    this.name = SubscriberEmailInvalidError.name;
  }
}
