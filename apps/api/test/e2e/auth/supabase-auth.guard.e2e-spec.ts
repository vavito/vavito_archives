import type { Server } from 'node:http';

import { Controller, Get, type INestApplication } from '@nestjs/common';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { ApiBearerAuth, ApiOperation, DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { ROLES_METADATA_KEY } from '@api/core/auth/constants/auth.constants';
import { CurrentUser } from '@api/core/auth/decorators/current-user.decorator';
import { Public } from '@api/core/auth/decorators/public.decorator';
import { Roles } from '@api/core/auth/decorators/roles.decorator';
import { UnauthenticatedException } from '@api/core/auth/errors/unauthenticated.exception';
import { SupabaseAuthGuard } from '@api/core/auth/guards/supabase-auth.guard';
import { RolesGuard } from '@api/core/auth/guards/roles.guard';
import type { AuthenticatedUser } from '@api/core/auth/interfaces/authenticated-user.interface';
import { ProfileAuthorizationRepository } from '@api/core/auth/repositories/profile-authorization.repository';
import { SupabaseJwtService } from '@api/core/auth/services/supabase-jwt.service';
import { setupErrorHandling } from '@api/core/http/setup-error-handling';
import { UserRole } from '@api/generated/prisma/client';

const AUTHENTICATED_USER: AuthenticatedUser = {
  email: 'leitor@vavitoarchives.com.br',
  id: '2cc721a8-2db5-4e7f-b68a-d807546b5206',
};

let controllerCalls = 0;
let adminControllerCalls = 0;

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
    adminControllerCalls += 1;
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
  const findActiveRoleByProfileId = jest.fn<Promise<UserRole | null>, [string]>();

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      controllers: [AuthFixtureController],
      providers: [
        SupabaseAuthGuard,
        RolesGuard,
        { provide: SupabaseJwtService, useValue: { verify } },
        {
          provide: ProfileAuthorizationRepository,
          useValue: { findActiveRoleByProfileId },
        },
        { provide: APP_GUARD, useExisting: SupabaseAuthGuard },
        { provide: APP_GUARD, useExisting: RolesGuard },
      ],
    }).compile();
    app = moduleRef.createNestApplication();
    setupErrorHandling(app);
    await app.init();
  });

  beforeEach(() => {
    controllerCalls = 0;
    adminControllerCalls = 0;
    verify.mockReset();
    findActiveRoleByProfileId.mockReset();
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

  it.each([
    ['usa outro esquema', 'Basic credencial'],
    ['não contém o token', 'Bearer'],
    ['contém mais de uma credencial', 'Bearer jwt outra-credencial'],
  ])('responde 401 quando o Authorization %s', async (_label, authorization) => {
    await request(app.getHttpServer() as Server)
      .get('/auth-fixture')
      .set('authorization', authorization)
      .expect(401);

    expect(controllerCalls).toBe(0);
    expect(verify).not.toHaveBeenCalled();
  });

  it('disponibiliza o usuário autenticado com @CurrentUser', async () => {
    verify.mockResolvedValueOnce(AUTHENTICATED_USER);

    const response = await request(app.getHttpServer() as Server)
      .get('/auth-fixture')
      .set('authorization', 'Bearer jwt-valido')
      .expect(200);

    expect(response.body).toEqual(AUTHENTICATED_USER);
    expect(controllerCalls).toBe(1);
    expect(findActiveRoleByProfileId).not.toHaveBeenCalled();
  });

  it('responde 403 para USER em endpoint administrativo', async () => {
    verify.mockResolvedValueOnce(AUTHENTICATED_USER);
    findActiveRoleByProfileId.mockResolvedValueOnce(UserRole.USER);

    const response = await request(app.getHttpServer() as Server)
      .get('/auth-fixture/admin')
      .set('authorization', 'Bearer jwt-valido')
      .expect(403);

    expect(response.body).toMatchObject({
      code: 'FORBIDDEN',
      details: null,
      message: 'Acesso não autorizado.',
      path: '/auth-fixture/admin',
      statusCode: 403,
    });
    expect(findActiveRoleByProfileId).toHaveBeenCalledWith(AUTHENTICATED_USER.id);
    expect(adminControllerCalls).toBe(0);
  });

  it('permite ADMIN em endpoint administrativo', async () => {
    verify.mockResolvedValueOnce(AUTHENTICATED_USER);
    findActiveRoleByProfileId.mockResolvedValueOnce(UserRole.ADMIN);

    const response = await request(app.getHttpServer() as Server)
      .get('/auth-fixture/admin')
      .set('authorization', 'Bearer jwt-valido')
      .expect(200);

    expect(response.body).toEqual(AUTHENTICATED_USER);
    expect(findActiveRoleByProfileId).toHaveBeenCalledWith(AUTHENTICATED_USER.id);
    expect(adminControllerCalls).toBe(1);
  });

  it('responde 403 quando não existe Profile ativo', async () => {
    verify.mockResolvedValueOnce(AUTHENTICATED_USER);
    findActiveRoleByProfileId.mockResolvedValueOnce(null);

    await request(app.getHttpServer() as Server)
      .get('/auth-fixture/admin')
      .set('authorization', 'Bearer jwt-valido')
      .expect(403);

    expect(adminControllerCalls).toBe(0);
  });

  it('libera endpoint com @Public sem tentar validar um token', async () => {
    const response = await request(app.getHttpServer() as Server)
      .get('/auth-fixture/public')
      .expect(200);

    expect(response.body).toEqual({ status: 'public' });
    expect(verify).not.toHaveBeenCalled();
    expect(findActiveRoleByProfileId).not.toHaveBeenCalled();
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
