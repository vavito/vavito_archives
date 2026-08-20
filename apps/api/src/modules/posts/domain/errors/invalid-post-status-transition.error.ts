import type { PostStatus } from '@api/modules/posts/domain/enums/post-status.enum';

export const INVALID_POST_STATUS_TRANSITION = 'INVALID_POST_STATUS_TRANSITION';

export class InvalidPostStatusTransitionError extends Error {
  readonly code = INVALID_POST_STATUS_TRANSITION;

  constructor(action: string, status: PostStatus) {
    super(`Cannot ${action} a post with status ${status}.`);
    this.name = InvalidPostStatusTransitionError.name;
  }
}
