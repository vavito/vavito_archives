import type { ContactMessageStatus } from '@api/modules/contact/domain/enums/contact-message-status.enum';

export const INVALID_CONTACT_MESSAGE_STATUS_TRANSITION =
  'INVALID_CONTACT_MESSAGE_STATUS_TRANSITION';

export class InvalidContactMessageStatusTransitionError extends Error {
  readonly code = INVALID_CONTACT_MESSAGE_STATUS_TRANSITION;

  constructor(action: string, status: ContactMessageStatus) {
    super(`Cannot ${action} a contact message with status ${status}.`);
    this.name = InvalidContactMessageStatusTransitionError.name;
  }
}
