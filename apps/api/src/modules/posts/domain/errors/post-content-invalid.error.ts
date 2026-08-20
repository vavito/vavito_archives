export const POST_CONTENT_INVALID = 'POST_CONTENT_INVALID';

export class PostContentInvalidError extends Error {
  readonly code = POST_CONTENT_INVALID;

  constructor() {
    super('Post content must be a supported Tiptap document.');
    this.name = PostContentInvalidError.name;
  }
}
