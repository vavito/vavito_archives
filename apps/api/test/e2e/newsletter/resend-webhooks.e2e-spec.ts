import type { Server } from 'node:http';

import { setupErrorHandling } from '@api/core/http/setup-error-handling';
import { MailWebhookSignatureInvalidError } from '@api/core/mail/errors/mail-webhook-signature-invalid.error';
import type { VerifiedMailWebhookEvent } from '@api/core/mail/services/mail-webhook-verifier.service';
import { MailWebhookVerifier } from '@api/core/mail/services/mail-webhook-verifier.service';
import { ResendWebhooksController } from '@api/modules/newsletter/controllers/resend-webhooks.controller';
import { NewsletterWebhooksService } from '@api/modules/newsletter/services/newsletter-webhooks.service';
import type { INestApplication } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';

const EVENT: VerifiedMailWebhookEvent = {
  bounceSubType: null,
  bounceType: null,
  occurredAt: new Date('2026-08-25T10:05:00.000Z'),
  payloadHash: 'a'.repeat(64),
  providerEmailId: 'email-provider-id',
  providerEventId: 'event-provider-id',
  type: 'email.delivered',
};

describe('Resend webhook (e2e)', () => {
  let app: INestApplication;
  let moduleRef: TestingModule;
  const verify = jest.fn().mockReturnValue(EVENT);
  const process = jest.fn().mockResolvedValue(undefined);

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      controllers: [ResendWebhooksController],
      providers: [
        { provide: MailWebhookVerifier, useValue: { verify } },
        { provide: NewsletterWebhooksService, useValue: { process } },
      ],
    }).compile();
    app = moduleRef.createNestApplication<NestExpressApplication>({ rawBody: true });
    app.setGlobalPrefix('api/v1');
    setupErrorHandling(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await moduleRef.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    verify.mockReturnValue(EVENT);
  });

  it('preserva o corpo bruto assinado e responde 200', async () => {
    const payload = JSON.stringify({
      created_at: '2026-08-25T10:05:00.000Z',
      type: 'email.delivered',
    });

    await request(app.getHttpServer() as Server)
      .post('/api/v1/webhooks/resend')
      .set('content-type', 'application/json')
      .set('svix-id', 'message-id')
      .set('svix-signature', 'signature')
      .set('svix-timestamp', 'timestamp')
      .send(payload)
      .expect(200, { received: true });

    expect(verify).toHaveBeenCalledWith({
      headers: { id: 'message-id', signature: 'signature', timestamp: 'timestamp' },
      payload,
    });
    expect(process).toHaveBeenCalledWith(EVENT);
  });

  it('responde 401 quando a assinatura é inválida', async () => {
    verify.mockImplementationOnce(() => {
      throw new MailWebhookSignatureInvalidError();
    });

    const response = await request(app.getHttpServer() as Server)
      .post('/api/v1/webhooks/resend')
      .set('content-type', 'application/json')
      .set('svix-id', 'message-id')
      .set('svix-signature', 'invalid')
      .set('svix-timestamp', 'timestamp')
      .send('{}')
      .expect(401);

    expect(response.body).toMatchObject({
      code: 'WEBHOOK_SIGNATURE_INVALID',
      statusCode: 401,
    });
    expect(process).not.toHaveBeenCalled();
  });
});
