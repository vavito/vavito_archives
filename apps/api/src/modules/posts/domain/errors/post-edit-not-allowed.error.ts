export const POST_EDIT_NOT_ALLOWED = 'POST_EDIT_NOT_ALLOWED';

export class PostEditNotAllowedError extends Error {
  readonly code = POST_EDIT_NOT_ALLOWED;

  constructor() {
    super('Archived posts cannot be edited.');
    this.name = PostEditNotAllowedError.name;
  }
}
