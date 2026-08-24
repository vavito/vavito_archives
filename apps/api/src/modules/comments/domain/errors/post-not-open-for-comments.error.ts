export const POST_NOT_OPEN_FOR_COMMENTS = 'POST_NOT_OPEN_FOR_COMMENTS';

export class PostNotOpenForCommentsError extends Error {
  readonly code = POST_NOT_OPEN_FOR_COMMENTS;

  constructor() {
    super('Post is not open for comments.');
    this.name = PostNotOpenForCommentsError.name;
  }
}
