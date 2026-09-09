export const ARTICLE_IMAGE_LIMITS = {
  maxBytes: 10 * 1024 * 1024,
} as const;

const ACCEPTED_ARTICLE_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export interface ArticleImageInput {
  altText: string;
  file: File | null;
}

export interface ValidArticleImageInput {
  altText: string;
  file: File;
}

export type ArticleImageValidationResult =
  { data: ValidArticleImageInput; ok: true } | { message: string; ok: false };

export function normalizeArticleImageAltText(value: string): string {
  return value.trim().replaceAll(/\s+/gu, ' ');
}

export function validateArticleImage(input: ArticleImageInput): ArticleImageValidationResult {
  if (!input.file) {
    return { message: 'Escolha uma imagem para continuar.', ok: false };
  }

  if (!ACCEPTED_ARTICLE_IMAGE_TYPES.has(input.file.type)) {
    return { message: 'Escolha uma imagem JPG, PNG ou WebP.', ok: false };
  }

  if (input.file.size === 0) {
    return { message: 'A imagem escolhida está vazia.', ok: false };
  }

  if (input.file.size > ARTICLE_IMAGE_LIMITS.maxBytes) {
    return { message: 'A imagem deve ter no máximo 10 MB.', ok: false };
  }

  const altText = normalizeArticleImageAltText(input.altText);

  if (!altText) {
    return {
      message: 'Descreva a imagem para leitores que não conseguem visualizá-la.',
      ok: false,
    };
  }

  return { data: { altText, file: input.file }, ok: true };
}
