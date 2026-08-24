export const COMMENT_NESTING_LIMIT_EXCEEDED = 'COMMENT_NESTING_LIMIT_EXCEEDED';

export class CommentNestingLimitExceededError extends Error {
  readonly code = COMMENT_NESTING_LIMIT_EXCEEDED;

  constructor() {
    super('Comments support only root comments and direct replies.');
    this.name = CommentNestingLimitExceededError.name;
  }
}
