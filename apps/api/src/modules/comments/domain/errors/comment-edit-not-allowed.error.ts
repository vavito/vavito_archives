export const COMMENT_EDIT_NOT_ALLOWED = 'COMMENT_EDIT_NOT_ALLOWED';

export class CommentEditNotAllowedError extends Error {
  readonly code = COMMENT_EDIT_NOT_ALLOWED;

  constructor() {
    super('Comment cannot be edited in its current state.');
    this.name = CommentEditNotAllowedError.name;
  }
}
