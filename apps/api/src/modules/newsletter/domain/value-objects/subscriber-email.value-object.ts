import { SubscriberEmailInvalidError } from '@api/modules/newsletter/domain/errors/subscriber-email-invalid.error';

export const MAX_SUBSCRIBER_EMAIL_LENGTH = 320;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class SubscriberEmail {
  private constructor(readonly value: string) {}

  static create(value: string): SubscriberEmail {
    const normalized = value.trim().toLowerCase();

    if (normalized.length > MAX_SUBSCRIBER_EMAIL_LENGTH || !emailPattern.test(normalized)) {
      throw new SubscriberEmailInvalidError();
    }

    return new SubscriberEmail(normalized);
  }

  equals(other: SubscriberEmail): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
