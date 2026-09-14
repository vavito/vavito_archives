import { NEW_COMMENT_EXCERPT_MAX_LENGTH } from '@api/core/mail/mail.constants';
import type { NewCommentNotification } from '@api/core/mail/services/mail.service';
import {
  emailCtaButton,
  escapeEmailHtml,
  vavitoEmailHtml,
} from '@api/core/mail/templates/vavito-email.template';

export interface NewCommentEmailTemplate {
  html: string;
  subject: string;
  text: string;
}

function normalizeInlineText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
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
  siteUrl: string,
): NewCommentEmailTemplate {
  const authorDisplayName = normalizeInlineText(notification.authorDisplayName) || 'Leitor';
  const commentExcerpt = excerpt(notification.commentContent);
  const postTitle = normalizeInlineText(notification.postTitle);
  const eventLabel = notification.isReply ? 'Nova resposta' : 'Novo comentário';

  return {
    html: vavitoEmailHtml({
      bodyHtml: `<header style="margin-bottom:30px;">
        <p style="color:#0369a1;font-size:12px;font-weight:700;letter-spacing:0.16em;margin:0 0 10px;text-transform:uppercase;">Comunidade</p>
        <h1 class="email-title" style="color:#18191b;font-size:36px;letter-spacing:-0.025em;line-height:1.15;margin:0 0 12px;">${escapeEmailHtml(eventLabel)}</h1>
        <p style="color:#71717a;font-size:17px;line-height:1.55;margin:0;">Um leitor participou da conversa no Vavito Archives.</p>
      </header>
      <div style="border-top:1px solid #e4e4e7;padding-top:24px;">
        <p style="color:#71717a;font-size:13px;line-height:1.5;margin:0 0 8px;"><strong style="color:#3f3f46;">Artigo:</strong> ${escapeEmailHtml(postTitle)}</p>
        <p style="color:#71717a;font-size:13px;line-height:1.5;margin:0 0 18px;"><strong style="color:#3f3f46;">Leitor:</strong> ${escapeEmailHtml(authorDisplayName)}</p>
        <blockquote style="background:#f4f4f5;border-left:3px solid #7dd3fc;border-radius:0 12px 12px 0;color:#3f3f46;font-size:16px;line-height:1.65;margin:0;padding:20px 22px;">${escapeEmailHtml(commentExcerpt)}</blockquote>
      </div>
      <div style="margin-top:30px;text-align:center;">${emailCtaButton('Abrir fila de moderação', moderationUrl)}</div>`,
      previewText: `${eventLabel} em ${postTitle}`,
      siteUrl,
    }),
    subject: `${eventLabel} em ${postTitle}`,
    text: `${eventLabel}\n\nArtigo: ${postTitle}\nLeitor: ${authorDisplayName}\nTrecho: ${commentExcerpt}\n\nModerar: ${moderationUrl}`,
  };
}
