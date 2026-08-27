import type { Server } from 'node:http';

import { Body, Controller, Post } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';

import type { ApplicationConfig } from '@api/core/config/app.config';
import { setupErrorHandling } from '@api/core/http/setup-error-handling';
import { HttpSecurityModule } from '@api/core/http/security/http-security.module';
import { setupHttpSecurity } from '@api/core/http/security/setup-http-security';

@Controller('security-check')
class SecurityCheckController {
  @Post()
  echo(@Body() body: Record<string, unknown>): Record<string, unknown> {
    return body;
  }
}

describe('Segurança HTTP (e2e)', () => {
  let app: INestApplication;
  let moduleRef: TestingModule;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      controllers: [SecurityCheckController],
      imports: [HttpSecurityModule],
    }).compile();
    app = moduleRef.createNestApplication<NestExpressApplication>({ rawBody: true });
    app.setGlobalPrefix('api/v1');
    setupHttpSecurity(
      app,
      new ConfigService<ApplicationConfig, true>({
        app: {
          corsAllowedOrigins: ['https://vavitoarchives.com.br'],
          environment: 'test',
          frontendUrl: 'https://vavitoarchives.com.br',
          port: 3001,
          swaggerEnabled: false,
          version: '1.0.0',
        },
      } as ApplicationConfig),
    );
    setupErrorHandling(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await moduleRef.close();
  });

  it('aplica headers seguros e libera somente a origin configurada', async () => {
    const response = await request(app.getHttpServer() as Server)
      .post('/api/v1/security-check')
      .set('origin', 'https://vavitoarchives.com.br')
      .send({ ok: true })
      .expect(201);

    expect(response.headers['access-control-allow-origin']).toBe('https://vavitoarchives.com.br');
    expect(response.headers['content-security-policy']).toBeDefined();
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-frame-options']).toBe('SAMEORIGIN');
  });

  it('não publica CORS para uma origin não autorizada', async () => {
    const response = await request(app.getHttpServer() as Server)
      .post('/api/v1/security-check')
      .set('origin', 'https://malicious.example')
      .send({ ok: true })
      .expect(201);

    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('rejeita JSON acima de 1 MiB com o contrato global de erro', async () => {
    const response = await request(app.getHttpServer() as Server)
      .post('/api/v1/security-check')
      .send({ content: 'x'.repeat(1_048_576) })
      .expect(413);

    expect(response.body).toMatchObject({ code: 'PAYLOAD_TOO_LARGE', statusCode: 413 });
  });
});
