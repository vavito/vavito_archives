import type { CommentStatus } from '@api/modules/comments/domain/enums/comment-status.enum';

export const INVALID_COMMENT_STATUS_TRANSITION = 'INVALID_COMMENT_STATUS_TRANSITION';

export class InvalidCommentStatusTransitionError extends Error {
  readonly code = INVALID_COMMENT_STATUS_TRANSITION;

  constructor(action: string, status: CommentStatus) {
    super(`Cannot ${action} a comment with status ${status}.`);
    this.name = InvalidCommentStatusTransitionError.name;
  }
}
