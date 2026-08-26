export const SUBSCRIBER_NOT_ELIGIBLE = 'SUBSCRIBER_NOT_ELIGIBLE';

export class SubscriberNotEligibleError extends Error {
  readonly code = SUBSCRIBER_NOT_ELIGIBLE;

  constructor() {
    super('Subscriber is not eligible for newsletter campaigns.');
    this.name = SubscriberNotEligibleError.name;
  }
}
