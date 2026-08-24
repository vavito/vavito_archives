import { randomUUID } from 'node:crypto';

import type { PrismaService } from '@api/core/database/prisma.service';
import { PostStatus, UserRole } from '@api/generated/prisma/client';
import { Comment } from '@api/modules/comments/domain/entities/comment.entity';
import { CommentStatus } from '@api/modules/comments/domain/enums/comment-status.enum';
import { CommentContent } from '@api/modules/comments/domain/value-objects/comment-content.value-object';
import { PrismaCommentsRepository } from '@api/modules/comments/repositories/prisma-comments.repository';

import { createIntegrationPrisma } from '../../helpers/integration-prisma';

const CONTENT = { content: [], type: 'doc' };

let prisma: PrismaService;
let repository: PrismaCommentsRepository;
let profileIds: string[];
let postIds: string[];

async function createProfile(role: UserRole = UserRole.USER): Promise<string> {
  const id = randomUUID();
  await prisma.profile.create({ data: { displayName: `Perfil ${id}`, id, role } });
  profileIds.push(id);
  return id;
}

async function createPublishedPost(authorId: string): Promise<string> {
  const id = randomUUID();
  await prisma.post.create({
    data: {
      authorId,
      content: CONTENT,
      excerpt: 'Resumo publicado.',
      id,
      publishedAt: new Date(),
      status: PostStatus.PUBLISHED,
      title: `Post ${id}`,
    },
  });
  postIds.push(id);
  return id;
}

function comment(authorId: string, postId: string, parentId?: string): Comment {
  return Comment.create({
    authorId,
    content: CommentContent.create('Comentário de integração.'),
    id: randomUUID(),
    now: new Date(),
    ...(parentId ? { parentId } : {}),
    postId,
  });
}

describe('Constraints de comentários com PostgreSQL real', () => {
  beforeAll(async () => {
    prisma = createIntegrationPrisma();
    repository = new PrismaCommentsRepository(prisma);
    await prisma.onModuleInit();
  });

  beforeEach(() => {
    profileIds = [];
    postIds = [];
  });

  afterEach(async () => {
    await prisma.comment.deleteMany({ where: { postId: { in: postIds } } });
    await prisma.post.deleteMany({ where: { id: { in: postIds } } });
    await prisma.profile.deleteMany({ where: { id: { in: profileIds } } });
  });

  afterAll(async () => {
    await prisma.onModuleDestroy();
  });

  it('impede resposta vinculada a comentário de outro post', async () => {
    const authorId = await createProfile();
    const firstPostId = await createPublishedPost(authorId);
    const secondPostId = await createPublishedPost(authorId);
    const root = comment(authorId, firstPostId);
    await repository.create(root);

    await expect(repository.create(comment(authorId, secondPostId, root.id))).rejects.toMatchObject(
      {
        code: 'P2003',
      },
    );
    await expect(prisma.comment.count({ where: { postId: secondPostId } })).resolves.toBe(0);
  });

  it('preserva somente respostas diretas visíveis na thread pública', async () => {
    const authorId = await createProfile();
    const postId = await createPublishedPost(authorId);
    const root = comment(authorId, postId);
    const visibleReply = comment(authorId, postId, root.id);
    const hiddenReply = Comment.restore({
      authorId,
      content: CommentContent.create('Resposta moderada.'),
      createdAt: new Date(),
      deletedAt: null,
      editedAt: null,
      id: randomUUID(),
      moderationReason: 'Moderação de integração',
      parentId: root.id,
      postId,
      status: CommentStatus.HIDDEN,
      updatedAt: new Date(),
    });
    await repository.create(root);
    await repository.create(visibleReply);
    await repository.create(hiddenReply);

    await expect(
      repository.listPublicThreads({ limit: 20, page: 1, postId }),
    ).resolves.toMatchObject({
      items: [{ comment: { id: root.id }, replies: [{ comment: { id: visibleReply.id } }] }],
      total: 1,
    });
  });
});
