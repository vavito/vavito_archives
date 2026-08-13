import type { Server } from 'node:http';

import { Controller, Get, type INestApplication } from '@nestjs/common';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { ApiBearerAuth, ApiOperation, DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { ROLES_METADATA_KEY } from '@api/core/auth/auth.constants';
import { CurrentUser } from '@api/core/auth/decorators/current-user.decorator';
import { Public } from '@api/core/auth/decorators/public.decorator';
import { Roles } from '@api/core/auth/decorators/roles.decorator';
import { UnauthenticatedException } from '@api/core/auth/errors/unauthenticated.exception';
import { SupabaseAuthGuard } from '@api/core/auth/guards/supabase-auth.guard';
import type { AuthenticatedUser } from '@api/core/auth/interfaces/authenticated-user.interface';
import { SupabaseJwtService } from '@api/core/auth/supabase-jwt.service';
import { setupErrorHandling } from '@api/core/http/setup-error-handling';
import { UserRole } from '@api/generated/prisma/client';

const AUTHENTICATED_USER: AuthenticatedUser = {
  email: 'leitor@vavitoarchives.com.br',
  id: '2cc721a8-2db5-4e7f-b68a-d807546b5206',
};

let controllerCalls = 0;

@Controller('auth-fixture')
class AuthFixtureController {
  @Get()
  @ApiBearerAuth('supabase-jwt')
  @ApiOperation({ summary: 'Exemplo de endpoint autenticado' })
  guardedRoute(@CurrentUser() user: AuthenticatedUser): AuthenticatedUser {
    controllerCalls += 1;
    return user;
  }

  @Get('admin')
  @ApiBearerAuth('supabase-jwt')
  @ApiOperation({ summary: 'Exemplo de endpoint administrativo' })
  @Roles(UserRole.ADMIN)
  adminRoute(this: void, @CurrentUser() user: AuthenticatedUser): AuthenticatedUser {
    return user;
  }

  @Get('public')
  @ApiOperation({ summary: 'Exemplo de endpoint público' })
  @Public()
  publicRoute(): { status: string } {
    return { status: 'public' };
  }
}

describe('SupabaseAuthGuard (e2e)', () => {
  let app: INestApplication;
  let moduleRef: TestingModule;
  const verify = jest.fn<Promise<AuthenticatedUser>, [string]>();

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      controllers: [AuthFixtureController],
      providers: [
        SupabaseAuthGuard,
        { provide: SupabaseJwtService, useValue: { verify } },
        { provide: APP_GUARD, useExisting: SupabaseAuthGuard },
      ],
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
    const response = await request(app.getHttpServer() as Server)
      .get('/auth-fixture')
      .expect(401);

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

  it('disponibiliza o usuário autenticado com @CurrentUser', async () => {
    verify.mockResolvedValueOnce(AUTHENTICATED_USER);

    const response = await request(app.getHttpServer() as Server)
      .get('/auth-fixture')
      .set('authorization', 'Bearer jwt-valido')
      .expect(200);

    expect(response.body).toEqual(AUTHENTICATED_USER);
    expect(controllerCalls).toBe(1);
  });

  it('libera endpoint com @Public sem tentar validar um token', async () => {
    const response = await request(app.getHttpServer() as Server)
      .get('/auth-fixture/public')
      .expect(200);

    expect(response.body).toEqual({ status: 'public' });
    expect(verify).not.toHaveBeenCalled();
  });

  it('expõe as roles declaradas para leitura pelo Reflector', () => {
    const reflector = moduleRef.get(Reflector);
    const controller = moduleRef.get(AuthFixtureController);

    expect(reflector.get<UserRole[]>(ROLES_METADATA_KEY, controller.adminRoute)).toEqual([
      UserRole.ADMIN,
    ]);
  });

  it('documenta no Swagger os exemplos público e autenticado', () => {
    const options = new DocumentBuilder()
      .setTitle('Auth fixture')
      .setVersion('1')
      .addBearerAuth({ bearerFormat: 'JWT', scheme: 'bearer', type: 'http' }, 'supabase-jwt')
      .build();
    const document = SwaggerModule.createDocument(app, options);

    expect(document.paths['/auth-fixture']?.get?.security).toEqual([{ 'supabase-jwt': [] }]);
    expect(document.paths['/auth-fixture/admin']?.get?.security).toEqual([{ 'supabase-jwt': [] }]);
    expect(document.paths['/auth-fixture/public']?.get?.security).toBeUndefined();
  });
});
