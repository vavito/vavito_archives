export const COMMENT_ALREADY_DELETED = 'COMMENT_ALREADY_DELETED';

export class CommentAlreadyDeletedError extends Error {
  readonly code = COMMENT_ALREADY_DELETED;

  constructor() {
    super('Comment is already deleted.');
    this.name = CommentAlreadyDeletedError.name;
  }
}
