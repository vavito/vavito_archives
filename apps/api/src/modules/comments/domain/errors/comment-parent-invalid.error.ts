export const COMMENT_PARENT_INVALID = 'COMMENT_PARENT_INVALID';

export class CommentParentInvalidError extends Error {
  readonly code = COMMENT_PARENT_INVALID;

  constructor() {
    super('Comment parent must be a root comment from the same post.');
    this.name = CommentParentInvalidError.name;
  }
}
