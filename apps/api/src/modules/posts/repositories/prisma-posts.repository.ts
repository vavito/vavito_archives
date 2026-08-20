import { Injectable } from '@nestjs/common';

import { PrismaService } from '@api/core/database/prisma.service';
import {
  MediaUsageType,
  Prisma,
  PostStatus as PrismaPostStatus,
  ReactionType,
} from '@api/generated/prisma/client';
import type { Post } from '@api/modules/posts/domain/entities/post.entity';
import { PostStatus } from '@api/modules/posts/domain/enums/post-status.enum';
import { PostMapper } from '@api/modules/posts/mappers/post.mapper';
import {
  buildPostSearchQuery,
  type PostSearchIdRecord,
} from '@api/modules/posts/repositories/post-search.query';
import {
  type AdminPostSummaryRecord,
  type AdminPostsFilters,
  type PaginatedRecords,
  type PostAggregateRecord,
  type PostCoverRecord,
  type PostRevisionRecord,
  type PostSlugLookupRecord,
  type PostTagRecord,
  type PostUpdateOptions,
  PostsRepository,
  type PublicPostSummaryRecord,
  type PublicPostsFilters,
  type RegisterPostViewRecord,
  type RegisterPostViewResult,
  type SlugOwnerRecord,
  type TagWithPublishedCountRecord,
  type TagWriteRecord,
} from '@api/modules/posts/repositories/posts.repository';

const POST_DOMAIN_SELECT = {
  archivedAt: true,
  authorId: true,
  content: true,
  contentSchemaVersion: true,
  createdAt: true,
  editedAt: true,
  excerpt: true,
  id: true,
  publishedAt: true,
  readingTimeMinutes: true,
  seoDescription: true,
  seoTitle: true,
  slugs: {
    orderBy: { createdAt: 'asc' },
    select: {
      createdAt: true,
      id: true,
      isCurrent: true,
      postId: true,
      retiredAt: true,
      slug: true,
    },
  },
  status: true,
  title: true,
  updatedAt: true,
  viewsCount: true,
} satisfies Prisma.PostSelect;

const POST_AGGREGATE_SELECT = {
  ...POST_DOMAIN_SELECT,
  author: {
    select: {
      displayName: true,
      id: true,
    },
  },
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
} satisfies Prisma.PostSelect;

const PUBLIC_POST_SUMMARY_SELECT = {
  excerpt: true,
  id: true,
  mediaAssets: POST_AGGREGATE_SELECT.mediaAssets,
  publishedAt: true,
  readingTimeMinutes: true,
  slugs: {
    take: 1,
    where: { isCurrent: true },
    select: { slug: true },
  },
  tags: POST_AGGREGATE_SELECT.tags,
  title: true,
  viewsCount: true,
} satisfies Prisma.PostSelect;

const ADMIN_POST_SUMMARY_SELECT = {
  author: POST_AGGREGATE_SELECT.author,
  editedAt: true,
  id: true,
  publishedAt: true,
  slugs: {
    take: 1,
    where: { isCurrent: true },
    select: { slug: true },
  },
  status: true,
  title: true,
  updatedAt: true,
} satisfies Prisma.PostSelect;

type PrismaPostAggregate = Prisma.PostGetPayload<{
  select: typeof POST_AGGREGATE_SELECT;
}>;
type PrismaPublicPostSummary = Prisma.PostGetPayload<{
  select: typeof PUBLIC_POST_SUMMARY_SELECT;
}>;
type PrismaAdminPostSummary = Prisma.PostGetPayload<{
  select: typeof ADMIN_POST_SUMMARY_SELECT;
}>;

const postStatusByPrisma: Readonly<Record<PrismaPostStatus, PostStatus>> = {
  [PrismaPostStatus.ARCHIVED]: PostStatus.ARCHIVED,
  [PrismaPostStatus.DRAFT]: PostStatus.DRAFT,
  [PrismaPostStatus.PUBLISHED]: PostStatus.PUBLISHED,
};

function mapTags(record: PrismaPostAggregate | PrismaPublicPostSummary): PostTagRecord[] {
  return record.tags.map(({ tag }) => ({ ...tag }));
}

function mapCover(record: PrismaPostAggregate | PrismaPublicPostSummary): PostCoverRecord | null {
  const cover = record.mediaAssets[0]?.mediaAsset;
  return cover ? { ...cover } : null;
}

function mapAggregate(record: PrismaPostAggregate): PostAggregateRecord {
  return {
    author: { ...record.author },
    cover: mapCover(record),
    post: PostMapper.toDomain(record),
    tags: mapTags(record),
  };
}

function mapPublicSummary(record: PrismaPublicPostSummary): PublicPostSummaryRecord {
  const currentSlug = record.slugs[0]?.slug;

  if (!record.excerpt || !record.publishedAt || !currentSlug) {
    throw new Error('Published post persistence is missing required public fields.');
  }

  return {
    cover: mapCover(record),
    excerpt: record.excerpt,
    id: record.id,
    publishedAt: record.publishedAt,
    readingTimeMinutes: record.readingTimeMinutes,
    slug: currentSlug,
    tags: mapTags(record),
    title: record.title,
    viewsCount: record.viewsCount,
  };
}

function mapAdminSummary(record: PrismaAdminPostSummary): AdminPostSummaryRecord {
  return {
    author: { ...record.author },
    editedAt: record.editedAt,
    id: record.id,
    publishedAt: record.publishedAt,
    slug: record.slugs[0]?.slug ?? null,
    status: postStatusByPrisma[record.status],
    title: record.title,
    updatedAt: record.updatedAt,
  };
}

function paginationOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}

function revisionSnapshot(record: PrismaPostAggregate): Prisma.InputJsonObject {
  return {
    content: record.content,
    contentSchemaVersion: record.contentSchemaVersion,
    coverMediaId: record.mediaAssets[0]?.mediaAsset.id ?? null,
    excerpt: record.excerpt,
    readingTimeMinutes: record.readingTimeMinutes,
    seoDescription: record.seoDescription,
    seoTitle: record.seoTitle,
    slug: record.slugs.find(({ isCurrent }) => isCurrent)?.slug ?? null,
    tagNames: record.tags.map(({ tag }) => tag.name),
    title: record.title,
  };
}

@Injectable()
export class PrismaPostsRepository implements PostsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(post: Post): Promise<void> {
    const data = PostMapper.toPersistence(post);
    const currentSlug = post.currentSlug?.value;

    await this.prisma.post.create({
      data: {
        ...data,
        ...(currentSlug ? { slugs: { create: { slug: currentSlug } } } : {}),
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.post.delete({ where: { id } });
  }

  async findById(id: string): Promise<PostAggregateRecord | null> {
    const record = await this.prisma.post.findUnique({
      select: POST_AGGREGATE_SELECT,
      where: { id },
    });

    return record ? mapAggregate(record) : null;
  }

  async findBySlug(slug: string): Promise<PostSlugLookupRecord | null> {
    const record = await this.prisma.postSlug.findFirst({
      select: {
        isCurrent: true,
        post: { select: POST_AGGREGATE_SELECT },
        slug: true,
      },
      where: {
        post: { status: PrismaPostStatus.PUBLISHED },
        slug,
      },
    });

    if (!record) {
      return null;
    }

    const reactionCounts = await this.prisma.reaction.groupBy({
      _count: { _all: true },
      by: ['type'],
      where: { postId: record.post.id },
    });
    const countByType = new Map(reactionCounts.map((item) => [item.type, item._count._all]));

    return {
      ...mapAggregate(record.post),
      reactionCounts: {
        dislike: countByType.get(ReactionType.DISLIKE) ?? 0,
        like: countByType.get(ReactionType.LIKE) ?? 0,
      },
      requestedSlug: record.slug,
      requestedSlugIsCurrent: record.isCurrent,
    };
  }

  async findSlugOwner(slug: string): Promise<SlugOwnerRecord | null> {
    return this.prisma.postSlug.findUnique({
      select: { isCurrent: true, postId: true },
      where: { slug },
    });
  }

  async listAdmin(filters: AdminPostsFilters): Promise<PaginatedRecords<AdminPostSummaryRecord>> {
    const where: Prisma.PostWhereInput = {
      ...(filters.status ? { status: PrismaPostStatus[filters.status] } : {}),
      ...(filters.q
        ? {
            OR: [
              { title: { contains: filters.q, mode: 'insensitive' } },
              { excerpt: { contains: filters.q, mode: 'insensitive' } },
              { slugs: { some: { slug: { contains: filters.q, mode: 'insensitive' } } } },
              {
                tags: {
                  some: { tag: { name: { contains: filters.q, mode: 'insensitive' } } },
                },
              },
            ],
          }
        : {}),
    };

    const [total, records] = await this.prisma.$transaction([
      this.prisma.post.count({ where }),
      this.prisma.post.findMany({
        orderBy: [{ updatedAt: 'desc' }, { id: 'asc' }],
        select: ADMIN_POST_SUMMARY_SELECT,
        skip: paginationOffset(filters.page, filters.limit),
        take: filters.limit,
        where,
      }),
    ]);

    return { items: records.map(mapAdminSummary), total };
  }

  async listPublic(
    filters: PublicPostsFilters,
  ): Promise<PaginatedRecords<PublicPostSummaryRecord>> {
    const where: Prisma.PostWhereInput = {
      status: PrismaPostStatus.PUBLISHED,
      ...(filters.tag ? { tags: { some: { tag: { slug: filters.tag } } } } : {}),
    };
    const orderBy: Prisma.PostOrderByWithRelationInput[] =
      filters.sort === 'popular'
        ? [{ viewsCount: 'desc' }, { id: 'asc' }]
        : [{ publishedAt: 'desc' }, { id: 'asc' }];

    const [total, records] = await this.prisma.$transaction([
      this.prisma.post.count({ where }),
      this.prisma.post.findMany({
        orderBy,
        select: PUBLIC_POST_SUMMARY_SELECT,
        skip: paginationOffset(filters.page, filters.limit),
        take: filters.limit,
        where,
      }),
    ]);

    return { items: records.map(mapPublicSummary), total };
  }

  async listRevisions(
    postId: string,
    filters: Pick<AdminPostsFilters, 'limit' | 'page'>,
  ): Promise<PaginatedRecords<PostRevisionRecord>> {
    const where: Prisma.PostRevisionWhereInput = { postId };
    const [total, records] = await this.prisma.$transaction([
      this.prisma.postRevision.count({ where }),
      this.prisma.postRevision.findMany({
        orderBy: [{ version: 'desc' }, { id: 'asc' }],
        select: {
          createdAt: true,
          editor: { select: { displayName: true, id: true } },
          id: true,
          snapshot: true,
          version: true,
        },
        skip: paginationOffset(filters.page, filters.limit),
        take: filters.limit,
        where,
      }),
    ]);

    return {
      items: records.map((record) => ({
        ...record,
        snapshot: structuredClone(record.snapshot) as Record<string, unknown>,
      })),
      total,
    };
  }

  async searchPublic(query: string, limit: number): Promise<PublicPostSummaryRecord[]> {
    const matches = await this.prisma.$queryRaw<PostSearchIdRecord[]>(
      buildPostSearchQuery(query, limit),
    );

    if (matches.length === 0) {
      return [];
    }

    const records = await this.prisma.post.findMany({
      select: PUBLIC_POST_SUMMARY_SELECT,
      where: {
        id: { in: matches.map(({ id }) => id) },
        status: PrismaPostStatus.PUBLISHED,
      },
    });
    const recordById = new Map(records.map((record) => [record.id, record]));

    return matches.flatMap(({ id }) => {
      const record = recordById.get(id);
      return record ? [mapPublicSummary(record)] : [];
    });
  }

  async listTags(): Promise<TagWithPublishedCountRecord[]> {
    const tags = await this.prisma.tag.findMany({
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
      select: {
        _count: {
          select: {
            posts: { where: { post: { status: PrismaPostStatus.PUBLISHED } } },
          },
        },
        id: true,
        name: true,
        slug: true,
      },
    });

    return tags.map(({ _count, ...tag }) => ({
      ...tag,
      publishedPostCount: _count.posts,
    }));
  }

  async replaceTags(postId: string, tags: readonly TagWriteRecord[]): Promise<void> {
    await this.prisma.$transaction(async (transaction) => {
      await this.replaceTagsInTransaction(transaction, postId, tags);
    });
  }

  async registerView(slug: string, view: RegisterPostViewRecord): Promise<RegisterPostViewResult> {
    const [result] = await this.prisma.$queryRaw<RegisterPostViewResult[]>`
      WITH "published_post" AS (
        SELECT "post"."id"
        FROM "PostSlug" AS "post_slug"
        INNER JOIN "Post" AS "post" ON "post"."id" = "post_slug"."postId"
        WHERE
          "post_slug"."slug" = ${slug}
          AND "post"."status" = 'PUBLISHED'::"PostStatus"
        LIMIT 1
      ),
      "inserted_view" AS (
        INSERT INTO "PostView" (
          "id",
          "postId",
          "fingerprintHash",
          "bucketDate"
        )
        SELECT
          ${view.id}::uuid,
          "published_post"."id",
          ${view.fingerprintHash},
          ${view.bucketDate}::date
        FROM "published_post"
        ON CONFLICT ("postId", "fingerprintHash", "bucketDate") DO NOTHING
        RETURNING "postId"
      ),
      "updated_post" AS (
        UPDATE "Post"
        SET "viewsCount" = "viewsCount" + 1
        WHERE "id" IN (SELECT "postId" FROM "inserted_view")
        RETURNING "id"
      )
      SELECT
        EXISTS(SELECT 1 FROM "published_post") AS "postExists",
        EXISTS(SELECT 1 FROM "updated_post") AS "counted"
    `;

    return result ?? { counted: false, postExists: false };
  }

  async update(post: Post, options: PostUpdateOptions = {}): Promise<void> {
    const desiredSlug = post.currentSlug?.value ?? null;

    await this.prisma.$transaction(async (transaction) => {
      if (options.revision) {
        await transaction.$queryRaw`
          SELECT "id"
          FROM "Post"
          WHERE "id" = ${post.id}::uuid
          FOR UPDATE
        `;

        const [previous, latestRevision] = await Promise.all([
          transaction.post.findUniqueOrThrow({
            select: POST_AGGREGATE_SELECT,
            where: { id: post.id },
          }),
          transaction.postRevision.aggregate({
            _max: { version: true },
            where: { postId: post.id },
          }),
        ]);

        await transaction.postRevision.create({
          data: {
            createdAt: options.revision.createdAt,
            editorId: options.revision.editorId,
            postId: post.id,
            snapshot: revisionSnapshot(previous),
            version: (latestRevision._max.version ?? 0) + 1,
          },
        });
      }

      const [currentSlug, desiredSlugRecord] = await Promise.all([
        transaction.postSlug.findFirst({
          select: { id: true, slug: true },
          where: { isCurrent: true, postId: post.id },
        }),
        desiredSlug
          ? transaction.postSlug.findUnique({
              select: { id: true, postId: true },
              where: { slug: desiredSlug },
            })
          : null,
      ]);

      await transaction.post.update({
        data: {
          archivedAt: post.archivedAt,
          content: post.content.document as unknown as Prisma.InputJsonValue,
          contentSchemaVersion: post.contentSchemaVersion,
          editedAt: post.editedAt,
          excerpt: post.excerpt,
          publishedAt: post.publishedAt,
          readingTimeMinutes: post.readingTimeMinutes,
          seoDescription: post.seoDescription,
          seoTitle: post.seoTitle,
          status: PrismaPostStatus[post.status],
          title: post.title,
          updatedAt: post.updatedAt,
          viewsCount: post.viewsCount,
        },
        where: { id: post.id },
      });

      if (currentSlug?.slug !== desiredSlug) {
        if (currentSlug) {
          await transaction.postSlug.update({
            data: { isCurrent: false, retiredAt: post.updatedAt },
            where: { id: currentSlug.id },
          });
        }

        if (desiredSlugRecord?.postId === post.id) {
          await transaction.postSlug.update({
            data: { isCurrent: true, retiredAt: null },
            where: { id: desiredSlugRecord.id },
          });
        } else if (desiredSlug) {
          await transaction.postSlug.create({
            data: { postId: post.id, slug: desiredSlug },
          });
        }
      }

      if (options.tags !== undefined) {
        await this.replaceTagsInTransaction(transaction, post.id, options.tags);
      }
    });
  }

  private async replaceTagsInTransaction(
    transaction: Prisma.TransactionClient,
    postId: string,
    tags: readonly TagWriteRecord[],
  ): Promise<void> {
    const uniqueTags = [...new Map(tags.map((tag) => [tag.slug, tag])).values()];
    const persistedTags = await Promise.all(
      uniqueTags.map((tag) =>
        transaction.tag.upsert({
          create: tag,
          select: { id: true },
          update: { name: tag.name },
          where: { slug: tag.slug },
        }),
      ),
    );
    const tagIds = persistedTags.map(({ id }) => id);

    await transaction.postTag.deleteMany({
      where: {
        postId,
        ...(tagIds.length > 0 ? { tagId: { notIn: tagIds } } : {}),
      },
    });

    if (tagIds.length > 0) {
      await transaction.postTag.createMany({
        data: tagIds.map((tagId) => ({ postId, tagId })),
        skipDuplicates: true,
      });
    }
  }
}
