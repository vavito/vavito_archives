export const SUBSCRIBER_STATE_INCONSISTENT = 'SUBSCRIBER_STATE_INCONSISTENT';

export class SubscriberStateInconsistentError extends Error {
  readonly code = SUBSCRIBER_STATE_INCONSISTENT;

  constructor() {
    super('Subscriber state is inconsistent with its lifecycle timestamps.');
    this.name = SubscriberStateInconsistentError.name;
  }
}
