export const COMMENT_LIMITS = {
  content: 2_000,
} as const;

export function normalizeCommentContent(content: string): string {
  return content.normalize('NFC').trim();
}

export function validateCommentContent(content: string): string | null {
  const normalized = normalizeCommentContent(content);

  if (!normalized) {
    return 'Escreva uma mensagem antes de publicar.';
  }

  if (normalized.length > COMMENT_LIMITS.content) {
    return `O comentário deve ter no máximo ${COMMENT_LIMITS.content.toLocaleString('pt-BR')} caracteres.`;
  }

  return null;
}
