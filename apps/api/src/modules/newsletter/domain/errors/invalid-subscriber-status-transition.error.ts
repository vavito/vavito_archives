import type { SubscriberStatus } from '@api/modules/newsletter/domain/enums/subscriber-status.enum';

export const INVALID_SUBSCRIBER_STATUS_TRANSITION = 'INVALID_SUBSCRIBER_STATUS_TRANSITION';

export class InvalidSubscriberStatusTransitionError extends Error {
  readonly code = INVALID_SUBSCRIBER_STATUS_TRANSITION;

  constructor(action: string, status: SubscriberStatus) {
    super(`Cannot ${action} a subscriber with status ${status}.`);
    this.name = InvalidSubscriberStatusTransitionError.name;
  }
}
