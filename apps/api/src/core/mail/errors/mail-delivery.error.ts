export interface MailDeliveryErrorOptions {
  cause?: unknown;
  providerCode: string;
  retryable: boolean;
  statusCode: number | null;
}

export class MailDeliveryError extends Error {
  readonly providerCode: string;
  readonly retryable: boolean;
  readonly statusCode: number | null;

  constructor(options: MailDeliveryErrorOptions) {
    super('Email delivery failed.', { cause: options.cause });
    this.name = MailDeliveryError.name;
    this.providerCode = options.providerCode;
    this.retryable = options.retryable;
    this.statusCode = options.statusCode;
  }
}
