import type { PrismaService } from '@api/core/database/prisma.service';
import type { Prisma } from '@api/generated/prisma/client';
import { CommentStatus as PrismaCommentStatus } from '@api/generated/prisma/client';
import { Comment } from '@api/modules/comments/domain/entities/comment.entity';
import { CommentStatus } from '@api/modules/comments/domain/enums/comment-status.enum';
import { CommentContent } from '@api/modules/comments/domain/value-objects/comment-content.value-object';
import { PrismaCommentsRepository } from '@api/modules/comments/repositories/prisma-comments.repository';

const COMMENT_ID = 'df23c92d-71e4-400b-805e-975bbc3e1788';
const REPLY_ID = 'c2651d6f-986b-4c6b-a775-10fab6ff5575';
const POST_ID = '9de46532-a170-46c0-90dd-0b3cbf7794be';
const AUTHOR_ID = '3d46ab51-60b3-4604-a5f1-e2c403cb75f8';
const CREATED_AT = new Date('2026-08-22T10:00:00.000Z');

function commentRecord(overrides: Record<string, unknown> = {}) {
  return {
    authorId: AUTHOR_ID,
    content: 'Comentário válido.',
    createdAt: CREATED_AT,
    deletedAt: null,
    editedAt: null,
    id: COMMENT_ID,
    moderationReason: null,
    parentId: null,
    postId: POST_ID,
    status: PrismaCommentStatus.VISIBLE,
    updatedAt: CREATED_AT,
    ...overrides,
  };
}

function comment(): Comment {
  return Comment.create({
    authorId: AUTHOR_ID,
    content: CommentContent.create('Comentário válido.'),
    id: COMMENT_ID,
    now: CREATED_AT,
    postId: POST_ID,
  });
}

describe('PrismaCommentsRepository', () => {
  const create = jest.fn<Promise<unknown>, [Prisma.CommentCreateArgs]>();
  const count = jest.fn<Promise<number>, [Prisma.CommentCountArgs]>();
  const findFirst = jest.fn<Promise<unknown>, [Prisma.CommentFindFirstArgs]>();
  const findMany = jest.fn<Promise<unknown[]>, [Prisma.CommentFindManyArgs]>();
  const findUnique = jest.fn<Promise<unknown>, [Prisma.CommentFindUniqueArgs]>();
  const update = jest.fn<Promise<unknown>, [Prisma.CommentUpdateArgs]>();
  const transaction = jest.fn(async (operations: Promise<unknown>[]) => Promise.all(operations));
  const prisma = {
    $transaction: transaction,
    comment: { count, create, findFirst, findMany, findUnique, update },
  } as unknown as PrismaService;
  const repository = new PrismaCommentsRepository(prisma);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('persiste o agregado por meio do mapper', async () => {
    await repository.create(comment());

    expect(create).toHaveBeenCalledTimes(1);
    expect(create.mock.calls[0]?.[0].data).toMatchObject({
      content: 'Comentário válido.',
      id: COMMENT_ID,
      status: PrismaCommentStatus.VISIBLE,
    });
  });

  it('consulta o comentário com projeção segura do autor', async () => {
    findUnique.mockResolvedValueOnce({
      ...commentRecord(),
      author: { avatarPath: 'avatars/autor.webp', displayName: 'Autor', id: AUTHOR_ID },
    });

    await expect(repository.findById(COMMENT_ID)).resolves.toMatchObject({
      author: { avatarPath: 'avatars/autor.webp', displayName: 'Autor', id: AUTHOR_ID },
      comment: { id: COMMENT_ID },
    });

    const select = findUnique.mock.calls[0]?.[0].select;
    expect(select?.author).toEqual({
      select: { avatarPath: true, displayName: true, id: true },
    });
    expect(JSON.stringify(select)).not.toContain('email');
  });

  it('encontra somente pai principal do mesmo post', async () => {
    findFirst.mockResolvedValueOnce(null);

    await expect(repository.findReplyParent(COMMENT_ID, POST_ID)).resolves.toBeNull();
    expect(findFirst).toHaveBeenCalledTimes(1);
    expect(findFirst.mock.calls[0]?.[0].where).toEqual({
      id: COMMENT_ID,
      parentId: null,
      postId: POST_ID,
    });
  });

  it('pagina raízes públicas e carrega apenas respostas diretas visíveis', async () => {
    count.mockResolvedValueOnce(1);
    findMany.mockResolvedValueOnce([
      {
        ...commentRecord(),
        author: { avatarPath: null, displayName: 'Autor', id: AUTHOR_ID },
        replies: [
          {
            ...commentRecord({ id: REPLY_ID, parentId: COMMENT_ID }),
            author: null,
          },
        ],
      },
    ]);

    await expect(
      repository.listPublicThreads({ limit: 20, page: 2, postId: POST_ID }),
    ).resolves.toMatchObject({
      items: [
        {
          comment: { id: COMMENT_ID },
          replies: [{ author: null, comment: { id: REPLY_ID } }],
        },
      ],
      total: 1,
    });

    const query = findMany.mock.calls[0]?.[0];
    expect(query).toBeDefined();
    if (!query) {
      throw new Error('Public comments query was not executed.');
    }

    expect(query.skip).toBe(20);
    expect(query.take).toBe(20);
    expect(query.where).toEqual({
      OR: [
        { status: PrismaCommentStatus.VISIBLE },
        {
          replies: { some: { status: PrismaCommentStatus.VISIBLE } },
          status: PrismaCommentStatus.DELETED,
        },
      ],
      parentId: null,
      postId: POST_ID,
    });
    expect(query.select?.replies).toMatchObject({
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      where: { status: PrismaCommentStatus.VISIBLE },
    });
    expect(JSON.stringify(query.select?.replies)).not.toContain('"replies"');
  });

  it('filtra a fila administrativa com paginação e ordem estável', async () => {
    count.mockResolvedValueOnce(0);
    findMany.mockResolvedValueOnce([]);

    await expect(
      repository.listAdmin({
        limit: 20,
        page: 1,
        postId: POST_ID,
        status: CommentStatus.SPAM,
      }),
    ).resolves.toEqual({ items: [], total: 0 });
    expect(findMany).toHaveBeenCalledTimes(1);
    expect(findMany.mock.calls[0]?.[0]).toMatchObject({
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip: 0,
      take: 20,
      where: { postId: POST_ID, status: PrismaCommentStatus.SPAM },
    });
  });

  it('salva somente os campos mutáveis do comentário', async () => {
    const entity = comment();
    entity.markAsSpam(new Date('2026-08-22T11:00:00.000Z'), 'Abuso');

    await repository.save(entity);

    expect(update.mock.calls[0]?.[0]).toEqual({
      data: {
        content: 'Comentário válido.',
        deletedAt: null,
        editedAt: null,
        moderationReason: 'Abuso',
        status: PrismaCommentStatus.SPAM,
        updatedAt: new Date('2026-08-22T11:00:00.000Z'),
      },
      where: { id: COMMENT_ID },
    });
  });
});
