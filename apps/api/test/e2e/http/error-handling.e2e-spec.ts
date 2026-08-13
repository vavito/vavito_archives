import type { Server } from 'node:http';

import {
  Body,
  Controller,
  Get,
  HttpStatus,
  type INestApplication,
  Logger,
  Module,
  Post,
} from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { IsEmail, IsString, MinLength } from 'class-validator';
import request from 'supertest';

import type { ErrorResponseDto } from '@api/core/http/dto/error-response.dto';
import { ApplicationException } from '@api/core/http/exceptions/application.exception';
import { setupErrorHandling } from '@api/core/http/setup-error-handling';

class ValidationFixtureDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}

@Controller('error-fixtures')
class ErrorFixtureController {
  @Post('validation')
  validate(@Body() body: ValidationFixtureDto): void {
    void body;
  }

  @Get('domain')
  domainError(): never {
    throw new ApplicationException({
      code: 'POST_SLUG_CONFLICT',
      message: 'O slug informado já está em uso.',
      statusCode: HttpStatus.CONFLICT,
    });
  }

  @Get('unexpected')
  unexpectedError(): never {
    throw new Error('segredo-interno-que-nao-pode-vazar');
  }

  @Get('application-server')
  applicationServerError(): never {
    throw new ApplicationException({
      code: 'DATABASE_CONNECTION_FAILED',
      details: [{ field: 'connection', reason: 'postgresql://secret' }],
      message: 'Falha interna com postgresql://secret.',
      statusCode: HttpStatus.SERVICE_UNAVAILABLE,
    });
  }
}

@Module({ controllers: [ErrorFixtureController] })
class ErrorFixtureModule {}

describe('Contrato global de erros (e2e)', () => {
  let app: INestApplication;
  let moduleRef: TestingModule;
  let loggerErrorSpy: jest.SpyInstance;

  beforeAll(async () => {
    loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
    moduleRef = await Test.createTestingModule({ imports: [ErrorFixtureModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    setupErrorHandling(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await moduleRef.close();
    loggerErrorSpy.mockRestore();
  });

  it('mapeia erros de validação para detalhes estáveis', async () => {
    const response = await request(app.getHttpServer() as Server)
      .post('/api/v1/error-fixtures/validation')
      .set('x-request-id', 'request-validation-1')
      .send({ email: 'email-invalido', password: 'curta', unexpected: true })
      .expect(400);
    const body = response.body as ErrorResponseDto;

    expect(body).toMatchObject({
      code: 'VALIDATION_ERROR',
      message: 'Dados inválidos.',
      path: '/api/v1/error-fixtures/validation',
      requestId: 'request-validation-1',
      statusCode: 400,
    });
    expect(body.details).toEqual(
      expect.arrayContaining([
        { field: 'email', reason: 'INVALID_EMAIL' },
        { field: 'password', reason: 'MIN_LENGTH' },
        { field: 'unexpected', reason: 'FIELD_NOT_ALLOWED' },
      ]),
    );
    expect(response.headers['x-request-id']).toBe('request-validation-1');
    expect(Number.isNaN(Date.parse(body.timestamp))).toBe(false);
  });

  it('preserva o código estável de uma exceção da aplicação', async () => {
    const response = await request(app.getHttpServer() as Server)
      .get('/api/v1/error-fixtures/domain')
      .expect(409);
    const body = response.body as ErrorResponseDto;

    expect(body).toMatchObject({
      code: 'POST_SLUG_CONFLICT',
      details: null,
      message: 'O slug informado já está em uso.',
      path: '/api/v1/error-fixtures/domain',
      statusCode: 409,
    });
    expect(body.requestId).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('padroniza uma rota inexistente sem retornar o formato nativo do Nest', async () => {
    const response = await request(app.getHttpServer() as Server)
      .get('/api/v1/rota-inexistente')
      .expect(404);

    expect(response.body).toMatchObject({
      code: 'ROUTE_NOT_FOUND',
      details: null,
      message: 'Rota não encontrada.',
      path: '/api/v1/rota-inexistente',
      statusCode: 404,
    });
  });

  it('oculta detalhes internos de falhas inesperadas', async () => {
    const response = await request(app.getHttpServer() as Server)
      .get('/api/v1/error-fixtures/unexpected')
      .expect(500);
    const serializedBody = JSON.stringify(response.body);

    expect(response.body).toMatchObject({
      code: 'INTERNAL_ERROR',
      details: null,
      message: 'Erro interno do servidor.',
      statusCode: 500,
    });
    expect(serializedBody).not.toContain('segredo-interno-que-nao-pode-vazar');
    expect(serializedBody).not.toContain('stack');
    expect(loggerErrorSpy).toHaveBeenCalled();
  });

  it('sanitiza também exceções 5xx criadas pela aplicação', async () => {
    const response = await request(app.getHttpServer() as Server)
      .get('/api/v1/error-fixtures/application-server')
      .expect(503);
    const serializedBody = JSON.stringify(response.body);

    expect(response.body).toMatchObject({
      code: 'SERVICE_UNAVAILABLE',
      details: null,
      message: 'Serviço temporariamente indisponível.',
      statusCode: 503,
    });
    expect(serializedBody).not.toContain('postgresql://secret');
    expect(serializedBody).not.toContain('DATABASE_CONNECTION_FAILED');
  });
});
