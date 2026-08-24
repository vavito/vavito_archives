export const COMMENT_CONTENT_INVALID = 'COMMENT_CONTENT_INVALID';

export class CommentContentInvalidError extends Error {
  readonly code = COMMENT_CONTENT_INVALID;

  constructor() {
    super('Comment content must not be empty or exceed the configured limit.');
    this.name = CommentContentInvalidError.name;
  }
}
