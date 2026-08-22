import type { Comment } from '@api/modules/comments/domain/entities/comment.entity';
import type { CommentStatus } from '@api/modules/comments/domain/enums/comment-status.enum';

export interface CommentAuthorRecord {
  avatarPath: string | null;
  displayName: string;
  id: string;
}

export interface CommentRecord {
  author: CommentAuthorRecord | null;
  comment: Comment;
}

export interface CommentThreadRecord extends CommentRecord {
  replies: CommentRecord[];
}

export interface PaginatedCommentRecords<T> {
  items: T[];
  total: number;
}

export interface PublicCommentsFilters {
  limit: number;
  page: number;
  postId: string;
}

export interface AdminCommentsFilters {
  limit: number;
  page: number;
  postId?: string;
  status?: CommentStatus;
}

export abstract class CommentsRepository {
  abstract create(comment: Comment): Promise<void>;
  abstract findById(id: string): Promise<CommentRecord | null>;
  abstract findReplyParent(parentId: string, postId: string): Promise<CommentRecord | null>;
  abstract listAdmin(
    filters: AdminCommentsFilters,
  ): Promise<PaginatedCommentRecords<CommentRecord>>;
  abstract listPublicThreads(
    filters: PublicCommentsFilters,
  ): Promise<PaginatedCommentRecords<CommentThreadRecord>>;
  abstract save(comment: Comment): Promise<void>;
}
