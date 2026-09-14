import {
  emailCtaButton,
  escapeEmailHtml,
  vavitoEmailHtml,
} from '@api/core/mail/templates/vavito-email.template';

export const NEWSLETTER_UNSUBSCRIBE_PLACEHOLDER = '{{unsubscribeUrl}}';

interface TiptapMark {
  attrs?: Record<string, unknown>;
  type?: unknown;
}

interface TiptapNode {
  attrs?: Record<string, unknown>;
  content?: unknown;
  marks?: unknown;
  text?: unknown;
  type?: unknown;
}

export interface NewsletterCampaignArticleInput {
  articleUrl: string;
  authorName: string;
  content: Record<string, unknown>;
  coverAlt: string | null;
  coverPositionX?: number;
  coverPositionY?: number;
  coverUrl: string | null;
  excerpt: string;
  publishedAt: string;
  readingTimeMinutes: number;
  title: string;
}

export interface NewsletterCampaignSnapshotInput {
  articles: readonly NewsletterCampaignArticleInput[];
  previewText: string;
  siteUrl: string;
}

export interface NewsletterCampaignDeliveryTemplate {
  html: string;
  text: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function nodes(value: unknown): TiptapNode[] {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

function marks(value: unknown): TiptapMark[] {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

function stringAttribute(attrs: Record<string, unknown> | undefined, key: string): string | null {
  const value = attrs?.[key];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function safeUrl(
  value: string | null,
  siteUrl: string,
  protocols: readonly string[],
): string | null {
  if (!value) return null;

  try {
    const url = new URL(value, siteUrl);
    return protocols.includes(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
}

function renderMarks(text: string, value: unknown, siteUrl: string): string {
  return marks(value).reduce((content, mark) => {
    switch (mark.type) {
      case 'bold':
        return `<strong style="font-weight:700;">${content}</strong>`;
      case 'code':
        return `<code style="background:#f1f3f5;border-radius:4px;font-family:monospace;font-size:0.9em;padding:2px 5px;">${content}</code>`;
      case 'italic':
        return `<em>${content}</em>`;
      case 'link': {
        const href = safeUrl(stringAttribute(mark.attrs, 'href'), siteUrl, [
          'http:',
          'https:',
          'mailto:',
        ]);
        return href
          ? `<a href="${escapeEmailHtml(href)}" target="_blank" rel="noopener noreferrer" style="color:#0369a1;text-decoration:underline;">${content}</a>`
          : content;
      }
      case 'strike':
        return `<s>${content}</s>`;
      case 'underline':
        return `<u>${content}</u>`;
      default:
        return content;
    }
  }, escapeEmailHtml(text));
}

function renderChildren(node: TiptapNode, siteUrl: string): string {
  return nodes(node.content)
    .map((child) => renderNode(child, siteUrl))
    .join('');
}

function renderNode(node: TiptapNode, siteUrl: string): string {
  const children = renderChildren(node, siteUrl);

  switch (node.type) {
    case 'blockquote':
      return `<blockquote style="border-left:3px solid #7dd3fc;color:#52525b;margin:28px 0;padding:2px 0 2px 20px;">${children}</blockquote>`;
    case 'bulletList':
      return `<ul style="margin:18px 0;padding-left:26px;">${children}</ul>`;
    case 'codeBlock':
      return `<pre style="background:#18191b;border-radius:10px;color:#e6e5e1;font-family:monospace;font-size:14px;line-height:1.6;margin:24px 0;overflow-wrap:anywhere;padding:18px;white-space:pre-wrap;"><code>${children}</code></pre>`;
    case 'hardBreak':
      return '<br>';
    case 'heading': {
      const level = node.attrs?.['level'] === 3 ? 3 : 2;
      const fontSize = level === 3 ? '22px' : '28px';
      return `<h${level} style="color:#18191b;font-size:${fontSize};line-height:1.25;margin:38px 0 14px;">${children}</h${level}>`;
    }
    case 'horizontalRule':
      return '<hr style="border:0;border-top:1px solid #e4e4e7;margin:36px 0;">';
    case 'image': {
      const src = safeUrl(stringAttribute(node.attrs, 'src'), siteUrl, ['http:', 'https:']);
      if (!src) return '';
      const alt = stringAttribute(node.attrs, 'alt') ?? '';
      const caption = stringAttribute(node.attrs, 'title');

      return `<figure style="margin:30px 0;">
        <img src="${escapeEmailHtml(src)}" alt="${escapeEmailHtml(alt)}" style="border:0;border-radius:12px;display:block;height:auto;max-width:100%;width:100%;">
        ${caption ? `<figcaption style="color:#71717a;font-size:13px;line-height:1.5;margin-top:8px;text-align:center;">${escapeEmailHtml(caption)}</figcaption>` : ''}
      </figure>`;
    }
    case 'listItem':
      return `<li style="margin:7px 0;">${children}</li>`;
    case 'orderedList': {
      const start = node.attrs?.['start'];
      const startAttribute = typeof start === 'number' ? ` start="${Math.max(1, start)}"` : '';
      return `<ol${startAttribute} style="margin:18px 0;padding-left:26px;">${children}</ol>`;
    }
    case 'paragraph':
      return `<p style="color:#3f3f46;font-size:18px;line-height:1.75;margin:0 0 22px;">${children || '&nbsp;'}</p>`;
    case 'text':
      return typeof node.text === 'string' ? renderMarks(node.text, node.marks, siteUrl) : '';
    default:
      return children;
  }
}

function renderDocument(content: Record<string, unknown>, siteUrl: string): string {
  if (content['type'] !== 'doc') return '';
  return nodes(content['content'])
    .map((node) => renderNode(node, siteUrl))
    .join('');
}

function formatPublishedAt(value: string): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    timeZone: 'UTC',
    year: 'numeric',
  }).format(date);
}

function coverImage(article: NewsletterCampaignArticleInput, height: number): string {
  if (!article.coverUrl) return '';
  const positionX = Math.min(100, Math.max(0, article.coverPositionX ?? 50));
  const positionY = Math.min(100, Math.max(0, article.coverPositionY ?? 50));

  const className = height === 360 ? 'email-cover email-cover-single' : 'email-cover';

  return `<div class="${className}" style="background:#e4e4e7;border-radius:14px;height:${height}px;margin:0 0 24px;overflow:hidden;width:100%;">
    <img class="${className}" src="${escapeEmailHtml(article.coverUrl)}" alt="${escapeEmailHtml(article.coverAlt ?? article.title)}" width="640" height="${height}" style="border:0;display:block;height:${height}px;max-width:100%;object-fit:cover;object-position:${positionX}% ${positionY}%;width:100%;">
  </div>`;
}

function articleMeta(article: NewsletterCampaignArticleInput): string {
  const publishedAt = formatPublishedAt(article.publishedAt);
  const parts = [
    escapeEmailHtml(article.authorName),
    publishedAt ? escapeEmailHtml(publishedAt) : null,
    `${article.readingTimeMinutes} min de leitura`,
  ].filter((part): part is string => Boolean(part));

  return `<p style="color:#71717a;font-size:13px;line-height:1.5;margin:16px 0 28px;">${parts.join(' &nbsp;·&nbsp; ')}</p>`;
}

function singleArticle(article: NewsletterCampaignArticleInput, siteUrl: string): string {
  return `<article>
    <h1 class="email-title" style="color:#18191b;font-size:38px;letter-spacing:-0.025em;line-height:1.12;margin:0 0 14px;">${escapeEmailHtml(article.title)}</h1>
    <p style="color:#71717a;font-size:20px;line-height:1.5;margin:0;">${escapeEmailHtml(article.excerpt)}</p>
    ${articleMeta(article)}
    ${coverImage(article, 360)}
    <div style="border-top:1px solid #e4e4e7;padding-top:34px;">${renderDocument(article.content, siteUrl)}</div>
    <div style="border-top:1px solid #e4e4e7;margin-top:38px;padding-top:30px;text-align:center;">
      <p style="color:#52525b;font-size:15px;line-height:1.6;margin:0 0 18px;">Continue a conversa, salve o artigo ou compartilhe com alguém.</p>
      ${emailCtaButton('Ler e acompanhar no site', article.articleUrl)}
    </div>
  </article>`;
}

function articlePreview(article: NewsletterCampaignArticleInput): string {
  return `<article style="border-bottom:1px solid #e4e4e7;margin:0 0 34px;padding:0 0 34px;">
    ${coverImage(article, 280)}
    <h2 style="color:#18191b;font-size:26px;letter-spacing:-0.015em;line-height:1.25;margin:0 0 10px;">${escapeEmailHtml(article.title)}</h2>
    <p style="color:#52525b;font-size:17px;line-height:1.6;margin:0 0 14px;">${escapeEmailHtml(article.excerpt)}</p>
    ${articleMeta(article)}
    <p style="margin:0;"><a href="${escapeEmailHtml(article.articleUrl)}" target="_blank" rel="noopener noreferrer" style="color:#0369a1;font-size:15px;font-weight:700;text-decoration:none;">Ler artigo &nbsp;↗</a></p>
  </article>`;
}

function htmlToPlainText(html: string): string {
  return html
    .replace(/<head\b[^>]*>[\s\S]*?<\/head>/giu, '')
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/giu, '')
    .replace(/<(br|hr)\b[^>]*>/giu, '\n')
    .replace(/<\/(article|blockquote|div|h[1-6]|li|ol|p|pre|table|tr|ul)>/giu, '\n')
    .replace(/<[^>]+>/gu, '')
    .replaceAll('&nbsp;', ' ')
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&#039;', "'")
    .replace(/\n[ \t]+/gu, '\n')
    .replace(/\n{3,}/gu, '\n\n')
    .trim();
}

export function newsletterCampaignSnapshot(input: NewsletterCampaignSnapshotInput): string {
  const isSingleArticle = input.articles.length === 1;
  const body = isSingleArticle
    ? singleArticle(input.articles[0]!, input.siteUrl)
    : `<header style="margin-bottom:34px;">
        <p style="color:#0369a1;font-size:12px;font-weight:700;letter-spacing:0.16em;margin:0 0 10px;text-transform:uppercase;">Seleção Vavito</p>
        <h1 class="email-title" style="color:#18191b;font-size:34px;letter-spacing:-0.025em;line-height:1.15;margin:0 0 12px;">Leituras selecionadas para você</h1>
        <p style="color:#71717a;font-size:18px;line-height:1.55;margin:0;">${escapeEmailHtml(input.previewText)}</p>
      </header>
      ${input.articles.map(articlePreview).join('')}`;

  return vavitoEmailHtml({
    bodyHtml: body,
    footerHtml: `<p style="color:#71717a;font-size:12px;line-height:1.6;margin:22px 0 0;text-align:center;">Você recebe este email porque se inscreveu no Vavito Archives.<br><a href="${NEWSLETTER_UNSUBSCRIBE_PLACEHOLDER}" style="color:#52525b;text-decoration:underline;">Cancelar inscrição</a></p>`,
    previewText: input.previewText,
    responsiveCss:
      '.email-cover { height: 190px !important; } .email-cover-single { height: 220px !important; }',
    siteUrl: input.siteUrl,
  });
}

export function newsletterCampaignDeliveryTemplate(
  htmlSnapshot: string,
  previewText: string,
  articleUrl: string,
  unsubscribeUrl: string,
): NewsletterCampaignDeliveryTemplate {
  const plainText = htmlToPlainText(htmlSnapshot) || previewText;

  return {
    html: htmlSnapshot.replaceAll(
      NEWSLETTER_UNSUBSCRIBE_PLACEHOLDER,
      escapeEmailHtml(unsubscribeUrl),
    ),
    text: `${plainText}\n\nLer no site: ${articleUrl}\n\nCancelar inscrição: ${unsubscribeUrl}`,
  };
}
