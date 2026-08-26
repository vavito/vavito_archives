export const CONTACT_MESSAGE_STATE_INCONSISTENT = 'CONTACT_MESSAGE_STATE_INCONSISTENT';

export class ContactMessageStateInconsistentError extends Error {
  readonly code = CONTACT_MESSAGE_STATE_INCONSISTENT;

  constructor() {
    super('Contact message state is inconsistent with its lifecycle dates.');
    this.name = ContactMessageStateInconsistentError.name;
  }
}
