import { NEW_COMMENT_EXCERPT_MAX_LENGTH } from '@api/core/mail/mail.constants';
import type { NewCommentNotification } from '@api/core/mail/services/mail.service';

export interface NewCommentEmailTemplate {
  html: string;
  subject: string;
  text: string;
}

function normalizeInlineText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function excerpt(value: string): string {
  const normalized = normalizeInlineText(value);
  const characters = Array.from(normalized);

  if (characters.length <= NEW_COMMENT_EXCERPT_MAX_LENGTH) return normalized;
  return `${characters.slice(0, NEW_COMMENT_EXCERPT_MAX_LENGTH).join('')}…`;
}

export function newCommentEmailTemplate(
  notification: NewCommentNotification,
  moderationUrl: string,
): NewCommentEmailTemplate {
  const authorDisplayName = normalizeInlineText(notification.authorDisplayName) || 'Leitor';
  const commentExcerpt = excerpt(notification.commentContent);
  const postTitle = normalizeInlineText(notification.postTitle);
  const eventLabel = notification.isReply ? 'Nova resposta' : 'Novo comentário';

  return {
    html: `<!doctype html>
<html lang="pt-BR">
  <body style="font-family: Arial, sans-serif; color: #1f2937; line-height: 1.5;">
    <h1 style="font-size: 20px;">${escapeHtml(eventLabel)}</h1>
    <p><strong>Artigo:</strong> ${escapeHtml(postTitle)}</p>
    <p><strong>Leitor:</strong> ${escapeHtml(authorDisplayName)}</p>
    <p><strong>Trecho:</strong> ${escapeHtml(commentExcerpt)}</p>
    <p><a href="${escapeHtml(moderationUrl)}">Abrir fila de moderação</a></p>
  </body>
</html>`,
    subject: `${eventLabel} em ${postTitle}`,
    text: `${eventLabel}\n\nArtigo: ${postTitle}\nLeitor: ${authorDisplayName}\nTrecho: ${commentExcerpt}\n\nModerar: ${moderationUrl}`,
  };
}
