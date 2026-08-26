export const EMAIL_DELIVERY_EVENT_INVALID = 'EMAIL_DELIVERY_EVENT_INVALID';

export class EmailDeliveryEventInvalidError extends Error {
  readonly code = EMAIL_DELIVERY_EVENT_INVALID;

  constructor() {
    super('Email delivery event is invalid.');
    this.name = EmailDeliveryEventInvalidError.name;
  }
}
