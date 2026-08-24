import { Injectable } from '@nestjs/common';

import { PrismaService } from '@api/core/database/prisma.service';
import {
  MediaUsageType,
  type Prisma,
  PostStatus as PrismaPostStatus,
} from '@api/generated/prisma/client';
import type { Bookmark } from '@api/modules/engagement/domain/entities/bookmark.entity';
import { BookmarkMapper } from '@api/modules/engagement/mappers/bookmark.mapper';
import {
  type BookmarkMutationResult,
  type BookmarksFilters,
  BookmarksRepository,
} from '@api/modules/engagement/repositories/bookmarks.repository';
import type {
  PostCoverRecord,
  PostTagRecord,
  PublicPostSummaryRecord,
} from '@api/modules/posts/repositories/posts.repository';

const MAX_TRANSACTION_ATTEMPTS = 3;

const BOOKMARKED_POST_SELECT = {
  excerpt: true,
  id: true,
  mediaAssets: {
    take: 1,
    where: { usage: MediaUsageType.COVER },
    select: {
      mediaAsset: {
        select: {
          altText: true,
          id: true,
          storagePath: true,
        },
      },
    },
  },
  publishedAt: true,
  readingTimeMinutes: true,
  slugs: {
    take: 1,
    where: { isCurrent: true },
    select: { slug: true },
  },
  tags: {
    orderBy: { tag: { name: 'asc' } },
    select: {
      tag: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  },
  title: true,
  viewsCount: true,
} satisfies Prisma.PostSelect;

const BOOKMARK_WITH_POST_SELECT = {
  post: { select: BOOKMARKED_POST_SELECT },
} satisfies Prisma.BookmarkSelect;

type PrismaBookmarkWithPost = Prisma.BookmarkGetPayload<{
  select: typeof BOOKMARK_WITH_POST_SELECT;
}>;

function isTransactionConflict(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2034';
}

function paginationOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}

function mapTags(post: PrismaBookmarkWithPost['post']): PostTagRecord[] {
  return post.tags.map(({ tag }) => ({ ...tag }));
}

function mapCover(post: PrismaBookmarkWithPost['post']): PostCoverRecord | null {
  const cover = post.mediaAssets[0]?.mediaAsset;
  return cover ? { ...cover } : null;
}

function mapPostSummary(record: PrismaBookmarkWithPost): PublicPostSummaryRecord {
  const { post } = record;
  const currentSlug = post.slugs[0]?.slug;

  if (!post.excerpt || !post.publishedAt || !currentSlug) {
    throw new Error('Bookmarked published post is missing required public fields.');
  }

  return {
    cover: mapCover(post),
    excerpt: post.excerpt,
    id: post.id,
    publishedAt: post.publishedAt,
    readingTimeMinutes: post.readingTimeMinutes,
    slug: currentSlug,
    tags: mapTags(post),
    title: post.title,
    viewsCount: post.viewsCount,
  };
}

@Injectable()
export class PrismaBookmarksRepository implements BookmarksRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(bookmark: Bookmark): Promise<BookmarkMutationResult> {
    return this.runTransaction(async (transaction) => {
      const post = await transaction.post.findFirst({
        select: { id: true },
        where: { id: bookmark.postId, status: PrismaPostStatus.PUBLISHED },
      });

      if (!post) {
        return { bookmark: null, postExists: false };
      }

      const existing = await transaction.bookmark.findUnique({
        where: {
          profileId_postId: {
            postId: bookmark.postId,
            profileId: bookmark.profileId,
          },
        },
      });

      if (existing) {
        return { bookmark: BookmarkMapper.toDomain(existing), postExists: true };
      }

      const created = await transaction.bookmark.create({
        data: BookmarkMapper.toPersistence(bookmark),
      });

      return { bookmark: BookmarkMapper.toDomain(created), postExists: true };
    });
  }

  async remove(profileId: string, postId: string): Promise<void> {
    await this.prisma.bookmark.deleteMany({ where: { postId, profileId } });
  }

  async list(filters: BookmarksFilters) {
    const where: Prisma.BookmarkWhereInput = {
      post: { status: PrismaPostStatus.PUBLISHED },
      profileId: filters.profileId,
    };
    const [total, records] = await this.prisma.$transaction([
      this.prisma.bookmark.count({ where }),
      this.prisma.bookmark.findMany({
        orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
        select: BOOKMARK_WITH_POST_SELECT,
        skip: paginationOffset(filters.page, filters.limit),
        take: filters.limit,
        where,
      }),
    ]);

    return { items: records.map(mapPostSummary), total };
  }

  private async runTransaction(
    operation: (transaction: Prisma.TransactionClient) => Promise<BookmarkMutationResult>,
  ): Promise<BookmarkMutationResult> {
    for (let attempt = 1; attempt <= MAX_TRANSACTION_ATTEMPTS; attempt += 1) {
      try {
        return await this.prisma.$transaction(operation, { isolationLevel: 'Serializable' });
      } catch (error) {
        if (!isTransactionConflict(error) || attempt === MAX_TRANSACTION_ATTEMPTS) {
          throw error;
        }
      }
    }

    throw new Error('Bookmark transaction attempts exhausted.');
  }
}
