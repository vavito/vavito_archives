import { SubscriberTokenHashInvalidError } from '@api/modules/newsletter/domain/errors/subscriber-token-hash-invalid.error';
import { SubscriberTokenHash } from '@api/modules/newsletter/domain/value-objects/subscriber-token-hash.value-object';

describe('SubscriberTokenHash', () => {
  it('aceita hashes hexadecimais e base64url sem alterar seu valor', () => {
    const hexadecimal = 'a'.repeat(64);
    const base64url = `${'A'.repeat(42)}-_`;

    expect(SubscriberTokenHash.create(hexadecimal).value).toBe(hexadecimal);
    expect(SubscriberTokenHash.create(base64url).value).toBe(base64url);
  });

  it.each(['token-bruto', 'a'.repeat(31), 'a'.repeat(129), `${'a'.repeat(31)}+`])(
    'rejeita hash inválido',
    (hash) => {
      expect(() => SubscriberTokenHash.create(hash)).toThrow(SubscriberTokenHashInvalidError);
    },
  );

  it('compara hashes pelo valor', () => {
    const value = 'a'.repeat(64);

    expect(SubscriberTokenHash.create(value).equals(SubscriberTokenHash.create(value))).toBe(true);
    expect(
      SubscriberTokenHash.create(value).equals(SubscriberTokenHash.create('b'.repeat(64))),
    ).toBe(false);
  });
});
