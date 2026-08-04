import type { Server } from 'node:http';

import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '@api/app.module';
import type { HealthResponse } from '@api/modules/health/health.service';

describe('HealthModule (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health responde 200 com metadados públicos', async () => {
    const response = await request(app.getHttpServer() as Server)
      .get('/health')
      .expect(200);
    const body = response.body as HealthResponse;

    expect(body.checks).toEqual({ api: { status: 'up' } });
    expect(body.status).toBe('ok');
    expect(typeof body.timestamp).toBe('string');
    expect(body.version).toBe('1.2.3-test');
    expect(Number.isNaN(Date.parse(body.timestamp))).toBe(false);
    expect(JSON.stringify(body)).not.toContain('test_service_role_key_value');
    expect(JSON.stringify(body)).not.toContain('re_test_api_key');
    expect(JSON.stringify(body)).not.toContain('test_revalidation_secret');
  });
});
