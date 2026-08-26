export const WEBHOOK_SIGNATURE_INVALID = 'WEBHOOK_SIGNATURE_INVALID';

export class MailWebhookSignatureInvalidError extends Error {
  readonly code = WEBHOOK_SIGNATURE_INVALID;

  constructor() {
    super('Mail webhook signature is missing or invalid.');
    this.name = MailWebhookSignatureInvalidError.name;
  }
}
