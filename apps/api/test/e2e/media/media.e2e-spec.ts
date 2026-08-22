import type { Server } from 'node:http';

import type { INestApplication } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Test, type TestingModule } from '@nestjs/testing';
import sharp from 'sharp';
import request from 'supertest';

import { SupabaseAuthGuard } from '@api/core/auth/guards/supabase-auth.guard';
import { RolesGuard } from '@api/core/auth/guards/roles.guard';
import type { AuthenticatedUser } from '@api/core/auth/interfaces/authenticated-user.interface';
import { ProfileAuthorizationRepository } from '@api/core/auth/repositories/profile-authorization.repository';
import { SupabaseJwtService } from '@api/core/auth/services/supabase-jwt.service';
import { setupErrorHandling } from '@api/core/http/setup-error-handling';
import { UserRole } from '@api/generated/prisma/client';
import { AdminMediaController } from '@api/modules/media/controllers/admin-media.controller';
import { MediaAssetStatus } from '@api/modules/media/domain/enums/media-asset-status.enum';
import { MAX_MEDIA_SIZE_BYTES } from '@api/modules/media/domain/value-objects/media-metadata.value-object';
import { MediaFilePipe } from '@api/modules/media/pipes/media-file.pipe';
import { MediaService } from '@api/modules/media/services/media.service';

const USER: AuthenticatedUser = {
  email: 'admin@vavitoarchives.com.br',
  id: '2cc721a8-2db5-4e7f-b68a-d807546b5206',
};
const AUTHORIZATION = 'Bearer jwt-valido';
const CREATED_AT = new Date('2026-08-22T12:00:00.000Z');
const MEDIA_ID = 'c973827a-50b0-49d4-b319-38befde39f10';

describe('AdminMediaController (e2e)', () => {
  let app: INestApplication;
  let moduleRef: TestingModule;
  let png: Buffer;

  const upload = jest.fn();
  const verify = jest.fn<Promise<AuthenticatedUser>, [string]>();
  const findActiveRoleByProfileId = jest.fn<Promise<UserRole | null>, [string]>();

  beforeAll(async () => {
    png = await sharp({
      create: { background: '#123456', channels: 3, height: 630, width: 1200 },
    })
      .png()
      .toBuffer();

    moduleRef = await Test.createTestingModule({
      controllers: [AdminMediaController],
      providers: [
        MediaFilePipe,
        SupabaseAuthGuard,
        RolesGuard,
        { provide: SupabaseJwtService, useValue: { verify } },
        {
          provide: ProfileAuthorizationRepository,
          useValue: { findActiveRoleByProfileId },
        },
        { provide: APP_GUARD, useExisting: SupabaseAuthGuard },
        { provide: APP_GUARD, useExisting: RolesGuard },
        { provide: MediaService, useValue: { upload } },
      ],
    }).compile();
    app = moduleRef.createNestApplication();
    setupErrorHandling(app);
    await app.init();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    verify.mockResolvedValue(USER);
    findActiveRoleByProfileId.mockResolvedValue(UserRole.ADMIN);
    upload.mockResolvedValue({
      mediaAsset: {
        altText: 'Diagrama da arquitetura',
        createdAt: CREATED_AT,
        height: 630,
        id: MEDIA_ID,
        mimeType: 'image/png',
        sizeBytes: png.byteLength,
        status: MediaAssetStatus.READY,
        storagePath: `2026/08/${MEDIA_ID}.png`,
        width: 1200,
      },
      publicUrl: 'https://cdn.example/media.png',
    });
  });

  afterAll(async () => {
    await app.close();
    await moduleRef.close();
  });

  it('exige autenticação', async () => {
    await request(app.getHttpServer() as Server)
      .post('/admin/media')
      .field('altText', 'Diagrama da arquitetura')
      .attach('file', png, { contentType: 'image/png', filename: 'article.png' })
      .expect(401);

    expect(upload).not.toHaveBeenCalled();
  });

  it('bloqueia usuário sem papel ADMIN', async () => {
    findActiveRoleByProfileId.mockResolvedValueOnce(UserRole.USER);

    await request(app.getHttpServer() as Server)
      .post('/admin/media')
      .set('authorization', AUTHORIZATION)
      .field('altText', 'Diagrama da arquitetura')
      .attach('file', png, { contentType: 'image/png', filename: 'article.png' })
      .expect(403);

    expect(upload).not.toHaveBeenCalled();
  });

  it('valida e envia uma imagem para o serviço', async () => {
    const response = await request(app.getHttpServer() as Server)
      .post('/admin/media')
      .set('authorization', AUTHORIZATION)
      .field('altText', '  Diagrama   da arquitetura  ')
      .attach('file', png, { contentType: 'image/png', filename: 'article.png' })
      .expect(201);

    expect(response.body).toEqual({
      altText: 'Diagrama da arquitetura',
      createdAt: CREATED_AT.toISOString(),
      height: 630,
      id: MEDIA_ID,
      mimeType: 'image/png',
      path: `2026/08/${MEDIA_ID}.png`,
      sizeBytes: png.byteLength,
      status: MediaAssetStatus.READY,
      url: 'https://cdn.example/media.png',
      width: 1200,
    });
    expect(upload).toHaveBeenCalledWith({
      altText: 'Diagrama da arquitetura',
      buffer: png,
      createdById: USER.id,
      extension: 'png',
      height: 630,
      mimeType: 'image/png',
      width: 1200,
    });
  });

  it('retorna 400 quando o texto alternativo está vazio', async () => {
    await request(app.getHttpServer() as Server)
      .post('/admin/media')
      .set('authorization', AUTHORIZATION)
      .field('altText', '   ')
      .attach('file', png, { contentType: 'image/png', filename: 'article.png' })
      .expect(400);

    expect(upload).not.toHaveBeenCalled();
  });

  it('retorna 415 quando MIME, extensão ou conteúdo não correspondem', async () => {
    await request(app.getHttpServer() as Server)
      .post('/admin/media')
      .set('authorization', AUTHORIZATION)
      .field('altText', 'Diagrama da arquitetura')
      .attach('file', png, { contentType: 'image/jpeg', filename: 'article.jpg' })
      .expect(415);

    expect(upload).not.toHaveBeenCalled();
  });

  it('retorna 413 quando o arquivo ultrapassa 10 MB', async () => {
    await request(app.getHttpServer() as Server)
      .post('/admin/media')
      .set('authorization', AUTHORIZATION)
      .field('altText', 'Diagrama da arquitetura')
      .attach('file', Buffer.alloc(MAX_MEDIA_SIZE_BYTES + 1), {
        contentType: 'image/png',
        filename: 'article.png',
      })
      .expect(413);

    expect(upload).not.toHaveBeenCalled();
  });
});
