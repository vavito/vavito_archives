import { SubscriberEmailInvalidError } from '@api/modules/newsletter/domain/errors/subscriber-email-invalid.error';
import {
  MAX_SUBSCRIBER_EMAIL_LENGTH,
  SubscriberEmail,
} from '@api/modules/newsletter/domain/value-objects/subscriber-email.value-object';

describe('SubscriberEmail', () => {
  it('normaliza espaços e caixa do email', () => {
    const email = SubscriberEmail.create('  Leitor@Example.COM  ');

    expect(email.value).toBe('leitor@example.com');
    expect(email.toString()).toBe('leitor@example.com');
  });

  it.each(['', 'sem-arroba.example.com', '@example.com', 'leitor@', 'leitor @example.com'])(
    'rejeita o email inválido %p',
    (email) => {
      expect(() => SubscriberEmail.create(email)).toThrow(SubscriberEmailInvalidError);
    },
  );

  it('rejeita email acima do limite persistido', () => {
    const email = `${'a'.repeat(MAX_SUBSCRIBER_EMAIL_LENGTH)}@example.com`;

    expect(() => SubscriberEmail.create(email)).toThrow(SubscriberEmailInvalidError);
  });

  it('compara emails pelo valor normalizado', () => {
    expect(
      SubscriberEmail.create('LEITOR@example.com').equals(
        SubscriberEmail.create('leitor@example.com'),
      ),
    ).toBe(true);
  });
});
