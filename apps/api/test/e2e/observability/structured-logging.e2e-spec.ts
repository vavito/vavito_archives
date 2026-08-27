import type { Server } from 'node:http';
import { PassThrough } from 'node:stream';

import {
  Body,
  type CanActivate,
  Controller,
  type ExecutionContext,
  Get,
  type INestApplication,
  Injectable,
  Logger,
  Post,
  UseGuards,
} from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { Test, type TestingModule } from '@nestjs/testing';
import { LoggerModule, PinoLogger } from 'nestjs-pino';
import request from 'supertest';

import type { AuthenticatedRequest } from '@api/core/auth/interfaces/authenticated-user.interface';
import { RequestLoggingInterceptor } from '@api/core/http/interceptors/request-logging.interceptor';
import { setupErrorHandling } from '@api/core/http/setup-error-handling';
import { createPinoHttpOptions } from '@api/core/observability/pino-http.options';

const ACTOR_ID = '6a84dba4-691a-4720-b1f6-bb835e486876';
const AUTHORIZATION_SECRET = 'Bearer token-que-nao-pode-vazar';
const PASSWORD_SECRET = 'senha-que-nao-pode-vazar';
const TOKEN_SECRET = 'token-de-formulario-secreto';
const ERROR_SECRET = 'erro-com-segredo-interno';

interface SensitiveBody {
  password: string;
  token: string;
}

interface StructuredLog {
  actorId?: string;
  actorType?: string;
  durationMs?: number;
  event?: string;
  msg?: string;
  requestId?: string;
  res?: { statusCode: number };
}

@Injectable()
class AuthenticatedFixtureGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    request.user = { email: 'email-privado@example.com', id: ACTOR_ID };
    return true;
  }
}

@Controller('logging-fixtures')
@UseGuards(AuthenticatedFixtureGuard)
class LoggingFixtureController {
  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(LoggingFixtureController.name);
  }

  @Post('success')
  success(@Body() body: SensitiveBody): { ok: true } {
    this.logger.info(
      {
        credentials: { password: body.password },
        event: 'sensitive_fixture',
        token: body.token,
      },
      'Fixture processada.',
    );
    return { ok: true };
  }

  @Get('error')
  fail(): never {
    throw new Error(ERROR_SECRET);
  }
}

describe('Logging estruturado (e2e)', () => {
  let app: INestApplication;
  let moduleRef: TestingModule;
  let loggerErrorSpy: jest.SpyInstance;
  const stream = new PassThrough();
  const chunks: string[] = [];

  function logs(): StructuredLog[] {
    return chunks
      .join('')
      .trim()
      .split('\n')
      .filter(Boolean)
      .map((line) => JSON.parse(line) as StructuredLog);
  }

  beforeAll(async () => {
    stream.on('data', (chunk: Buffer) => chunks.push(chunk.toString('utf8')));
    loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
    moduleRef = await Test.createTestingModule({
      controllers: [LoggingFixtureController],
      imports: [
        LoggerModule.forRoot({
          assignResponse: true,
          pinoHttp: [createPinoHttpOptions('info'), stream],
        }),
      ],
      providers: [
        AuthenticatedFixtureGuard,
        { provide: APP_INTERCEPTOR, useClass: RequestLoggingInterceptor },
      ],
    }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    setupErrorHandling(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await moduleRef.close();
    loggerErrorSpy.mockRestore();
    stream.destroy();
  });

  beforeEach(() => {
    chunks.length = 0;
  });

  it('correlaciona entrada, logs internos e resposta sem expor credenciais', async () => {
    const response = await request(app.getHttpServer() as Server)
      .post('/api/v1/logging-fixtures/success')
      .set('authorization', AUTHORIZATION_SECRET)
      .set('user-agent', 'identificador-que-nao-deve-ser-persistido')
      .set('x-request-id', 'trace-logging-1')
      .send({ password: PASSWORD_SECRET, token: TOKEN_SECRET })
      .expect(201);
    const serializedLogs = JSON.stringify(logs());
    const correlatedLogs = logs().filter(({ requestId }) => requestId === 'trace-logging-1');

    expect(response.headers['x-request-id']).toBe('trace-logging-1');
    expect(correlatedLogs.length).toBeGreaterThanOrEqual(3);
    expect(correlatedLogs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ actorId: ACTOR_ID, actorType: 'authenticated' }),
      ]),
    );
    expect(serializedLogs).not.toContain(AUTHORIZATION_SECRET);
    expect(serializedLogs).not.toContain(PASSWORD_SECRET);
    expect(serializedLogs).not.toContain(TOKEN_SECRET);
    expect(serializedLogs).not.toContain('email-privado@example.com');
    expect(serializedLogs).not.toContain('identificador-que-nao-deve-ser-persistido');
  });

  it('registra falha com contexto seguro e o mesmo requestId', async () => {
    const response = await request(app.getHttpServer() as Server)
      .get('/api/v1/logging-fixtures/error')
      .set('x-request-id', 'trace-error-1')
      .expect(500);
    const correlatedLogs = logs().filter(({ requestId }) => requestId === 'trace-error-1');
    const serializedLogs = JSON.stringify(correlatedLogs);
    const failedLog = correlatedLogs.find(({ res }) => res?.statusCode === 500);

    expect(response.body).toMatchObject({ requestId: 'trace-error-1', statusCode: 500 });
    expect(failedLog).toBeDefined();
    expect(typeof failedLog?.durationMs).toBe('number');
    expect(serializedLogs).not.toContain(ERROR_SECRET);
  });
});
