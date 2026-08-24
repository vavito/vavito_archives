import { SubscriberTokenHashInvalidError } from '@api/modules/newsletter/domain/errors/subscriber-token-hash-invalid.error';

export const MIN_SUBSCRIBER_TOKEN_HASH_LENGTH = 32;
export const MAX_SUBSCRIBER_TOKEN_HASH_LENGTH = 128;

const tokenHashPattern = /^[A-Za-z0-9_-]+$/;

export class SubscriberTokenHash {
  private constructor(readonly value: string) {}

  static create(value: string): SubscriberTokenHash {
    const normalized = value.trim();

    if (
      normalized.length < MIN_SUBSCRIBER_TOKEN_HASH_LENGTH ||
      normalized.length > MAX_SUBSCRIBER_TOKEN_HASH_LENGTH ||
      !tokenHashPattern.test(normalized)
    ) {
      throw new SubscriberTokenHashInvalidError();
    }

    return new SubscriberTokenHash(normalized);
  }

  equals(other: SubscriberTokenHash): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
