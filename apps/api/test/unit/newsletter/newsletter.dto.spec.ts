import { ConfirmSubscriptionDto } from '@api/modules/newsletter/dto/request/confirm-subscription.dto';
import { SubscribeNewsletterDto } from '@api/modules/newsletter/dto/request/subscribe-newsletter.dto';
import { UnsubscribeDto } from '@api/modules/newsletter/dto/request/unsubscribe.dto';
import { SubscriberConsentSource } from '@api/modules/newsletter/domain/enums/subscriber-consent-source.enum';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

describe('DTOs de Newsletter', () => {
  it('normaliza e aceita inscrição com consentimento explícito', async () => {
    const dto = plainToInstance(SubscribeNewsletterDto, {
      consent: true,
      email: '  Leitor@Example.COM ',
      source: SubscriberConsentSource.FOOTER,
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
    expect(dto.email).toBe('leitor@example.com');
  });

  it('rejeita inscrição sem consentimento explícito', async () => {
    const dto = plainToInstance(SubscribeNewsletterDto, {
      consent: false,
      email: 'leitor@example.com',
      source: SubscriberConsentSource.HOME,
    });

    await expect(validate(dto)).resolves.not.toHaveLength(0);
  });

  it.each([
    { consent: true, email: 'email-invalido', source: SubscriberConsentSource.HOME },
    { consent: true, email: 'leitor@example.com', source: 'SIDEBAR' },
  ])('rejeita inscrição inválida', async (payload) => {
    await expect(
      validate(plainToInstance(SubscribeNewsletterDto, payload)),
    ).resolves.not.toHaveLength(0);
  });

  it('aceita somente tokens opacos com 32 bytes em base64url', async () => {
    const token = 'A'.repeat(43);

    await expect(
      validate(plainToInstance(ConfirmSubscriptionDto, { token })),
    ).resolves.toHaveLength(0);
    await expect(validate(plainToInstance(UnsubscribeDto, { token }))).resolves.toHaveLength(0);
    await expect(
      validate(plainToInstance(ConfirmSubscriptionDto, { token: 'token-invalido' })),
    ).resolves.toHaveLength(1);
  });
});
