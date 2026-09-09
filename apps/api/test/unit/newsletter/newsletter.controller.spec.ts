import { PUBLIC_ROUTE_METADATA_KEY } from '@api/core/auth/constants/auth.constants';
import { RATE_LIMITS } from '@api/core/http/security/http-security.constants';
import { NewsletterController } from '@api/modules/newsletter/controllers/newsletter.controller';
import { SubscriberConsentSource } from '@api/modules/newsletter/domain/enums/subscriber-consent-source.enum';
import { NewsletterService } from '@api/modules/newsletter/services/newsletter.service';
import { HttpStatus } from '@nestjs/common';
import { HTTP_CODE_METADATA } from '@nestjs/common/constants';
import { Test } from '@nestjs/testing';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { THROTTLER_LIMIT } from '@nestjs/throttler/dist/throttler.constants';

describe('NewsletterController', () => {
  const subscribe = jest.fn();
  const subscribeConfirmedAccount = jest.fn();
  const confirm = jest.fn();
  const unsubscribe = jest.fn();
  const service = {
    confirm,
    subscribe,
    subscribeConfirmedAccount,
    unsubscribe,
  } as unknown as NewsletterService;

  beforeEach(() => jest.clearAllMocks());

  it('declara rotas públicas limitadas e status idempotentes', () => {
    expect(
      // eslint-disable-next-line @typescript-eslint/unbound-method
      Reflect.getMetadata(PUBLIC_ROUTE_METADATA_KEY, NewsletterController.prototype.subscribe),
    ).toBe(true);
    expect(
      Reflect.getMetadata(
        PUBLIC_ROUTE_METADATA_KEY,
        // eslint-disable-next-line @typescript-eslint/unbound-method
        NewsletterController.prototype.subscribeAccount,
      ),
    ).toBeUndefined();
    expect(Reflect.getMetadata(`${THROTTLER_LIMIT}default`, NewsletterController)).toBe(
      RATE_LIMITS.newsletter.limit,
    );
    expect(
      // eslint-disable-next-line @typescript-eslint/unbound-method
      Reflect.getMetadata(HTTP_CODE_METADATA, NewsletterController.prototype.subscribe),
    ).toBe(HttpStatus.ACCEPTED);
    expect(
      // eslint-disable-next-line @typescript-eslint/unbound-method
      Reflect.getMetadata(HTTP_CODE_METADATA, NewsletterController.prototype.unsubscribe),
    ).toBe(HttpStatus.NO_CONTENT);
    expect(
      // eslint-disable-next-line @typescript-eslint/unbound-method
      Reflect.getMetadata(HTTP_CODE_METADATA, NewsletterController.prototype.subscribeAccount),
    ).toBe(HttpStatus.NO_CONTENT);
  });

  it('delega os fluxos públicos e o cadastro confirmado ao service', async () => {
    const controller = new NewsletterController(service);
    const subscribeDto = {
      consent: true as const,
      email: 'leitor@example.com',
      source: SubscriberConsentSource.HOME,
    };
    const tokenDto = { token: 'A'.repeat(43) };
    subscribe.mockResolvedValueOnce({ message: 'aceito' });
    confirm.mockResolvedValueOnce({ message: 'confirmado' });
    unsubscribe.mockResolvedValueOnce(undefined);
    subscribeConfirmedAccount.mockResolvedValueOnce(undefined);

    await expect(controller.subscribe(subscribeDto)).resolves.toEqual({ message: 'aceito' });
    await expect(controller.confirm(tokenDto)).resolves.toEqual({ message: 'confirmado' });
    await expect(controller.unsubscribe(tokenDto)).resolves.toBeUndefined();
    await expect(
      controller.subscribeAccount({ email: 'leitor@example.com', id: 'profile-id' }),
    ).resolves.toBeUndefined();
    expect(subscribe).toHaveBeenCalledWith(subscribeDto);
    expect(confirm).toHaveBeenCalledWith(tokenDto);
    expect(unsubscribe).toHaveBeenCalledWith(tokenDto);
    expect(subscribeConfirmedAccount).toHaveBeenCalledWith('leitor@example.com');
  });

  it('publica DTOs e respostas no OpenAPI', async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [NewsletterController],
      providers: [{ provide: NewsletterService, useValue: service }],
    }).compile();
    const app = moduleRef.createNestApplication();
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().setTitle('Test').setVersion('1').build(),
    );

    expect(document.components?.schemas?.['SubscribeNewsletterDto']).toBeDefined();
    expect(document.components?.schemas?.['ConfirmSubscriptionDto']).toBeDefined();
    expect(document.paths?.['/newsletter/subscriptions']?.post?.responses?.['202']).toBeDefined();
    expect(
      document.paths?.['/newsletter/subscriptions/confirm']?.post?.responses?.['410'],
    ).toBeDefined();
    expect(
      document.paths?.['/newsletter/subscriptions/unsubscribe']?.post?.responses?.['204'],
    ).toBeDefined();
    expect(
      document.paths?.['/newsletter/subscriptions/account']?.post?.responses?.['204'],
    ).toBeDefined();

    await app.close();
  });
});
