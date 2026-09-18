import type { PrismaService } from '@api/core/database/prisma.service';
import { Prisma } from '@api/generated/prisma/client';
import type { Post } from '@api/modules/posts/domain/entities/post.entity';
import { PrismaPostsRepository } from '@api/modules/posts/repositories/prisma-posts.repository';

describe('ordenação pública no repositório', () => {
  it.each([
    ['recent', { publishedAt: 'desc' }],
    ['oldest', { publishedAt: 'asc' }],
    ['popular', { viewsCount: 'desc' }],
    ['least-viewed', { viewsCount: 'asc' }],
  ] as const)('aplica %s com desempate, paginação e filtro', async (sort, order) => {
    const findMany = jest.fn().mockResolvedValue([]);
    const prisma = {
      post: { count: jest.fn().mockResolvedValue(0), findMany },
      $transaction: (queries: Promise<unknown>[]) => Promise.all(queries),
    } as unknown as PrismaService;
    const repository = new PrismaPostsRepository(prisma);
    await repository.listPublic({ limit: 12, page: 2, sort, tag: 'typescript' });
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [order, { id: 'asc' }],
        skip: 12,
        take: 12,
        where: { status: 'PUBLISHED', tags: { some: { tag: { slug: 'typescript' } } } },
      }),
    );
  });
});

describe('tópicos públicos no repositório', () => {
  it('considera apenas tópicos públicos com artigo publicado', async () => {
    const findMany = jest.fn().mockResolvedValue([]);
    const prisma = { tag: { findMany } } as unknown as PrismaService;
    const repository = new PrismaPostsRepository(prisma);

    await repository.listTags();

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          isPublic: true,
          posts: { some: { post: { status: 'PUBLISHED' } } },
        },
      }),
    );
  });
});

describe('capa do post no repositório', () => {
  function editablePost(): Post {
    return {
      archivedAt: null,
      content: { document: { content: [], type: 'doc' } },
      contentSchemaVersion: 1,
      currentSlug: null,
      editedAt: null,
      excerpt: null,
      id: '957c8388-cb96-4f0c-98b3-56b84c1fe67e',
      publishedAt: null,
      readingTimeMinutes: 0,
      seoDescription: null,
      seoTitle: null,
      status: 'DRAFT',
      title: '',
      updatedAt: new Date('2026-09-07T12:00:00.000Z'),
      viewsCount: 0,
    } as unknown as Post;
  }

  it('substitui a capa dentro da mesma transação da atualização', async () => {
    const deleteMany = jest.fn().mockResolvedValue({ count: 1 });
    const create = jest.fn().mockResolvedValue({});
    const transaction = {
      post: { update: jest.fn().mockResolvedValue({}) },
      postMediaAsset: { create, deleteMany },
      postSlug: {
        findFirst: jest.fn().mockResolvedValue(null),
        findUnique: jest.fn().mockResolvedValue(null),
      },
    };
    const prisma = {
      $transaction: (operation: (client: typeof transaction) => Promise<void>) =>
        operation(transaction),
    } as unknown as PrismaService;
    const repository = new PrismaPostsRepository(prisma);
    const coverMediaId = '3bf68fd9-56cb-4dde-85e1-574484fc9dcc';

    await repository.update(editablePost(), {
      coverMediaId,
      coverPositionX: 35,
      coverPositionY: 70,
      coverScale: 125,
    });

    expect(deleteMany).toHaveBeenCalledWith({
      where: {
        postId: '957c8388-cb96-4f0c-98b3-56b84c1fe67e',
        usage: 'COVER',
      },
    });
    expect(create).toHaveBeenCalledWith({
      data: {
        displayPositionX: 35,
        displayPositionY: 70,
        displayScale: 125,
        mediaAssetId: coverMediaId,
        postId: '957c8388-cb96-4f0c-98b3-56b84c1fe67e',
        usage: 'COVER',
      },
    });
  });
});

describe('alterações pendentes no repositório', () => {
  it('remove o documento pendente e sua data editorial', async () => {
    const update = jest.fn().mockResolvedValue({});
    const prisma = { post: { update } } as unknown as PrismaService;
    const repository = new PrismaPostsRepository(prisma);

    await repository.clearPendingDraft('957c8388-cb96-4f0c-98b3-56b84c1fe67e');

    expect(update).toHaveBeenCalledWith({
      data: { pendingDraft: Prisma.DbNull, pendingEditedAt: null },
      where: { id: '957c8388-cb96-4f0c-98b3-56b84c1fe67e' },
    });
  });
});
