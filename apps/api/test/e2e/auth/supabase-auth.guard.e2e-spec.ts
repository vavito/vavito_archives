import type { Server } from 'node:http';

import {
  Controller,
  Get,
  type INestApplication,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { UnauthenticatedException } from '@api/core/auth/errors/unauthenticated.exception';
import { SupabaseAuthGuard } from '@api/core/auth/guards/supabase-auth.guard';
import type {
  AuthenticatedRequest,
  AuthenticatedUser,
} from '@api/core/auth/interfaces/authenticated-user.interface';
import { SupabaseJwtService } from '@api/core/auth/supabase-jwt.service';
import { setupErrorHandling } from '@api/core/http/setup-error-handling';

const AUTHENTICATED_USER: AuthenticatedUser = {
  email: 'leitor@vavitoarchives.com.br',
  id: '2cc721a8-2db5-4e7f-b68a-d807546b5206',
};

let controllerCalls = 0;

@Controller('auth-fixture')
@UseGuards(SupabaseAuthGuard)
class AuthFixtureController {
  @Get()
  guardedRoute(@Req() request: AuthenticatedRequest): AuthenticatedUser | undefined {
    controllerCalls += 1;
    return request.user;
  }
}

describe('SupabaseAuthGuard (e2e)', () => {
  let app: INestApplication;
  let moduleRef: TestingModule;
  const verify = jest.fn<Promise<AuthenticatedUser>, [string]>();

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      controllers: [AuthFixtureController],
      providers: [SupabaseAuthGuard, { provide: SupabaseJwtService, useValue: { verify } }],
    }).compile();
    app = moduleRef.createNestApplication();
    setupErrorHandling(app);
    await app.init();
  });

  beforeEach(() => {
    controllerCalls = 0;
    verify.mockReset();
  });

  afterAll(async () => {
    await app.close();
    await moduleRef.close();
  });

  it('responde 401 padronizado sem executar o controller quando o Bearer está ausente', async () => {
    const response = await request(app.getHttpServer() as Server).get('/auth-fixture').expect(401);

    expect(response.body).toMatchObject({
      code: 'UNAUTHENTICATED',
      details: null,
      message: 'Autenticação necessária.',
      path: '/auth-fixture',
      statusCode: 401,
    });
    expect(controllerCalls).toBe(0);
    expect(verify).not.toHaveBeenCalled();
  });

  it('responde 401 sem executar o controller quando o JWT é inválido', async () => {
    verify.mockRejectedValueOnce(new UnauthenticatedException(new Error('invalid signature')));

    await request(app.getHttpServer() as Server)
      .get('/auth-fixture')
      .set('authorization', 'Bearer jwt-invalido')
      .expect(401);

    expect(controllerCalls).toBe(0);
    expect(verify).toHaveBeenCalledWith('jwt-invalido');
  });

  it('disponibiliza o usuário autenticado ao controller quando o JWT é válido', async () => {
    verify.mockResolvedValueOnce(AUTHENTICATED_USER);

    const response = await request(app.getHttpServer() as Server)
      .get('/auth-fixture')
      .set('authorization', 'Bearer jwt-valido')
      .expect(200);

    expect(response.body).toEqual(AUTHENTICATED_USER);
    expect(controllerCalls).toBe(1);
  });
});
