export const CONTACT_MESSAGE_CONTENT_INVALID = 'CONTACT_MESSAGE_CONTENT_INVALID';

export class ContactMessageContentInvalidError extends Error {
  readonly code = CONTACT_MESSAGE_CONTENT_INVALID;

  constructor() {
    super('Contact message fields are invalid.');
    this.name = ContactMessageContentInvalidError.name;
  }
}
