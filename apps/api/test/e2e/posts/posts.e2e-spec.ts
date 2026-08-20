import type { Server } from 'node:http';

import type { INestApplication } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { SupabaseAuthGuard } from '@api/core/auth/guards/supabase-auth.guard';
import { RolesGuard } from '@api/core/auth/guards/roles.guard';
import type { AuthenticatedUser } from '@api/core/auth/interfaces/authenticated-user.interface';
import { ProfileAuthorizationRepository } from '@api/core/auth/repositories/profile-authorization.repository';
import { SupabaseJwtService } from '@api/core/auth/services/supabase-jwt.service';
import { setupErrorHandling } from '@api/core/http/setup-error-handling';
import { UserRole } from '@api/generated/prisma/client';
import { AdminPostsController } from '@api/modules/posts/controllers/admin-posts.controller';
import { PostsController } from '@api/modules/posts/controllers/posts.controller';
import { TagsController } from '@api/modules/posts/controllers/tags.controller';
import { PostStatus } from '@api/modules/posts/domain/enums/post-status.enum';
import { PostViewsRateLimitGuard } from '@api/modules/posts/guards/post-views-rate-limit.guard';
import { PostViewFingerprintService } from '@api/modules/posts/services/post-view-fingerprint.service';
import { PostsService } from '@api/modules/posts/services/posts.service';

const USER: AuthenticatedUser = {
  email: 'leitor@vavitoarchives.com.br',
  id: '2cc721a8-2db5-4e7f-b68a-d807546b5206',
};
const POST_ID = '957c8388-cb96-4f0c-98b3-56b84c1fe67e';
const AUTHORIZATION = 'Bearer jwt-valido';
const EMPTY_PUBLIC_PAGE = {
  items: [],
  meta: { limit: 12, page: 1, total: 0, totalPages: 0 },
};
const EMPTY_ADMIN_PAGE = {
  items: [],
  meta: { limit: 20, page: 1, total: 0, totalPages: 0 },
};
const ADMIN_DETAIL = {
  content: { content: [], type: 'doc' },
  contentSchemaVersion: 1,
  id: POST_ID,
  status: PostStatus.DRAFT,
  title: 'Post editorial',
};

describe('Endpoints de Posts (e2e)', () => {
  let app: INestApplication;
  let moduleRef: TestingModule;

  const archive = jest.fn();
  const create = jest.fn();
  const deletePost = jest.fn();
  const getAdminDetail = jest.fn();
  const getPublicDetail = jest.fn();
  const listAdmin = jest.fn();
  const listPublic = jest.fn();
  const listRevisions = jest.fn();
  const listTags = jest.fn();
  const publish = jest.fn();
  const registerView = jest.fn();
  const restore = jest.fn();
  const searchPublic = jest.fn();
  const unpublish = jest.fn();
  const update = jest.fn();
  const verify = jest.fn<Promise<AuthenticatedUser>, [string]>();
  const findActiveRoleByProfileId = jest.fn<Promise<UserRole | null>, [string]>();

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      controllers: [PostsController, TagsController, AdminPostsController],
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
        { provide: PostViewsRateLimitGuard, useValue: { canActivate: () => true } },
        {
          provide: PostViewFingerprintService,
          useValue: { createRateLimitKey: (ip: string) => ip },
        },
        {
          provide: PostsService,
          useValue: {
            archive,
            create,
            delete: deletePost,
            getAdminDetail,
            getPublicDetail,
            listAdmin,
            listPublic,
            listRevisions,
            listTags,
            publish,
            registerView,
            restore,
            searchPublic,
            unpublish,
            update,
          },
        },
      ],
    }).compile();
    app = moduleRef.createNestApplication();
    setupErrorHandling(app);
    await app.init();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    verify.mockResolvedValue(USER);
    findActiveRoleByProfileId.mockResolvedValue(UserRole.USER);
    listPublic.mockResolvedValue(EMPTY_PUBLIC_PAGE);
    searchPublic.mockResolvedValue([]);
    getPublicDetail.mockResolvedValue({
      canonicalSlug: 'post-editorial',
      data: { id: POST_ID, slug: 'post-editorial' },
      shouldRedirect: false,
    });
    listTags.mockResolvedValue([]);
    registerView.mockResolvedValue(undefined);
    listAdmin.mockResolvedValue(EMPTY_ADMIN_PAGE);
    listRevisions.mockResolvedValue(EMPTY_ADMIN_PAGE);
    getAdminDetail.mockResolvedValue(ADMIN_DETAIL);
    create.mockResolvedValue({ id: POST_ID });
    update.mockResolvedValue(undefined);
    publish.mockResolvedValue(undefined);
    unpublish.mockResolvedValue(undefined);
    archive.mockResolvedValue(undefined);
    restore.mockResolvedValue(undefined);
    deletePost.mockResolvedValue(undefined);
  });

  afterAll(async () => {
    await app.close();
    await moduleRef.close();
  });

  it('aplica filtros e normalização nos endpoints públicos sem exigir autenticação', async () => {
    const server = app.getHttpServer() as Server;

    await request(server)
      .get('/posts')
      .query({ limit: 24, page: 2, sort: 'popular', tag: 'NestJS' })
      .expect(200);
    await request(server).get('/posts/search').query({ q: '  NESTJS   E   AÇÃO  ' }).expect(200);
    await request(server).get('/posts/post-editorial').expect(200);
    await request(server)
      .post('/posts/post-editorial/views')
      .set('user-agent', 'Vavito Browser')
      .expect(202);
    await request(server).get('/tags').expect(200);

    expect(listPublic).toHaveBeenCalledWith({
      limit: 24,
      page: 2,
      sort: 'popular',
      tag: 'nestjs',
    });
    expect(searchPublic).toHaveBeenCalledWith({ q: 'nestjs e ação' });
    expect(getPublicDetail).toHaveBeenCalledWith('post-editorial');
    expect(registerView).toHaveBeenCalledWith(
      'post-editorial',
      expect.objectContaining({ userAgent: 'Vavito Browser' }),
    );
    expect(listTags).toHaveBeenCalledTimes(1);
    expect(verify).not.toHaveBeenCalled();
    expect(findActiveRoleByProfileId).not.toHaveBeenCalled();
  });

  it('rejeita filtros e buscas públicas fora do contrato', async () => {
    const server = app.getHttpServer() as Server;

    await request(server).get('/posts').query({ limit: 25 }).expect(400);
    await request(server).get('/posts/search').query({ q: '   ' }).expect(400);

    expect(listPublic).not.toHaveBeenCalled();
    expect(searchPublic).not.toHaveBeenCalled();
  });

  it('bloqueia USER em todos os endpoints administrativos de Posts', async () => {
    const server = app.getHttpServer() as Server;
    const requests = [
      () => request(server).get('/admin/posts'),
      () => request(server).get(`/admin/posts/${POST_ID}`),
      () => request(server).get(`/admin/posts/${POST_ID}/revisions`),
      () => request(server).post('/admin/posts').send({ title: 'Novo post' }),
      () => request(server).patch(`/admin/posts/${POST_ID}`).send({ title: 'Post atualizado' }),
      () => request(server).post(`/admin/posts/${POST_ID}/publish`),
      () => request(server).post(`/admin/posts/${POST_ID}/unpublish`),
      () => request(server).post(`/admin/posts/${POST_ID}/archive`),
      () => request(server).post(`/admin/posts/${POST_ID}/restore`),
      () => request(server).delete(`/admin/posts/${POST_ID}`).send({ confirm: true }),
    ];

    for (const createRequest of requests) {
      await createRequest().set('authorization', AUTHORIZATION).expect(403);
    }

    expect(verify).toHaveBeenCalledTimes(requests.length);
    expect(findActiveRoleByProfileId).toHaveBeenCalledTimes(requests.length);
    expect(listAdmin).not.toHaveBeenCalled();
    expect(getAdminDetail).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
    expect(publish).not.toHaveBeenCalled();
    expect(unpublish).not.toHaveBeenCalled();
    expect(archive).not.toHaveBeenCalled();
    expect(restore).not.toHaveBeenCalled();
    expect(deletePost).not.toHaveBeenCalled();
  });

  it('permite que ADMIN percorra o fluxo editorial completo', async () => {
    const server = app.getHttpServer() as Server;
    findActiveRoleByProfileId.mockResolvedValue(UserRole.ADMIN);

    await request(server)
      .get('/admin/posts')
      .query({ limit: 100, page: 2, q: '  NestJS  ', status: PostStatus.PUBLISHED })
      .set('authorization', AUTHORIZATION)
      .expect(200);
    await request(server)
      .get(`/admin/posts/${POST_ID}`)
      .set('authorization', AUTHORIZATION)
      .expect(200);
    await request(server)
      .get(`/admin/posts/${POST_ID}/revisions`)
      .set('authorization', AUTHORIZATION)
      .expect(200);
    await request(server)
      .post('/admin/posts')
      .set('authorization', AUTHORIZATION)
      .send({ title: 'Novo post' })
      .expect(201);
    await request(server)
      .patch(`/admin/posts/${POST_ID}`)
      .set('authorization', AUTHORIZATION)
      .send({ title: 'Post atualizado' })
      .expect(200);

    for (const action of ['publish', 'unpublish', 'archive', 'restore'] as const) {
      await request(server)
        .post(`/admin/posts/${POST_ID}/${action}`)
        .set('authorization', AUTHORIZATION)
        .expect(200);
    }

    await request(server)
      .delete(`/admin/posts/${POST_ID}`)
      .set('authorization', AUTHORIZATION)
      .send({ confirm: true })
      .expect(204);

    expect(listAdmin).toHaveBeenCalledWith(USER.id, {
      limit: 100,
      page: 2,
      q: 'NestJS',
      status: PostStatus.PUBLISHED,
    });
    expect(getAdminDetail).toHaveBeenCalledWith(USER.id, POST_ID);
    expect(listRevisions).toHaveBeenCalledWith(USER.id, POST_ID, { limit: 20, page: 1 });
    expect(create).toHaveBeenCalledWith(USER.id, { title: 'Novo post' });
    expect(update).toHaveBeenCalledWith(USER.id, POST_ID, { title: 'Post atualizado' });
    expect(publish).toHaveBeenCalledWith(USER.id, POST_ID);
    expect(unpublish).toHaveBeenCalledWith(USER.id, POST_ID);
    expect(archive).toHaveBeenCalledWith(USER.id, POST_ID);
    expect(restore).toHaveBeenCalledWith(USER.id, POST_ID);
    expect(deletePost).toHaveBeenCalledWith(USER.id, POST_ID);
  });
});
