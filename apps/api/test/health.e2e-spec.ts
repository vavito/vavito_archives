import type { Server } from 'node:http';

import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import type { OpenAPIObject } from '@nestjs/swagger';
import request from 'supertest';

import { AppModule } from '@api/app.module';
import type { ApplicationConfig } from '@api/core/config/app.config';
import { setupOpenApi } from '@api/core/openapi/setup-openapi';
import type { HealthResponseDto } from '@api/modules/health/dto/health-response.dto';

describe('HealthModule (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    setupOpenApi(app, app.get(ConfigService<ApplicationConfig, true>));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/health responde 200 com metadados públicos', async () => {
    const response = await request(app.getHttpServer() as Server)
      .get('/api/v1/health')
      .expect(200);
    const body = response.body as HealthResponseDto;

    expect(body.checks).toEqual({ api: { status: 'up' } });
    expect(body.status).toBe('ok');
    expect(typeof body.timestamp).toBe('string');
    expect(body.version).toBe('1.2.3-test');
    expect(Number.isNaN(Date.parse(body.timestamp))).toBe(false);
    expect(JSON.stringify(body)).not.toContain('test_service_role_key_value');
    expect(JSON.stringify(body)).not.toContain('re_test_api_key');
    expect(JSON.stringify(body)).not.toContain('test_revalidation_secret');
  });

  it('GET /docs disponibiliza a interface do Swagger', async () => {
    const response = await request(app.getHttpServer() as Server)
      .get('/docs')
      .expect(200);

    expect(response.text).toContain('<title>Vavito Archives API Docs</title>');
  });

  it('GET /openapi.json exporta o contrato da rota de health', async () => {
    const response = await request(app.getHttpServer() as Server)
      .get('/openapi.json')
      .expect(200);
    const document = response.body as OpenAPIObject;

    expect(document.info.title).toBe('Vavito Archives API');
    expect(document.info.version).toBe('1.2.3-test');
    expect(document.paths['/api/v1/health']?.get?.responses?.['200']).toBeDefined();
    expect(document.components?.securitySchemes?.['supabase-jwt']).toBeDefined();
  });
});
