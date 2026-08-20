export const POST_DELETE_NOT_ALLOWED = 'POST_DELETE_NOT_ALLOWED';

export class PostDeleteNotAllowedError extends Error {
  readonly code = POST_DELETE_NOT_ALLOWED;

  constructor() {
    super('A published post cannot be permanently deleted.');
    this.name = PostDeleteNotAllowedError.name;
  }
}
