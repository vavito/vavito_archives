import { CommentStatus } from '@api/modules/comments/domain/enums/comment-status.enum';
import { CommentAlreadyDeletedError } from '@api/modules/comments/domain/errors/comment-already-deleted.error';
import { CommentEditNotAllowedError } from '@api/modules/comments/domain/errors/comment-edit-not-allowed.error';
import { InvalidCommentStatusTransitionError } from '@api/modules/comments/domain/errors/invalid-comment-status-transition.error';
import type { CommentContent } from '@api/modules/comments/domain/value-objects/comment-content.value-object';

export interface CreateCommentProps {
  authorId: string;
  content: CommentContent;
  id: string;
  now: Date;
  parentId?: string | null;
  postId: string;
}

export interface RestoreCommentProps {
  authorId: string | null;
  content: CommentContent | null;
  createdAt: Date;
  deletedAt: Date | null;
  editedAt: Date | null;
  id: string;
  moderationReason: string | null;
  parentId: string | null;
  postId: string;
  status: CommentStatus;
  updatedAt: Date;
}

function cloneDate(date: Date): Date {
  return new Date(date.getTime());
}

function normalizeReason(reason?: string | null): string | null {
  const normalized = reason?.trim();
  return normalized ? normalized : null;
}

export class Comment {
  private constructor(private readonly props: RestoreCommentProps) {}

  static create(props: CreateCommentProps): Comment {
    return new Comment({
      authorId: props.authorId,
      content: props.content,
      createdAt: cloneDate(props.now),
      deletedAt: null,
      editedAt: null,
      id: props.id,
      moderationReason: null,
      parentId: props.parentId ?? null,
      postId: props.postId,
      status: CommentStatus.VISIBLE,
      updatedAt: cloneDate(props.now),
    });
  }

  static restore(props: RestoreCommentProps): Comment {
    return new Comment({
      ...props,
      createdAt: cloneDate(props.createdAt),
      deletedAt: props.deletedAt ? cloneDate(props.deletedAt) : null,
      editedAt: props.editedAt ? cloneDate(props.editedAt) : null,
      moderationReason: normalizeReason(props.moderationReason),
      updatedAt: cloneDate(props.updatedAt),
    });
  }

  get authorId(): string | null {
    return this.props.authorId;
  }

  get content(): CommentContent | null {
    return this.props.content;
  }

  get createdAt(): Date {
    return cloneDate(this.props.createdAt);
  }

  get deletedAt(): Date | null {
    return this.props.deletedAt ? cloneDate(this.props.deletedAt) : null;
  }

  get editedAt(): Date | null {
    return this.props.editedAt ? cloneDate(this.props.editedAt) : null;
  }

  get id(): string {
    return this.props.id;
  }

  get moderationReason(): string | null {
    return this.props.moderationReason;
  }

  get parentId(): string | null {
    return this.props.parentId;
  }

  get postId(): string {
    return this.props.postId;
  }

  get status(): CommentStatus {
    return this.props.status;
  }

  get updatedAt(): Date {
    return cloneDate(this.props.updatedAt);
  }

  edit(content: CommentContent, now: Date): void {
    this.ensureNotDeleted();

    if (this.props.status !== CommentStatus.VISIBLE) {
      throw new CommentEditNotAllowedError();
    }

    this.props.content = content;
    this.props.editedAt = cloneDate(now);
    this.props.updatedAt = cloneDate(now);
  }

  approve(now: Date): void {
    this.ensureNotDeleted();
    this.ensureStatus('approve', CommentStatus.HIDDEN, CommentStatus.SPAM);

    this.props.moderationReason = null;
    this.props.status = CommentStatus.VISIBLE;
    this.props.updatedAt = cloneDate(now);
  }

  hide(now: Date, reason?: string | null): void {
    this.ensureNotDeleted();
    this.ensureStatus('hide', CommentStatus.VISIBLE, CommentStatus.SPAM);

    this.props.moderationReason = normalizeReason(reason);
    this.props.status = CommentStatus.HIDDEN;
    this.props.updatedAt = cloneDate(now);
  }

  markAsSpam(now: Date, reason?: string | null): void {
    this.ensureNotDeleted();
    this.ensureStatus('mark as spam', CommentStatus.VISIBLE, CommentStatus.HIDDEN);

    this.props.moderationReason = normalizeReason(reason);
    this.props.status = CommentStatus.SPAM;
    this.props.updatedAt = cloneDate(now);
  }

  softDelete(now: Date): void {
    this.ensureNotDeleted();

    this.props.content = null;
    this.props.deletedAt = cloneDate(now);
    this.props.status = CommentStatus.DELETED;
    this.props.updatedAt = cloneDate(now);
  }

  private ensureNotDeleted(): void {
    if (this.props.status === CommentStatus.DELETED) {
      throw new CommentAlreadyDeletedError();
    }
  }

  private ensureStatus(action: string, ...allowedStatuses: CommentStatus[]): void {
    if (!allowedStatuses.includes(this.props.status)) {
      throw new InvalidCommentStatusTransitionError(action, this.props.status);
    }
  }
}
