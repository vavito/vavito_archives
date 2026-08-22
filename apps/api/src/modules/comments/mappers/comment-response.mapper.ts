import { CommentStatus } from '@api/modules/comments/domain/enums/comment-status.enum';
import type {
  CommentAdminResponseDto,
  CommentAuthorDto,
  CommentResponseDto,
} from '@api/modules/comments/dto/response/comment-response.dto';
import type {
  CommentRecord,
  CommentThreadRecord,
} from '@api/modules/comments/repositories/comments.repository';

export class CommentResponseMapper {
  static toPublic(
    record: CommentRecord,
    author: CommentAuthorDto | null,
    replies: CommentResponseDto[] = [],
  ): CommentResponseDto {
    const { comment } = record;

    if (![CommentStatus.VISIBLE, CommentStatus.DELETED].includes(comment.status)) {
      throw new Error('Only visible or deleted comments can be mapped to public responses.');
    }

    return {
      author,
      content: comment.content?.value ?? null,
      createdAt: comment.createdAt.toISOString(),
      edited: comment.editedAt !== null,
      editedAt: comment.editedAt?.toISOString() ?? null,
      id: comment.id,
      parentId: comment.parentId,
      postId: comment.postId,
      replies,
      status: comment.status as CommentStatus.VISIBLE | CommentStatus.DELETED,
    };
  }

  static toThread(
    record: CommentThreadRecord,
    author: CommentAuthorDto | null,
    replyAuthors: readonly (CommentAuthorDto | null)[],
  ): CommentResponseDto {
    return this.toPublic(
      record,
      author,
      record.replies.map((reply, index) => this.toPublic(reply, replyAuthors[index] ?? null)),
    );
  }

  static toAdmin(record: CommentRecord, author: CommentAuthorDto | null): CommentAdminResponseDto {
    const { comment } = record;

    return {
      author,
      content: comment.content?.value ?? null,
      createdAt: comment.createdAt.toISOString(),
      deletedAt: comment.deletedAt?.toISOString() ?? null,
      editedAt: comment.editedAt?.toISOString() ?? null,
      id: comment.id,
      moderationReason: comment.moderationReason,
      parentId: comment.parentId,
      postId: comment.postId,
      status: comment.status,
    };
  }
}
