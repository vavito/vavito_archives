export const POST_SLUG_INVALID = 'POST_SLUG_INVALID';

export class PostSlugInvalidError extends Error {
  readonly code = POST_SLUG_INVALID;

  constructor() {
    super('Post slug must use the canonical format and contain at most 255 characters.');
    this.name = PostSlugInvalidError.name;
  }
}
