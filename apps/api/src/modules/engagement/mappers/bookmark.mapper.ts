import type { Bookmark as PrismaBookmark, Prisma } from '@api/generated/prisma/client';
import { Bookmark } from '@api/modules/engagement/domain/entities/bookmark.entity';

export class BookmarkMapper {
  static toDomain(record: PrismaBookmark): Bookmark {
    return Bookmark.restore({
      createdAt: record.createdAt,
      id: record.id,
      postId: record.postId,
      profileId: record.profileId,
    });
  }

  static toPersistence(bookmark: Bookmark): Prisma.BookmarkUncheckedCreateInput {
    return {
      createdAt: bookmark.createdAt,
      id: bookmark.id,
      postId: bookmark.postId,
      profileId: bookmark.profileId,
    };
  }
}
