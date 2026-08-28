import { HttpStatus } from '@nestjs/common';
import { HTTP_CODE_METADATA } from '@nestjs/common/constants';
import { THROTTLER_LIMIT } from '@nestjs/throttler/dist/throttler.constants';

import {
  PUBLIC_ROUTE_METADATA_KEY,
  ROLES_METADATA_KEY,
} from '@api/core/auth/constants/auth.constants';
import { RATE_LIMITS } from '@api/core/http/security/http-security.constants';
import { UserRole } from '@api/generated/prisma/client';
import { AdminPostsController } from '@api/modules/posts/controllers/admin-posts.controller';
import { PostsController } from '@api/modules/posts/controllers/posts.controller';
import { TagsController } from '@api/modules/posts/controllers/tags.controller';
import { PublicPostsSort } from '@api/modules/posts/dto/query/list-public-posts-query.dto';
import type { PostAdminDetailDto } from '@api/modules/posts/dto/response/post-admin-response.dto';
import type { PostDetailResponseDto } from '@api/modules/posts/dto/response/post-detail-response.dto';
import type { PostsService } from '@api/modules/posts/services/posts.service';

const ADMIN_ID = '4ef89da4-7cd3-48e4-972a-7855f24d9da7';
const POST_ID = '957c8388-cb96-4f0c-98b3-56b84c1fe67e';
const USER = { email: 'admin@example.com', id: ADMIN_ID };

function services() {
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
  const restore = jest.fn();
  const registerView = jest.fn();
  const searchPublic = jest.fn();
  const unpublish = jest.fn();
  const update = jest.fn();
  const service = {
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
    restore,
    registerView,
    searchPublic,
    unpublish,
    update,
  } as unknown as PostsService;

  return {
    archive,
    create,
    deletePost,
    getAdminDetail,
    getPublicDetail,
    listAdmin,
    listPublic,
    listRevisions,
    listTags,
    publish,
    restore,
    registerView,
    searchPublic,
    service,
    unpublish,
    update,
  };
}

describe('Controllers de Posts', () => {
  it('declara leitura pública e administração exclusiva para ADMIN', () => {
    expect(Reflect.getMetadata(PUBLIC_ROUTE_METADATA_KEY, PostsController)).toBe(true);
    expect(Reflect.getMetadata(PUBLIC_ROUTE_METADATA_KEY, TagsController)).toBe(true);
    expect(Reflect.getMetadata(ROLES_METADATA_KEY, AdminPostsController)).toEqual([UserRole.ADMIN]);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(Reflect.getMetadata(HTTP_CODE_METADATA, PostsController.prototype.registerView)).toBe(
      HttpStatus.ACCEPTED,
    );
    expect(
      // eslint-disable-next-line @typescript-eslint/unbound-method
      Reflect.getMetadata(`${THROTTLER_LIMIT}default`, PostsController.prototype.registerView),
    ).toBe(RATE_LIMITS.postViews.limit);
    expect(
      // eslint-disable-next-line @typescript-eslint/unbound-method
      Reflect.getMetadata(`${THROTTLER_LIMIT}default`, PostsController.prototype.search),
    ).toBe(RATE_LIMITS.postSearch.limit);
  });

  it('lista posts públicos e tags por meio do service', async () => {
    const mocks = services();
    const postsController = new PostsController(mocks.service);
    const tagsController = new TagsController(mocks.service);
    const query = { limit: 12, page: 1, sort: PublicPostsSort.RECENT };
    const posts = { items: [], meta: { limit: 12, page: 1, total: 0, totalPages: 0 } };
    const tags = [{ id: POST_ID, name: 'NestJS', publishedPostCount: 1, slug: 'nestjs' }];
    mocks.listPublic.mockResolvedValueOnce(posts);
    mocks.listTags.mockResolvedValueOnce(tags);

    await expect(postsController.list(query)).resolves.toEqual(posts);
    await expect(tagsController.list()).resolves.toEqual(tags);
  });

  it('busca posts públicos antes da rota dinâmica de slug', async () => {
    const mocks = services();
    const controller = new PostsController(mocks.service);
    const results = [{ id: POST_ID }];
    mocks.searchPublic.mockResolvedValueOnce(results);

    await expect(controller.search({ q: 'nestjs' })).resolves.toBe(results);
    expect(mocks.searchPublic).toHaveBeenCalledWith({ q: 'nestjs' });
  });

  it('marca slug histórico com redirecionamento permanente para a rota canônica', async () => {
    const mocks = services();
    const controller = new PostsController(mocks.service);
    const detail = { id: POST_ID } as PostDetailResponseDto;
    const response = {
      location: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    };
    mocks.getPublicDetail.mockResolvedValueOnce({
      canonicalSlug: 'slug-atual',
      data: detail,
      shouldRedirect: true,
    });

    await expect(controller.getBySlug('slug-antigo', response)).resolves.toBe(detail);
    expect(response.status).toHaveBeenCalledWith(HttpStatus.PERMANENT_REDIRECT);
    expect(response.location).toHaveBeenCalledWith('/api/v1/posts/slug-atual');
  });

  it('registra visualização usando apenas o sinal técnico extraído da requisição', async () => {
    const mocks = services();
    const controller = new PostsController(mocks.service);

    await controller.registerView('post-publicado', {
      headers: { 'user-agent': 'Vavito Browser' },
      ip: '203.0.113.10',
    });

    expect(mocks.registerView).toHaveBeenCalledWith('post-publicado', {
      ip: '203.0.113.10',
      userAgent: 'Vavito Browser',
    });
  });

  it('cria o post e devolve o detalhe administrativo persistido', async () => {
    const mocks = services();
    const controller = new AdminPostsController(mocks.service);
    const detail = { id: POST_ID } as PostAdminDetailDto;
    mocks.create.mockResolvedValueOnce({ id: POST_ID });
    mocks.getAdminDetail.mockResolvedValueOnce(detail);

    await expect(controller.create(USER, { title: 'Novo post' })).resolves.toBe(detail);
    expect(mocks.create).toHaveBeenCalledWith(ADMIN_ID, { title: 'Novo post' });
    expect(mocks.getAdminDetail).toHaveBeenCalledWith(ADMIN_ID, POST_ID);
  });

  it.each([
    ['archive', 'archive'],
    ['publish', 'publish'],
    ['restore', 'restore'],
    ['unpublish', 'unpublish'],
  ] as const)('executa a transição %s e devolve o estado persistido', async (method, mockName) => {
    const mocks = services();
    const controller = new AdminPostsController(mocks.service);
    const detail = { id: POST_ID } as PostAdminDetailDto;
    mocks.getAdminDetail.mockResolvedValueOnce(detail);

    await expect(controller[method](USER, POST_ID)).resolves.toBe(detail);
    expect(mocks[mockName]).toHaveBeenCalledWith(ADMIN_ID, POST_ID);
  });

  it('exige confirmação tipada e delega a exclusão permanente', async () => {
    const mocks = services();
    const controller = new AdminPostsController(mocks.service);

    await controller.delete(USER, POST_ID, { confirm: true });

    expect(mocks.deletePost).toHaveBeenCalledWith(ADMIN_ID, POST_ID);
  });
});
