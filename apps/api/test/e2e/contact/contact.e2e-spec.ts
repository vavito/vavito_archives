import type { Server } from 'node:http';

import { setupErrorHandling } from '@api/core/http/setup-error-handling';
import { CONTACT_ACCEPTED_MESSAGE } from '@api/modules/contact/contact.constants';
import { ContactController } from '@api/modules/contact/controllers/contact.controller';
import { ContactRateLimitGuard } from '@api/modules/contact/guards/contact-rate-limit.guard';
import { ContactService } from '@api/modules/contact/services/contact.service';
import type { INestApplication } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';

describe('Contact (e2e)', () => {
  let app: INestApplication;
  let moduleRef: TestingModule;
  const create = jest.fn().mockResolvedValue({ message: CONTACT_ACCEPTED_MESSAGE });

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      controllers: [ContactController],
      providers: [ContactRateLimitGuard, { provide: ContactService, useValue: { create } }],
    }).compile();
    app = moduleRef.createNestApplication<NestExpressApplication>();
    (app as NestExpressApplication).set('trust proxy', 1);
    app.setGlobalPrefix('api/v1');
    setupErrorHandling(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await moduleRef.close();
  });

  beforeEach(() => jest.clearAllMocks());

  it('POST /api/v1/contact responde 202 sem vazar dados pessoais', async () => {
    const response = await request(app.getHttpServer() as Server)
      .post('/api/v1/contact')
      .set('x-forwarded-for', '203.0.113.10')
      .send({
        email: 'leitor@example.com',
        message: 'Gostaria de sugerir uma nova pauta.',
        name: 'Leitor',
        subject: 'Sugestão',
      })
      .expect(202);

    expect(response.body).toEqual({ message: CONTACT_ACCEPTED_MESSAGE });
    expect(JSON.stringify(response.body)).not.toContain('leitor@example.com');
  });

  it('rejeita mensagens inválidas antes de chamar o service', async () => {
    await request(app.getHttpServer() as Server)
      .post('/api/v1/contact')
      .set('x-forwarded-for', '203.0.113.20')
      .send({ email: 'inválido', message: 'curta', name: 'A' })
      .expect(400);

    expect(create).not.toHaveBeenCalled();
  });

  it('responde 429 depois de cinco mensagens do mesmo IP', async () => {
    const server = app.getHttpServer() as Server;
    const payload = {
      email: 'leitor@example.com',
      message: 'Gostaria de sugerir uma nova pauta.',
      name: 'Leitor',
    };

    for (let attempt = 0; attempt < 5; attempt += 1) {
      await request(server)
        .post('/api/v1/contact')
        .set('x-forwarded-for', '203.0.113.30')
        .send(payload)
        .expect(202);
    }

    const response = await request(server)
      .post('/api/v1/contact')
      .set('x-forwarded-for', '203.0.113.30')
      .send(payload)
      .expect(429);

    expect(response.body).toMatchObject({ code: 'RATE_LIMIT_EXCEEDED', statusCode: 429 });
  });
});
