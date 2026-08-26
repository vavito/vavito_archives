export const EMAIL_DELIVERY_STATE_INCONSISTENT = 'EMAIL_DELIVERY_STATE_INCONSISTENT';

export class EmailDeliveryStateInconsistentError extends Error {
  readonly code = EMAIL_DELIVERY_STATE_INCONSISTENT;

  constructor() {
    super('Email delivery state is inconsistent.');
    this.name = EmailDeliveryStateInconsistentError.name;
  }
}
