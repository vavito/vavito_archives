import { PUBLIC_ROUTE_METADATA_KEY } from '@api/core/auth/constants/auth.constants';
import { MailWebhookSignatureInvalidError } from '@api/core/mail/errors/mail-webhook-signature-invalid.error';
import type { VerifiedMailWebhookEvent } from '@api/core/mail/services/mail-webhook-verifier.service';
import { MailWebhookVerifier } from '@api/core/mail/services/mail-webhook-verifier.service';
import { ResendWebhooksController } from '@api/modules/newsletter/controllers/resend-webhooks.controller';
import { NewsletterWebhooksService } from '@api/modules/newsletter/services/newsletter-webhooks.service';
import { HttpStatus } from '@nestjs/common';
import { HTTP_CODE_METADATA } from '@nestjs/common/constants';
import type { RawBodyRequest } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

const EVENT: VerifiedMailWebhookEvent = {
  bounceSubType: null,
  bounceType: null,
  occurredAt: new Date('2026-08-25T10:05:00.000Z'),
  payloadHash: 'a'.repeat(64),
  providerEmailId: 'email-provider-id',
  providerEventId: 'event-provider-id',
  type: 'email.delivered',
};

describe('ResendWebhooksController', () => {
  const verify = jest.fn().mockReturnValue(EVENT);
  const process = jest.fn().mockResolvedValue(undefined);
  const verifier = { verify } as unknown as MailWebhookVerifier;
  const service = { process } as unknown as NewsletterWebhooksService;

  beforeEach(() => {
    jest.clearAllMocks();
    verify.mockReturnValue(EVENT);
  });

  it('declara rota pública com resposta 200', () => {
    expect(Reflect.getMetadata(PUBLIC_ROUTE_METADATA_KEY, ResendWebhooksController)).toBe(true);
    expect(
      // eslint-disable-next-line @typescript-eslint/unbound-method
      Reflect.getMetadata(HTTP_CODE_METADATA, ResendWebhooksController.prototype.process),
    ).toBe(HttpStatus.OK);
  });

  it('verifica o corpo bruto e delega o evento normalizado', async () => {
    const controller = new ResendWebhooksController(verifier, service);
    const payload = '{"type":"email.delivered"}';
    const request = { rawBody: Buffer.from(payload) } as RawBodyRequest<object>;

    await expect(
      controller.process(request, 'message-id', 'timestamp', 'signature'),
    ).resolves.toEqual({ received: true });
    expect(verify).toHaveBeenCalledWith({
      headers: { id: 'message-id', signature: 'signature', timestamp: 'timestamp' },
      payload,
    });
    expect(process).toHaveBeenCalledWith(EVENT);
  });

  it('transforma assinatura inválida em exceção 401 antes do service', async () => {
    const controller = new ResendWebhooksController(verifier, service);
    verify.mockImplementationOnce(() => {
      throw new MailWebhookSignatureInvalidError();
    });

    await expect(
      controller.process({ rawBody: Buffer.from('{}') }, '', '', ''),
    ).rejects.toMatchObject({ code: 'WEBHOOK_SIGNATURE_INVALID' });
    expect(process).not.toHaveBeenCalled();
  });

  it('publica headers e respostas do webhook no OpenAPI', async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ResendWebhooksController],
      providers: [
        { provide: MailWebhookVerifier, useValue: verifier },
        { provide: NewsletterWebhooksService, useValue: service },
      ],
    }).compile();
    const app = moduleRef.createNestApplication();
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().setTitle('Test').setVersion('1').build(),
    );
    const operation = document.paths?.['/webhooks/resend']?.post;

    expect(operation?.responses?.['200']).toBeDefined();
    expect(operation?.responses?.['401']).toBeDefined();
    expect(operation?.parameters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ in: 'header', name: 'svix-id' }),
        expect.objectContaining({ in: 'header', name: 'svix-timestamp' }),
        expect.objectContaining({ in: 'header', name: 'svix-signature' }),
      ]),
    );

    await app.close();
  });
});
