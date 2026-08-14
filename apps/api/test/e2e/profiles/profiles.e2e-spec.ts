import type { Server } from 'node:http';

import type { INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';

import type {
  AuthenticatedRequest,
  AuthenticatedUser,
} from '@api/core/auth/interfaces/authenticated-user.interface';
import { setupErrorHandling } from '@api/core/http/setup-error-handling';
import { UserRole } from '@api/generated/prisma/client';
import { ProfilesController } from '@api/modules/profiles/controllers/profiles.controller';
import { ProfilesService } from '@api/modules/profiles/services/profiles.service';
import { AvatarFilePipe } from '@api/modules/profiles/pipes/avatar-file.pipe';

const USER: AuthenticatedUser = {
  email: 'leitor@vavitoarchives.com.br',
  id: '2cc721a8-2db5-4e7f-b68a-d807546b5206',
};

const PROFILE_RESPONSE = {
  avatarUrl: null,
  createdAt: '2026-08-01T10:00:00.000Z',
  displayName: 'João Victor',
  id: USER.id,
  role: UserRole.USER,
  updatedAt: '2026-08-01T10:00:00.000Z',
};

describe('ProfilesController (e2e)', () => {
  let app: INestApplication;
  let moduleRef: TestingModule;
  const getMe = jest.fn();
  const updateMe = jest.fn();
  const uploadAvatar = jest.fn();
  const removeAvatar = jest.fn();
  const deleteAccount = jest.fn();

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      controllers: [ProfilesController],
      providers: [
        AvatarFilePipe,
        {
          provide: ProfilesService,
          useValue: { deleteAccount, getMe, removeAvatar, updateMe, uploadAvatar },
        },
      ],
    }).compile();
    app = moduleRef.createNestApplication();
    app.use((request_: object, _response: unknown, next: () => void) => {
      (request_ as unknown as AuthenticatedRequest).user = USER;
      next();
    });
    setupErrorHandling(app);
    await app.init();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
    await moduleRef.close();
  });

  it('consulta o perfil autenticado', async () => {
    getMe.mockResolvedValueOnce(PROFILE_RESPONSE);

    const response = await request(app.getHttpServer() as Server)
      .get('/profiles/me')
      .expect(200);

    expect(response.body).toEqual(PROFILE_RESPONSE);
    expect(getMe).toHaveBeenCalledWith(USER.id);
  });

  it('atualiza o displayName validado', async () => {
    updateMe.mockResolvedValueOnce({ ...PROFILE_RESPONSE, displayName: 'Novo Nome' });

    const response = await request(app.getHttpServer() as Server)
      .patch('/profiles/me')
      .send({ displayName: '  Novo   Nome  ' })
      .expect(200);

    expect(response.body).toMatchObject({ displayName: 'Novo Nome' });
    expect(updateMe).toHaveBeenCalledWith(USER.id, { displayName: 'Novo Nome' });
  });

  it('envia um avatar PNG válido', async () => {
    uploadAvatar.mockResolvedValueOnce({
      ...PROFILE_RESPONSE,
      avatarUrl: 'https://cdn.example/avatar.png',
    });
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);

    const response = await request(app.getHttpServer() as Server)
      .put('/profiles/me/avatar')
      .attach('file', png, { contentType: 'image/png', filename: 'avatar.png' })
      .expect(200);

    expect(response.body).toMatchObject({ avatarUrl: 'https://cdn.example/avatar.png' });
    expect(uploadAvatar).toHaveBeenCalledWith(
      USER.id,
      expect.objectContaining({ contentType: 'image/png', extension: 'png' }),
    );
  });

  it('remove o avatar', async () => {
    await request(app.getHttpServer() as Server)
      .delete('/profiles/me/avatar')
      .expect(204);

    expect(removeAvatar).toHaveBeenCalledWith(USER.id);
  });

  it('exige a frase de confirmação antes de excluir a conta', async () => {
    await request(app.getHttpServer() as Server)
      .delete('/profiles/me')
      .send({ confirmation: 'excluir' })
      .expect(400);
    expect(deleteAccount).not.toHaveBeenCalled();

    await request(app.getHttpServer() as Server)
      .delete('/profiles/me')
      .send({ confirmation: 'EXCLUIR MINHA CONTA' })
      .expect(204);
    expect(deleteAccount).toHaveBeenCalledWith(USER.id);
  });
});
