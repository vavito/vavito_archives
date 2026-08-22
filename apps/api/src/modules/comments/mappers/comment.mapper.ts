import type { Comment as PrismaComment, Prisma } from '@api/generated/prisma/client';
import { CommentStatus as PrismaCommentStatus } from '@api/generated/prisma/client';
import { Comment } from '@api/modules/comments/domain/entities/comment.entity';
import { CommentStatus } from '@api/modules/comments/domain/enums/comment-status.enum';
import { CommentContent } from '@api/modules/comments/domain/value-objects/comment-content.value-object';

const domainStatusByPrisma: Readonly<Record<PrismaCommentStatus, CommentStatus>> = {
  [PrismaCommentStatus.DELETED]: CommentStatus.DELETED,
  [PrismaCommentStatus.HIDDEN]: CommentStatus.HIDDEN,
  [PrismaCommentStatus.SPAM]: CommentStatus.SPAM,
  [PrismaCommentStatus.VISIBLE]: CommentStatus.VISIBLE,
};

const prismaStatusByDomain: Readonly<Record<CommentStatus, PrismaCommentStatus>> = {
  [CommentStatus.DELETED]: PrismaCommentStatus.DELETED,
  [CommentStatus.HIDDEN]: PrismaCommentStatus.HIDDEN,
  [CommentStatus.SPAM]: PrismaCommentStatus.SPAM,
  [CommentStatus.VISIBLE]: PrismaCommentStatus.VISIBLE,
};

function mutableFields(comment: Comment) {
  return {
    content: comment.content?.value ?? null,
    deletedAt: comment.deletedAt,
    editedAt: comment.editedAt,
    moderationReason: comment.moderationReason,
    status: prismaStatusByDomain[comment.status],
    updatedAt: comment.updatedAt,
  };
}

export class CommentMapper {
  static toDomain(record: PrismaComment): Comment {
    return Comment.restore({
      authorId: record.authorId,
      content: record.content ? CommentContent.create(record.content) : null,
      createdAt: record.createdAt,
      deletedAt: record.deletedAt,
      editedAt: record.editedAt,
      id: record.id,
      moderationReason: record.moderationReason,
      parentId: record.parentId,
      postId: record.postId,
      status: domainStatusByPrisma[record.status],
      updatedAt: record.updatedAt,
    });
  }

  static toPersistence(comment: Comment): Prisma.CommentUncheckedCreateInput {
    return {
      ...mutableFields(comment),
      authorId: comment.authorId,
      createdAt: comment.createdAt,
      id: comment.id,
      parentId: comment.parentId,
      postId: comment.postId,
    };
  }

  static toUpdate(comment: Comment): Prisma.CommentUncheckedUpdateInput {
    return mutableFields(comment);
  }
}
