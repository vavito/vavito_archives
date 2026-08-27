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
  const confirm = jest.fn();
  const unsubscribe = jest.fn();
  const service = { confirm, subscribe, unsubscribe } as unknown as NewsletterService;

  beforeEach(() => jest.clearAllMocks());

  it('declara rotas públicas limitadas e status idempotentes', () => {
    expect(Reflect.getMetadata(PUBLIC_ROUTE_METADATA_KEY, NewsletterController)).toBe(true);
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
  });

  it('delega os três fluxos ao service', async () => {
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

    await expect(controller.subscribe(subscribeDto)).resolves.toEqual({ message: 'aceito' });
    await expect(controller.confirm(tokenDto)).resolves.toEqual({ message: 'confirmado' });
    await expect(controller.unsubscribe(tokenDto)).resolves.toBeUndefined();
    expect(subscribe).toHaveBeenCalledWith(subscribeDto);
    expect(confirm).toHaveBeenCalledWith(tokenDto);
    expect(unsubscribe).toHaveBeenCalledWith(tokenDto);
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

    await app.close();
  });
});
