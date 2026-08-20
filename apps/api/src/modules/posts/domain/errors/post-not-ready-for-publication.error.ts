export const POST_NOT_READY_FOR_PUBLICATION = 'POST_NOT_READY_FOR_PUBLICATION';

export type PostPublicationField = 'content' | 'excerpt' | 'slug' | 'title';

export class PostNotReadyForPublicationError extends Error {
  readonly code = POST_NOT_READY_FOR_PUBLICATION;

  constructor(readonly missingFields: readonly PostPublicationField[]) {
    super(`Post is not ready for publication: ${missingFields.join(', ')}.`);
    this.name = PostNotReadyForPublicationError.name;
  }
}
