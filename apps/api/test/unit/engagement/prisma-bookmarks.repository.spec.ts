import type { PrismaService } from '@api/core/database/prisma.service';
import type { Bookmark as PrismaBookmark, Prisma } from '@api/generated/prisma/client';
import { MediaUsageType, PostStatus as PrismaPostStatus } from '@api/generated/prisma/client';
import { Bookmark } from '@api/modules/engagement/domain/entities/bookmark.entity';
import { PrismaBookmarksRepository } from '@api/modules/engagement/repositories/prisma-bookmarks.repository';

const PROFILE_ID = '3d46ab51-60b3-4604-a5f1-e2c403cb75f8';
const POST_ID = '9de46532-a170-46c0-90dd-0b3cbf7794be';
const BOOKMARK_ID = 'df23c92d-71e4-400b-805e-975bbc3e1788';
const CREATED_AT = new Date('2026-08-24T10:00:00.000Z');
const PUBLISHED_AT = new Date('2026-08-20T10:00:00.000Z');

type TransactionCallback = (transaction: Prisma.TransactionClient) => Promise<unknown>;
type TransactionInput = TransactionCallback | Promise<unknown>[];

function bookmarkRecord(): PrismaBookmark {
  return {
    createdAt: CREATED_AT,
    id: BOOKMARK_ID,
    postId: POST_ID,
    profileId: PROFILE_ID,
  };
}

function bookmark(): Bookmark {
  return Bookmark.create({
    id: BOOKMARK_ID,
    now: CREATED_AT,
    postId: POST_ID,
    profileId: PROFILE_ID,
  });
}

function bookmarkedPostRecord() {
  return {
    post: {
      excerpt: 'Resumo publicado.',
      id: POST_ID,
      mediaAssets: [
        {
          mediaAsset: {
            altText: 'Capa do artigo',
            id: 'media-id',
            storagePath: 'posts/capa.webp',
          },
        },
      ],
      publishedAt: PUBLISHED_AT,
      readingTimeMinutes: 4,
      slugs: [{ slug: 'artigo-publicado' }],
      tags: [{ tag: { id: 'tag-id', name: 'NestJS', slug: 'nestjs' } }],
      title: 'Artigo publicado',
      viewsCount: 12,
    },
  };
}

describe('PrismaBookmarksRepository', () => {
  const postFindFirst = jest.fn<Promise<{ id: string } | null>, [Prisma.PostFindFirstArgs]>();
  const findUnique = jest.fn<Promise<PrismaBookmark | null>, [Prisma.BookmarkFindUniqueArgs]>();
  const create = jest.fn<Promise<PrismaBookmark>, [Prisma.BookmarkCreateArgs]>();
  const deleteMany = jest.fn<Promise<{ count: number }>, [Prisma.BookmarkDeleteManyArgs]>();
  const count = jest.fn<Promise<number>, [Prisma.BookmarkCountArgs]>();
  const findMany = jest.fn<Promise<unknown[]>, [Prisma.BookmarkFindManyArgs]>();
  const transactionClient = {
    bookmark: { create, findUnique },
    post: { findFirst: postFindFirst },
  } as unknown as Prisma.TransactionClient;
  const transaction = jest.fn<
    Promise<unknown>,
    [TransactionInput, { isolationLevel: 'Serializable' }?]
  >();
  const prisma = {
    $transaction: transaction,
    bookmark: { count, deleteMany, findMany },
  } as unknown as PrismaService;
  const repository = new PrismaBookmarksRepository(prisma);

  beforeEach(() => {
    jest.clearAllMocks();
    transaction.mockImplementation((input) =>
      Array.isArray(input) ? Promise.all(input) : input(transactionClient),
    );
    postFindFirst.mockResolvedValue({ id: POST_ID });
  });

  it('salva o primeiro bookmark em post publicado', async () => {
    findUnique.mockResolvedValue(null);
    create.mockResolvedValue(bookmarkRecord());

    await expect(repository.save(bookmark())).resolves.toMatchObject({
      bookmark: { id: BOOKMARK_ID, postId: POST_ID, profileId: PROFILE_ID },
      postExists: true,
    });
    expect(postFindFirst).toHaveBeenCalledWith({
      select: { id: true },
      where: { id: POST_ID, status: PrismaPostStatus.PUBLISHED },
    });
    expect(create.mock.calls[0]?.[0].data).toEqual(bookmarkRecord());
    expect(transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: 'Serializable',
    });
  });

  it('mantém o bookmark existente sem criar duplicidade', async () => {
    findUnique.mockResolvedValue(bookmarkRecord());

    await expect(repository.save(bookmark())).resolves.toMatchObject({
      bookmark: { id: BOOKMARK_ID },
      postExists: true,
    });
    expect(create).not.toHaveBeenCalled();
  });

  it('não salva post ausente ou não publicado', async () => {
    postFindFirst.mockResolvedValue(null);

    await expect(repository.save(bookmark())).resolves.toEqual({
      bookmark: null,
      postExists: false,
    });
    expect(findUnique).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });

  it('repete a transação serializável após conflito', async () => {
    transaction.mockRejectedValueOnce({ code: 'P2034' });
    findUnique.mockResolvedValue(bookmarkRecord());

    await expect(repository.save(bookmark())).resolves.toMatchObject({ postExists: true });
    expect(transaction).toHaveBeenCalledTimes(2);
  });

  it('remove o bookmark de forma idempotente', async () => {
    deleteMany.mockResolvedValue({ count: 0 });

    await expect(repository.remove(PROFILE_ID, POST_ID)).resolves.toBeUndefined();
    expect(deleteMany).toHaveBeenCalledWith({ where: { postId: POST_ID, profileId: PROFILE_ID } });
  });

  it('lista somente posts publicados do perfil com paginação estável', async () => {
    count.mockResolvedValue(1);
    findMany.mockResolvedValue([bookmarkedPostRecord()]);

    await expect(repository.list({ limit: 12, page: 2, profileId: PROFILE_ID })).resolves.toEqual({
      items: [
        {
          cover: {
            altText: 'Capa do artigo',
            id: 'media-id',
            storagePath: 'posts/capa.webp',
          },
          excerpt: 'Resumo publicado.',
          id: POST_ID,
          publishedAt: PUBLISHED_AT,
          readingTimeMinutes: 4,
          slug: 'artigo-publicado',
          tags: [{ id: 'tag-id', name: 'NestJS', slug: 'nestjs' }],
          title: 'Artigo publicado',
          viewsCount: 12,
        },
      ],
      total: 1,
    });

    expect(findMany.mock.calls[0]?.[0]).toMatchObject({
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      skip: 12,
      take: 12,
      where: {
        post: { status: PrismaPostStatus.PUBLISHED },
        profileId: PROFILE_ID,
      },
    });
    expect(findMany.mock.calls[0]?.[0].select?.post).toMatchObject({
      select: {
        mediaAssets: { take: 1, where: { usage: MediaUsageType.COVER } },
        slugs: { take: 1, where: { isCurrent: true } },
      },
    });
  });
});
