import type { ApplicationConfig } from '@api/core/config/app.config';
import { SUBSCRIBER_RAW_TOKEN_LENGTH } from '@api/modules/newsletter/newsletter.constants';
import { SubscriberTokenService } from '@api/modules/newsletter/services/subscriber-token.service';
import { ConfigService } from '@nestjs/config';

function service(secret = 'newsletter-test-secret-with-at-least-32-characters') {
  const config = new ConfigService<ApplicationConfig, true>({
    security: {
      newsletterTokenSecret: secret,
      revalidationSecret: 'unused',
      viewFingerprintSecret: 'unused',
    },
  } as ApplicationConfig);

  return new SubscriberTokenService(config);
}

describe('SubscriberTokenService', () => {
  it('gera confirmação opaca de 32 bytes e hash SHA-256', () => {
    const tokenService = service();
    const first = tokenService.generateConfirmation();
    const second = tokenService.generateConfirmation();

    expect(first.raw).toHaveLength(SUBSCRIBER_RAW_TOKEN_LENGTH);
    expect(first.raw).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(first.hash.value).toHaveLength(64);
    expect(first.hash).toEqual(tokenService.hash(first.raw));
    expect(second.raw).not.toBe(first.raw);
  });

  it('reproduz o token de cancelamento para o mesmo assinante', () => {
    const tokenService = service();
    const first = tokenService.unsubscribeFor('subscriber-id');
    const second = tokenService.unsubscribeFor('subscriber-id');

    expect(first).toEqual(second);
    expect(first.raw).toHaveLength(SUBSCRIBER_RAW_TOKEN_LENGTH);
    expect(tokenService.unsubscribeFor('other-subscriber').raw).not.toBe(first.raw);
  });

  it('isola tokens de cancelamento quando o segredo muda', () => {
    expect(service('a'.repeat(32)).unsubscribeFor('subscriber-id').raw).not.toBe(
      service('b'.repeat(32)).unsubscribeFor('subscriber-id').raw,
    );
  });
});
