import { Injectable } from '@nestjs/common';

import { PrismaService } from '@api/core/database/prisma.service';
import type { Prisma } from '@api/generated/prisma/client';
import { CommentStatus as PrismaCommentStatus } from '@api/generated/prisma/client';
import { CommentStatus } from '@api/modules/comments/domain/enums/comment-status.enum';
import { CommentMapper } from '@api/modules/comments/mappers/comment.mapper';
import {
  type AdminCommentsFilters,
  type CommentAuthorRecord,
  type CommentRecord,
  type CommentThreadRecord,
  CommentsRepository,
  type PaginatedCommentRecords,
  type PublicCommentsFilters,
} from '@api/modules/comments/repositories/comments.repository';

const COMMENT_FIELDS = {
  authorId: true,
  content: true,
  createdAt: true,
  deletedAt: true,
  editedAt: true,
  id: true,
  moderationReason: true,
  parentId: true,
  postId: true,
  status: true,
  updatedAt: true,
} as const satisfies Prisma.CommentSelect;

const COMMENT_AUTHOR_SELECT = {
  avatarPath: true,
  displayName: true,
  id: true,
} as const satisfies Prisma.ProfileSelect;

const COMMENT_WITH_AUTHOR_SELECT = {
  ...COMMENT_FIELDS,
  author: { select: COMMENT_AUTHOR_SELECT },
} as const satisfies Prisma.CommentSelect;

const PUBLIC_COMMENT_THREAD_SELECT = {
  ...COMMENT_WITH_AUTHOR_SELECT,
  replies: {
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    select: COMMENT_WITH_AUTHOR_SELECT,
    where: { status: PrismaCommentStatus.VISIBLE },
  },
} as const satisfies Prisma.CommentSelect;

type PrismaCommentWithAuthor = Prisma.CommentGetPayload<{
  select: typeof COMMENT_WITH_AUTHOR_SELECT;
}>;

type PrismaCommentThread = Prisma.CommentGetPayload<{
  select: typeof PUBLIC_COMMENT_THREAD_SELECT;
}>;

const prismaStatusByDomain: Readonly<Record<CommentStatus, PrismaCommentStatus>> = {
  [CommentStatus.DELETED]: PrismaCommentStatus.DELETED,
  [CommentStatus.HIDDEN]: PrismaCommentStatus.HIDDEN,
  [CommentStatus.SPAM]: PrismaCommentStatus.SPAM,
  [CommentStatus.VISIBLE]: PrismaCommentStatus.VISIBLE,
};

function paginationOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}

function mapAuthor(author: PrismaCommentWithAuthor['author']): CommentAuthorRecord | null {
  return author ? { ...author } : null;
}

function mapRecord(record: PrismaCommentWithAuthor): CommentRecord {
  const { author, ...comment } = record;

  return {
    author: mapAuthor(author),
    comment: CommentMapper.toDomain(comment),
  };
}

function mapThread(record: PrismaCommentThread): CommentThreadRecord {
  const { replies, ...comment } = record;

  return {
    ...mapRecord(comment),
    replies: replies.map(mapRecord),
  };
}

function publicRootWhere(postId: string): Prisma.CommentWhereInput {
  return {
    OR: [
      { status: PrismaCommentStatus.VISIBLE },
      {
        replies: { some: { status: PrismaCommentStatus.VISIBLE } },
        status: PrismaCommentStatus.DELETED,
      },
    ],
    parentId: null,
    postId,
  };
}

@Injectable()
export class PrismaCommentsRepository implements CommentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(comment: CommentRecord['comment']): Promise<void> {
    await this.prisma.comment.create({ data: CommentMapper.toPersistence(comment) });
  }

  async findById(id: string): Promise<CommentRecord | null> {
    const record = await this.prisma.comment.findUnique({
      select: COMMENT_WITH_AUTHOR_SELECT,
      where: { id },
    });

    return record ? mapRecord(record) : null;
  }

  async findReplyParent(parentId: string, postId: string): Promise<CommentRecord | null> {
    const record = await this.prisma.comment.findFirst({
      select: COMMENT_WITH_AUTHOR_SELECT,
      where: { id: parentId, parentId: null, postId },
    });

    return record ? mapRecord(record) : null;
  }

  async listAdmin(filters: AdminCommentsFilters): Promise<PaginatedCommentRecords<CommentRecord>> {
    const where: Prisma.CommentWhereInput = {
      ...(filters.postId ? { postId: filters.postId } : {}),
      ...(filters.status ? { status: prismaStatusByDomain[filters.status] } : {}),
    };
    const [total, records] = await this.prisma.$transaction([
      this.prisma.comment.count({ where }),
      this.prisma.comment.findMany({
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        select: COMMENT_WITH_AUTHOR_SELECT,
        skip: paginationOffset(filters.page, filters.limit),
        take: filters.limit,
        where,
      }),
    ]);

    return { items: records.map(mapRecord), total };
  }

  async listPublicThreads(
    filters: PublicCommentsFilters,
  ): Promise<PaginatedCommentRecords<CommentThreadRecord>> {
    const where = publicRootWhere(filters.postId);
    const [total, records] = await this.prisma.$transaction([
      this.prisma.comment.count({ where }),
      this.prisma.comment.findMany({
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        select: PUBLIC_COMMENT_THREAD_SELECT,
        skip: paginationOffset(filters.page, filters.limit),
        take: filters.limit,
        where,
      }),
    ]);

    return { items: records.map(mapThread), total };
  }

  async save(comment: CommentRecord['comment']): Promise<void> {
    await this.prisma.comment.update({
      data: CommentMapper.toUpdate(comment),
      where: { id: comment.id },
    });
  }
}
