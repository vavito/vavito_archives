import { randomUUID } from 'node:crypto';

import type { PrismaService } from '@api/core/database/prisma.service';
import { PostStatus, UserRole } from '@api/generated/prisma/client';
import { Bookmark } from '@api/modules/engagement/domain/entities/bookmark.entity';
import { Reaction } from '@api/modules/engagement/domain/entities/reaction.entity';
import { ReactionType } from '@api/modules/engagement/domain/enums/reaction-type.enum';
import { PrismaBookmarksRepository } from '@api/modules/engagement/repositories/prisma-bookmarks.repository';
import { PrismaReactionsRepository } from '@api/modules/engagement/repositories/prisma-reactions.repository';

import { createIntegrationPrisma } from '../../helpers/integration-prisma';

const CONTENT = { content: [], type: 'doc' };

let prisma: PrismaService;
let bookmarksRepository: PrismaBookmarksRepository;
let reactionsRepository: PrismaReactionsRepository;
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
      slugs: { create: { slug: `post-${id}` } },
      status: PostStatus.PUBLISHED,
      title: `Post ${id}`,
    },
  });
  postIds.push(id);
  return id;
}

function reaction(profileId: string, postId: string, type = ReactionType.LIKE): Reaction {
  return Reaction.create({ id: randomUUID(), now: new Date(), postId, profileId, type });
}

function bookmark(profileId: string, postId: string): Bookmark {
  return Bookmark.create({ id: randomUUID(), now: new Date(), postId, profileId });
}

describe('Concorrência e isolamento de Engagement com PostgreSQL real', () => {
  beforeAll(async () => {
    prisma = createIntegrationPrisma();
    bookmarksRepository = new PrismaBookmarksRepository(prisma);
    reactionsRepository = new PrismaReactionsRepository(prisma);
    await prisma.onModuleInit();
  });

  beforeEach(() => {
    profileIds = [];
    postIds = [];
  });

  afterEach(async () => {
    await prisma.reaction.deleteMany({ where: { postId: { in: postIds } } });
    await prisma.bookmark.deleteMany({ where: { postId: { in: postIds } } });
    await prisma.post.deleteMany({ where: { id: { in: postIds } } });
    await prisma.profile.deleteMany({ where: { id: { in: profileIds } } });
  });

  afterAll(async () => {
    await prisma.onModuleDestroy();
  });

  it('consolida reações simultâneas do mesmo perfil em um único registro', async () => {
    const authorId = await createProfile(UserRole.ADMIN);
    const profileId = await createProfile();
    const postId = await createPublishedPost(authorId);

    const results = await Promise.all([
      reactionsRepository.set(reaction(profileId, postId)),
      reactionsRepository.set(reaction(profileId, postId)),
    ]);

    await expect(prisma.reaction.count({ where: { postId, profileId } })).resolves.toBe(1);
    expect(results).toEqual([
      expect.objectContaining({ counts: { dislike: 0, like: 1 }, postExists: true }),
      expect.objectContaining({ counts: { dislike: 0, like: 1 }, postExists: true }),
    ]);
  });

  it('consolida bookmarks simultâneos do mesmo perfil em um único registro', async () => {
    const authorId = await createProfile(UserRole.ADMIN);
    const profileId = await createProfile();
    const postId = await createPublishedPost(authorId);

    const results = await Promise.all([
      bookmarksRepository.save(bookmark(profileId, postId)),
      bookmarksRepository.save(bookmark(profileId, postId)),
    ]);

    await expect(prisma.bookmark.count({ where: { postId, profileId } })).resolves.toBe(1);
    expect(results.every((result) => result.bookmark?.profileId === profileId)).toBe(true);
  });

  it('isola remoções e listagens pelo perfil autenticado', async () => {
    const authorId = await createProfile(UserRole.ADMIN);
    const ownerId = await createProfile();
    const otherId = await createProfile();
    const postId = await createPublishedPost(authorId);
    await bookmarksRepository.save(bookmark(ownerId, postId));
    await reactionsRepository.set(reaction(ownerId, postId, ReactionType.DISLIKE));

    await bookmarksRepository.remove(otherId, postId);
    const reactionState = await reactionsRepository.remove(otherId, postId);

    await expect(
      bookmarksRepository.list({ limit: 12, page: 1, profileId: otherId }),
    ).resolves.toEqual({
      items: [],
      total: 0,
    });
    await expect(
      bookmarksRepository.list({ limit: 12, page: 1, profileId: ownerId }),
    ).resolves.toMatchObject({
      items: [{ id: postId }],
      total: 1,
    });
    await expect(prisma.bookmark.count({ where: { postId, profileId: ownerId } })).resolves.toBe(1);
    await expect(prisma.reaction.count({ where: { postId, profileId: ownerId } })).resolves.toBe(1);
    expect(reactionState).toMatchObject({ counts: { dislike: 1, like: 0 }, reaction: null });
  });
});
