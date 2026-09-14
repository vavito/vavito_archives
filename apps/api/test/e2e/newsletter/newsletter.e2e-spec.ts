import type { Server } from 'node:http';

import type { INestApplication } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { SupabaseAuthGuard } from '@api/core/auth/guards/supabase-auth.guard';
import type { AuthenticatedUser } from '@api/core/auth/interfaces/authenticated-user.interface';
import { SupabaseJwtService } from '@api/core/auth/services/supabase-jwt.service';
import { setupErrorHandling } from '@api/core/http/setup-error-handling';
import { HttpSecurityModule } from '@api/core/http/security/http-security.module';
import { NewsletterController } from '@api/modules/newsletter/controllers/newsletter.controller';
import { SubscriberConsentSource } from '@api/modules/newsletter/domain/enums/subscriber-consent-source.enum';
import {
  SUBSCRIPTION_ACCEPTED_MESSAGE,
  SUBSCRIPTION_CONFIRMED_MESSAGE,
} from '@api/modules/newsletter/newsletter.constants';
import { NewsletterService } from '@api/modules/newsletter/services/newsletter.service';

const USER: AuthenticatedUser = {
  email: 'leitor@vavitoarchives.com.br',
  id: '2cc721a8-2db5-4e7f-b68a-d807546b5206',
};
const TOKEN = 'HfByP6b1hQ9lBf8Nw5vVJdWxe_vf1EpfkNGYw1iHt7Q';

describe('NewsletterController (e2e)', () => {
  let app: INestApplication;
  let moduleRef: TestingModule;
  const confirm = jest.fn();
  const subscribe = jest.fn();
  const subscribeConfirmedAccount = jest.fn();
  const unsubscribe = jest.fn();
  const verify = jest.fn<Promise<AuthenticatedUser>, [string]>();

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      controllers: [NewsletterController],
      imports: [HttpSecurityModule],
      providers: [
        SupabaseAuthGuard,
        { provide: SupabaseJwtService, useValue: { verify } },
        { provide: APP_GUARD, useExisting: SupabaseAuthGuard },
        {
          provide: NewsletterService,
          useValue: { confirm, subscribe, subscribeConfirmedAccount, unsubscribe },
        },
      ],
    }).compile();
    app = moduleRef.createNestApplication<NestExpressApplication>();
    (app as NestExpressApplication).set('trust proxy', 1);
    app.setGlobalPrefix('api/v1');
    setupErrorHandling(app);
    await app.init();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    confirm.mockResolvedValue({ message: SUBSCRIPTION_CONFIRMED_MESSAGE });
    subscribe.mockResolvedValue({ message: SUBSCRIPTION_ACCEPTED_MESSAGE });
    subscribeConfirmedAccount.mockResolvedValue(undefined);
    unsubscribe.mockResolvedValue(undefined);
    verify.mockResolvedValue(USER);
  });

  afterAll(async () => {
    await app.close();
    await moduleRef.close();
  });

  it('mantém inscrição, confirmação e cancelamento públicos sem validar JWT', async () => {
    const server = app.getHttpServer() as Server;

    const subscription = await request(server)
      .post('/api/v1/newsletter/subscriptions')
      .set('x-forwarded-for', '203.0.113.41')
      .send({
        consent: true,
        email: 'leitor@example.com',
        source: SubscriberConsentSource.HOME,
      })
      .expect(202);
    await request(server)
      .post('/api/v1/newsletter/subscriptions/confirm')
      .set('x-forwarded-for', '203.0.113.42')
      .send({ token: TOKEN })
      .expect(200);
    await request(server)
      .post('/api/v1/newsletter/subscriptions/unsubscribe')
      .set('x-forwarded-for', '203.0.113.43')
      .send({ token: TOKEN })
      .expect(204);

    expect(subscription.body).toEqual({ message: SUBSCRIPTION_ACCEPTED_MESSAGE });
    expect(verify).not.toHaveBeenCalled();
    expect(subscribe).toHaveBeenCalledWith({
      consent: true,
      email: 'leitor@example.com',
      source: SubscriberConsentSource.HOME,
    });
    expect(confirm).toHaveBeenCalledWith({ token: TOKEN });
    expect(unsubscribe).toHaveBeenCalledWith({ token: TOKEN });
  });

  it('protege a inscrição automática vinculada à conta confirmada', async () => {
    await request(app.getHttpServer() as Server)
      .post('/api/v1/newsletter/subscriptions/account')
      .expect(401);

    await request(app.getHttpServer() as Server)
      .post('/api/v1/newsletter/subscriptions/account')
      .set('authorization', 'Bearer jwt-valido')
      .expect(204);

    expect(verify).toHaveBeenCalledWith('jwt-valido');
    expect(subscribeConfirmedAccount).toHaveBeenCalledWith(USER.email);
  });

  it('limita cada operação pública da newsletter por IP', async () => {
    const server = app.getHttpServer() as Server;
    const payload = {
      consent: true,
      email: 'leitor@example.com',
      source: SubscriberConsentSource.FOOTER,
    };

    for (let attempt = 0; attempt < 5; attempt += 1) {
      await request(server)
        .post('/api/v1/newsletter/subscriptions')
        .set('x-forwarded-for', '203.0.113.44')
        .send(payload)
        .expect(202);
    }

    const response = await request(server)
      .post('/api/v1/newsletter/subscriptions')
      .set('x-forwarded-for', '203.0.113.44')
      .send(payload)
      .expect(429);

    expect(response.body).toMatchObject({ code: 'RATE_LIMIT_EXCEEDED', statusCode: 429 });
    expect(response.headers['retry-after']).toBeDefined();
  });
});
