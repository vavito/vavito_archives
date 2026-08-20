import { PostSlugInvalidError } from '@api/modules/posts/domain/errors/post-slug-invalid.error';

export const MAX_POST_SLUG_LENGTH = 255;

function normalizeSlug(value: string): string {
  return value
    .normalize('NFKD')
    .replaceAll(/\p{Mark}/gu, '')
    .toLowerCase()
    .trim()
    .replaceAll(/['’]/g, '')
    .replaceAll(/[^a-z0-9]+/g, '-')
    .replaceAll(/^-+|-+$/g, '');
}

export class Slug {
  private constructor(readonly value: string) {}

  static create(value: string): Slug {
    const normalized = normalizeSlug(value);

    if (normalized.length === 0 || normalized.length > MAX_POST_SLUG_LENGTH) {
      throw new PostSlugInvalidError();
    }

    return new Slug(normalized);
  }

  equals(other: Slug): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
