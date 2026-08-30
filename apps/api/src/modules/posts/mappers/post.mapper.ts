import type {
  Post as PrismaPost,
  PostSlug as PrismaPostSlug,
  Prisma,
} from '@api/generated/prisma/client';
import { PostStatus as PrismaPostStatus } from '@api/generated/prisma/client';
import { Post } from '@api/modules/posts/domain/entities/post.entity';
import { PostStatus } from '@api/modules/posts/domain/enums/post-status.enum';
import { PostContent } from '@api/modules/posts/domain/value-objects/post-content.value-object';
import { Slug } from '@api/modules/posts/domain/value-objects/slug.value-object';
import type {
  PostAdminDetailDto,
  PostAdminSummaryDto,
  PostAuthorDto,
  PostRevisionAdminDto,
} from '@api/modules/posts/dto/response/post-admin-response.dto';
import type {
  PostDetailResponseDto,
  PostViewerStateDto,
} from '@api/modules/posts/dto/response/post-detail-response.dto';
import type { PostSummaryDto } from '@api/modules/posts/dto/response/post-summary.dto';
import type { TagResponseDto } from '@api/modules/posts/dto/response/tag-response.dto';
import type {
  AdminPostSummaryRecord,
  PostAggregateRecord,
  PostCoverRecord,
  PostRevisionRecord,
  PostSlugLookupRecord,
  PublicPostSummaryRecord,
} from '@api/modules/posts/repositories/posts.repository';

export type PrismaPostWithSlugs = PrismaPost & {
  slugs: readonly PrismaPostSlug[];
};

export interface PostCoverView {
  alt: string;
  mediaId: string;
  url: string | null;
}

export interface PostResponseContext {
  cover: PostCoverView | null;
  tags: readonly TagResponseDto[];
}

export interface PostDetailResponseContext extends PostResponseContext {
  reactionCounts: {
    dislike: number;
    like: number;
  };
  viewer: PostViewerStateDto | null;
}

export interface PostAdminResponseContext extends PostResponseContext {
  author: PostAuthorDto;
}

const postStatusByPrisma: Readonly<Record<PrismaPostStatus, PostStatus>> = {
  [PrismaPostStatus.ARCHIVED]: PostStatus.ARCHIVED,
  [PrismaPostStatus.DRAFT]: PostStatus.DRAFT,
  [PrismaPostStatus.PUBLISHED]: PostStatus.PUBLISHED,
};

function toNullableIso(date: Date | null): string | null {
  return date?.toISOString() ?? null;
}

function cloneContent(post: Post): Record<string, unknown> {
  return structuredClone(post.content.document);
}

function cloneTags(tags: readonly TagResponseDto[]): TagResponseDto[] {
  return tags.map((tag) => ({ ...tag }));
}

function coverView(cover: PostCoverRecord | null, url: string | null): PostCoverView | null {
  if (!cover) {
    return null;
  }

  return {
    alt: cover.altText,
    mediaId: cover.id,
    url,
  };
}

function responseTags(tags: readonly TagResponseDto[]): TagResponseDto[] {
  return tags.map(({ id, name, slug }) => ({ id, name, slug }));
}

function publicFields(post: Post): {
  excerpt: string;
  publishedAt: Date;
  slug: string;
} {
  const currentSlug = post.currentSlug;
  const excerpt = post.excerpt;
  const publishedAt = post.publishedAt;

  if (post.status !== PostStatus.PUBLISHED || !currentSlug || !excerpt || !publishedAt) {
    throw new Error('Only a complete published post can be mapped to a public response.');
  }

  return { excerpt, publishedAt, slug: currentSlug.value };
}

export class PostMapper {
  static toDomain(record: PrismaPostWithSlugs): Post {
    const currentSlugs = record.slugs.filter((slug) => slug.isCurrent);

    if (currentSlugs.length > 1) {
      throw new Error('A post cannot have more than one current slug.');
    }

    const currentSlug = currentSlugs[0];

    return Post.restore({
      archivedAt: record.archivedAt,
      authorId: record.authorId,
      content: PostContent.create(record.content, record.contentSchemaVersion),
      createdAt: record.createdAt,
      currentSlug: currentSlug ? Slug.create(currentSlug.slug) : null,
      editedAt: record.editedAt,
      excerpt: record.excerpt,
      id: record.id,
      publishedAt: record.publishedAt,
      readingTimeMinutes: record.readingTimeMinutes,
      seoDescription: record.seoDescription,
      seoTitle: record.seoTitle,
      status: postStatusByPrisma[record.status],
      title: record.title,
      updatedAt: record.updatedAt,
      viewsCount: record.viewsCount,
    });
  }

  static toPersistence(post: Post): Prisma.PostUncheckedCreateInput {
    return {
      archivedAt: post.archivedAt,
      authorId: post.authorId,
      content: post.content.document as unknown as Prisma.InputJsonValue,
      contentSchemaVersion: post.contentSchemaVersion,
      createdAt: post.createdAt,
      editedAt: post.editedAt,
      excerpt: post.excerpt,
      id: post.id,
      publishedAt: post.publishedAt,
      readingTimeMinutes: post.readingTimeMinutes,
      seoDescription: post.seoDescription,
      seoTitle: post.seoTitle,
      status: PrismaPostStatus[post.status],
      title: post.title,
      updatedAt: post.updatedAt,
      viewsCount: post.viewsCount,
    };
  }

  static fromPublicSummaryRecord(
    record: PublicPostSummaryRecord,
    coverUrl: string | null = null,
  ): PostSummaryDto {
    const cover = coverView(record.cover, coverUrl);

    return {
      coverAlt: cover?.alt ?? null,
      coverUrl: cover?.url ?? null,
      excerpt: record.excerpt,
      id: record.id,
      publishedAt: record.publishedAt.toISOString(),
      readingTimeMinutes: record.readingTimeMinutes,
      slug: record.slug,
      tags: responseTags(record.tags),
      title: record.title,
      viewCount: record.viewsCount,
    };
  }

  static fromAdminSummaryRecord(record: AdminPostSummaryRecord): PostAdminSummaryDto {
    return {
      author: { ...record.author },
      editedAt: toNullableIso(record.editedAt),
      id: record.id,
      publishedAt: toNullableIso(record.publishedAt),
      slug: record.slug,
      status: record.status,
      title: record.title,
      updatedAt: record.updatedAt.toISOString(),
    };
  }

  static fromAggregateToAdminDetail(
    record: PostAggregateRecord,
    coverUrl: string | null = null,
  ): PostAdminDetailDto {
    return this.toAdminDetail(record.post, {
      author: record.author,
      cover: coverView(record.cover, coverUrl),
      tags: responseTags(record.tags),
    });
  }

  static fromSlugLookupToPublicDetail(
    record: PostSlugLookupRecord,
    coverUrl: string | null = null,
  ): PostDetailResponseDto {
    return this.toPublicDetail(record.post, {
      cover: coverView(record.cover, coverUrl),
      reactionCounts: record.reactionCounts,
      tags: responseTags(record.tags),
      viewer: null,
    });
  }

  static fromRevisionRecord(record: PostRevisionRecord): PostRevisionAdminDto {
    return {
      createdAt: record.createdAt.toISOString(),
      editor: { ...record.editor },
      id: record.id,
      snapshot: structuredClone(record.snapshot),
      version: record.version,
    };
  }

  static toPublicSummary(post: Post, context: PostResponseContext): PostSummaryDto {
    const fields = publicFields(post);

    return {
      coverAlt: context.cover?.alt ?? null,
      coverUrl: context.cover?.url ?? null,
      excerpt: fields.excerpt,
      id: post.id,
      publishedAt: fields.publishedAt.toISOString(),
      readingTimeMinutes: post.readingTimeMinutes,
      slug: fields.slug,
      tags: cloneTags(context.tags),
      title: post.title,
      viewCount: post.viewsCount,
    };
  }

  static toPublicDetail(post: Post, context: PostDetailResponseContext): PostDetailResponseDto {
    return {
      ...this.toPublicSummary(post, context),
      content: cloneContent(post),
      contentSchemaVersion: post.contentSchemaVersion,
      reactionCounts: { ...context.reactionCounts },
      seoDescription: post.seoDescription,
      seoTitle: post.seoTitle,
      viewer: context.viewer ? { ...context.viewer } : null,
    };
  }

  static toAdminSummary(post: Post, context: PostAdminResponseContext): PostAdminSummaryDto {
    return {
      author: { ...context.author },
      editedAt: toNullableIso(post.editedAt),
      id: post.id,
      publishedAt: toNullableIso(post.publishedAt),
      slug: post.currentSlug?.value ?? null,
      status: post.status,
      title: post.title,
      updatedAt: post.updatedAt.toISOString(),
    };
  }

  static toAdminDetail(post: Post, context: PostAdminResponseContext): PostAdminDetailDto {
    return {
      ...this.toAdminSummary(post, context),
      archivedAt: toNullableIso(post.archivedAt),
      content: cloneContent(post),
      contentSchemaVersion: post.contentSchemaVersion,
      coverAlt: context.cover?.alt ?? null,
      coverMediaId: context.cover?.mediaId ?? null,
      coverUrl: context.cover?.url ?? null,
      createdAt: post.createdAt.toISOString(),
      excerpt: post.excerpt,
      readingTimeMinutes: post.readingTimeMinutes,
      seoDescription: post.seoDescription,
      seoTitle: post.seoTitle,
      tags: cloneTags(context.tags),
      viewCount: post.viewsCount,
    };
  }
}
