import type { ProfileAuthorizationRepository } from '@api/core/auth/repositories/profile-authorization.repository';
import { ForbiddenAccessException } from '@api/core/auth/errors/forbidden-access.exception';
import { ApplicationException } from '@api/core/http/exceptions/application.exception';
import { UserRole } from '@api/generated/prisma/client';
import { Post } from '@api/modules/posts/domain/entities/post.entity';
import { PostStatus } from '@api/modules/posts/domain/enums/post-status.enum';
import { PostContent } from '@api/modules/posts/domain/value-objects/post-content.value-object';
import { Slug } from '@api/modules/posts/domain/value-objects/slug.value-object';
import { PublicPostsSort } from '@api/modules/posts/dto/query/list-public-posts-query.dto';
import { PostNotFoundException } from '@api/modules/posts/errors/post-not-found.exception';
import { SlugAlreadyExistsException } from '@api/modules/posts/errors/slug-already-exists.exception';
import type {
  PostAggregateRecord,
  PostsRepository,
} from '@api/modules/posts/repositories/posts.repository';
import { PostsService } from '@api/modules/posts/services/posts.service';

const AUTHOR_ID = 'ad4ce1ef-339f-45dc-bb91-a2f7ffbf3026';
const ADMIN_ID = '4ef89da4-7cd3-48e4-972a-7855f24d9da7';
const OTHER_ID = '3bf68fd9-56cb-4dde-85e1-574484fc9dcc';
const POST_ID = '957c8388-cb96-4f0c-98b3-56b84c1fe67e';
const NOW = new Date('2026-08-17T16:00:00.000Z');
const DOCUMENT = {
  content: [{ content: [{ text: 'Conteúdo publicado', type: 'text' }], type: 'paragraph' }],
  type: 'doc',
};

function post(status: PostStatus = PostStatus.DRAFT): Post {
  return Post.restore({
    archivedAt: status === PostStatus.ARCHIVED ? new Date('2026-08-17T14:00:00.000Z') : null,
    authorId: AUTHOR_ID,
    content: PostContent.create(DOCUMENT, 1),
    createdAt: new Date('2026-08-17T10:00:00.000Z'),
    currentSlug: Slug.create('post-original'),
    editedAt: null,
    excerpt: 'Resumo do post.',
    id: POST_ID,
    publishedAt: status === PostStatus.PUBLISHED ? new Date('2026-08-17T12:00:00.000Z') : null,
    readingTimeMinutes: 1,
    seoDescription: null,
    seoTitle: null,
    status,
    title: 'Post original',
    updatedAt: new Date('2026-08-17T12:00:00.000Z'),
    viewsCount: 0,
  });
}

function aggregate(restoredPost: Post): PostAggregateRecord {
  return {
    author: { displayName: 'Autora', id: AUTHOR_ID },
    cover: null,
    post: restoredPost,
    tags: [],
  };
}

describe('PostsService', () => {
  const create = jest.fn();
  const deletePost = jest.fn();
  const findById = jest.fn();
  const findBySlug = jest.fn();
  const findSlugOwner = jest.fn();
  const listAdmin = jest.fn();
  const listPublic = jest.fn();
  const listRevisions = jest.fn();
  const listTags = jest.fn();
  const update = jest.fn();
  const findActiveRoleByProfileId = jest.fn();
  const repository = {
    create,
    delete: deletePost,
    findById,
    findBySlug,
    findSlugOwner,
    listAdmin,
    listPublic,
    listRevisions,
    listTags,
    update,
  } as unknown as PostsRepository;
  const authorizationRepository = {
    findActiveRoleByProfileId,
  } as unknown as ProfileAuthorizationRepository;
  const service = new PostsService(repository, authorizationRepository);

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers().setSystemTime(NOW);
    findActiveRoleByProfileId.mockResolvedValue(UserRole.USER);
    findSlugOwner.mockResolvedValue(null);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('cria um rascunho para um autor ativo após validar o slug', async () => {
    const created = await service.create(AUTHOR_ID, {
      slug: 'Meu Primeiro Post',
      title: 'Meu primeiro post',
    });

    expect(findSlugOwner).toHaveBeenCalledWith('meu-primeiro-post');
    expect(create).toHaveBeenCalledWith(created);
    expect(created).toMatchObject({
      authorId: AUTHOR_ID,
      readingTimeMinutes: 0,
      status: PostStatus.DRAFT,
      title: 'Meu primeiro post',
    });
    expect(created.currentSlug?.value).toBe('meu-primeiro-post');
  });

  it('lista posts públicos com resposta e metadados do contrato', async () => {
    listPublic.mockResolvedValueOnce({
      items: [
        {
          cover: null,
          excerpt: 'Resumo do post.',
          id: POST_ID,
          publishedAt: new Date('2026-08-17T12:00:00.000Z'),
          readingTimeMinutes: 1,
          slug: 'post-original',
          tags: [{ id: OTHER_ID, name: 'NestJS', slug: 'nestjs' }],
          title: 'Post original',
          viewsCount: 12,
        },
      ],
      total: 25,
    });

    await expect(
      service.listPublic({ limit: 12, page: 2, sort: PublicPostsSort.RECENT }),
    ).resolves.toEqual({
      items: [
        expect.objectContaining({ id: POST_ID, slug: 'post-original', viewCount: 12 }),
      ],
      meta: { limit: 12, page: 2, total: 25, totalPages: 3 },
    });
  });

  it('retorna detalhe público e sinaliza redirecionamento de slug histórico', async () => {
    findBySlug.mockResolvedValueOnce({
      ...aggregate(post(PostStatus.PUBLISHED)),
      reactionCounts: { dislike: 1, like: 4 },
      requestedSlug: 'post-antigo',
      requestedSlugIsCurrent: false,
    });

    await expect(service.getPublicDetail('post-antigo')).resolves.toMatchObject({
      canonicalSlug: 'post-original',
      data: {
        id: POST_ID,
        reactionCounts: { dislike: 1, like: 4 },
        viewer: null,
      },
      shouldRedirect: true,
    });
  });

  it('restringe listagem administrativa a perfil ADMIN', async () => {
    listAdmin.mockResolvedValueOnce({ items: [], total: 0 });

    await expect(service.listAdmin(AUTHOR_ID, { limit: 20, page: 1 })).rejects.toBeInstanceOf(
      ForbiddenAccessException,
    );

    findActiveRoleByProfileId.mockResolvedValueOnce(UserRole.ADMIN);
    await expect(service.listAdmin(ADMIN_ID, { limit: 20, page: 1 })).resolves.toEqual({
      items: [],
      meta: { limit: 20, page: 1, total: 0, totalPages: 0 },
    });
  });

  it('rejeita a criação quando outro post já possui o slug normalizado', async () => {
    findSlugOwner.mockResolvedValueOnce({ isCurrent: true, postId: OTHER_ID });

    await expect(service.create(AUTHOR_ID, { slug: 'Slug ocupado' })).rejects.toBeInstanceOf(
      SlugAlreadyExistsException,
    );
    expect(create).not.toHaveBeenCalled();
  });

  it('edita um rascunho do autor e persiste tags normalizadas na mesma operação', async () => {
    const restoredPost = post();
    findById.mockResolvedValueOnce(aggregate(restoredPost));

    const result = await service.update(AUTHOR_ID, POST_ID, {
      content: {
        content: [{ content: [{ text: 'Texto novo', type: 'text' }], type: 'paragraph' }],
        type: 'doc',
      },
      slug: 'Post Atualizado',
      tagNames: ['  Arquitetura  ', 'TypeScript'],
      title: 'Post atualizado',
    });

    expect(result.title).toBe('Post atualizado');
    expect(result.currentSlug?.value).toBe('post-atualizado');
    expect(result.readingTimeMinutes).toBe(1);
    expect(update).toHaveBeenCalledWith(restoredPost, {
      tags: [
        { name: 'Arquitetura', slug: 'arquitetura' },
        { name: 'TypeScript', slug: 'typescript' },
      ],
    });
  });

  it('permite que admin edite post alheio e solicita revisão da versão publicada', async () => {
    const restoredPost = post(PostStatus.PUBLISHED);
    findById.mockResolvedValueOnce(aggregate(restoredPost));
    findActiveRoleByProfileId.mockResolvedValueOnce(UserRole.ADMIN);

    await service.update(ADMIN_ID, POST_ID, { excerpt: 'Resumo revisado.' });

    expect(restoredPost.editedAt).toEqual(NOW);
    expect(update).toHaveBeenCalledWith(restoredPost, {
      revision: { createdAt: NOW, editorId: ADMIN_ID },
    });
  });

  it('rejeita alteração por usuário que não é autor', async () => {
    findById.mockResolvedValueOnce(aggregate(post()));

    await expect(service.archive(OTHER_ID, POST_ID)).rejects.toBeInstanceOf(
      ForbiddenAccessException,
    );
    expect(update).not.toHaveBeenCalled();
  });

  it('publica o rascunho somente quando o slug continua disponível', async () => {
    const restoredPost = post();
    findById.mockResolvedValueOnce(aggregate(restoredPost));

    const published = await service.publish(AUTHOR_ID, POST_ID);

    expect(findSlugOwner).toHaveBeenCalledWith('post-original');
    expect(published.status).toBe(PostStatus.PUBLISHED);
    expect(update).toHaveBeenCalledWith(restoredPost);
  });

  it('não exclui permanentemente um post publicado', async () => {
    findById.mockResolvedValueOnce(aggregate(post(PostStatus.PUBLISHED)));

    const result = service.delete(AUTHOR_ID, POST_ID);
    await expect(result).rejects.toBeInstanceOf(ApplicationException);
    await expect(result).rejects.toMatchObject({ code: 'POST_DELETE_NOT_ALLOWED' });
    expect(deletePost).not.toHaveBeenCalled();
  });

  it('responde como não encontrado sem chamar persistência', async () => {
    findById.mockResolvedValueOnce(null);

    await expect(service.restore(AUTHOR_ID, POST_ID)).rejects.toBeInstanceOf(PostNotFoundException);
    expect(update).not.toHaveBeenCalled();
  });
});
