import type { Bookmark as PrismaBookmark } from '@api/generated/prisma/client';
import { Bookmark } from '@api/modules/engagement/domain/entities/bookmark.entity';
import { BookmarkMapper } from '@api/modules/engagement/mappers/bookmark.mapper';

const CREATED_AT = new Date('2026-08-24T10:00:00.000Z');

function prismaBookmark(): PrismaBookmark {
  return {
    createdAt: CREATED_AT,
    id: 'bookmark-id',
    postId: 'post-id',
    profileId: 'profile-id',
  };
}

describe('BookmarkMapper', () => {
  it('restaura a entidade a partir do registro Prisma', () => {
    expect(BookmarkMapper.toDomain(prismaBookmark())).toMatchObject({
      id: 'bookmark-id',
      postId: 'post-id',
      profileId: 'profile-id',
    });
  });

  it('converte a entidade para criação no Prisma', () => {
    const bookmark = Bookmark.create({
      id: 'bookmark-id',
      now: CREATED_AT,
      postId: 'post-id',
      profileId: 'profile-id',
    });

    expect(BookmarkMapper.toPersistence(bookmark)).toEqual(prismaBookmark());
  });
});
