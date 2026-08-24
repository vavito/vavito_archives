import { CommentContentInvalidError } from '@api/modules/comments/domain/errors/comment-content-invalid.error';

export const MAX_COMMENT_CONTENT_LENGTH = 2_000;

export class CommentContent {
  private constructor(readonly value: string) {}

  static create(value: string): CommentContent {
    const normalized = value.trim();

    if (normalized.length === 0 || Array.from(normalized).length > MAX_COMMENT_CONTENT_LENGTH) {
      throw new CommentContentInvalidError();
    }

    return new CommentContent(normalized);
  }

  equals(other: CommentContent): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
