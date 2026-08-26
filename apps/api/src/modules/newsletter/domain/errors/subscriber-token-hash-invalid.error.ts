export const SUBSCRIBER_TOKEN_HASH_INVALID = 'SUBSCRIBER_TOKEN_HASH_INVALID';

export class SubscriberTokenHashInvalidError extends Error {
  readonly code = SUBSCRIBER_TOKEN_HASH_INVALID;

  constructor() {
    super('Subscriber token hash is invalid.');
    this.name = SubscriberTokenHashInvalidError.name;
  }
}
