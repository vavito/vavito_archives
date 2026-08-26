export const WEBHOOK_PAYLOAD_INVALID = 'WEBHOOK_PAYLOAD_INVALID';

export class MailWebhookPayloadInvalidError extends Error {
  readonly code = WEBHOOK_PAYLOAD_INVALID;

  constructor() {
    super('Verified mail webhook payload is invalid.');
    this.name = MailWebhookPayloadInvalidError.name;
  }
}
