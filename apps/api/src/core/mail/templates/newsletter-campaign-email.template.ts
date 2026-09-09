export const NEWSLETTER_UNSUBSCRIBE_PLACEHOLDER = '{{unsubscribeUrl}}';

export interface NewsletterCampaignArticleInput {
  articleUrl: string;
  coverAlt: string | null;
  coverUrl: string | null;
  excerpt: string;
  title: string;
}

export interface NewsletterCampaignSnapshotInput {
  articles: readonly NewsletterCampaignArticleInput[];
  previewText: string;
}

export interface NewsletterCampaignDeliveryTemplate {
  html: string;
  text: string;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function newsletterCampaignSnapshot(input: NewsletterCampaignSnapshotInput): string {
  const articles = input.articles
    .map(
      (article) => `
    <article style="margin: 0 0 32px;">
      ${
        article.coverUrl
          ? `<img src="${escapeHtml(article.coverUrl)}" alt="${escapeHtml(article.coverAlt ?? article.title)}" style="display:block;width:100%;max-width:680px;height:auto;border-radius:16px;margin:0 0 18px;">`
          : ''
      }
      <h2 style="font-size: 24px; margin: 0 0 10px;">${escapeHtml(article.title)}</h2>
      <p>${escapeHtml(article.excerpt)}</p>
      <p><a href="${escapeHtml(article.articleUrl)}">Ler artigo</a></p>
    </article>`,
    )
    .join('');

  return `<!doctype html>
<html lang="pt-BR">
  <body style="font-family: Arial, sans-serif; color: #1f2937; line-height: 1.5;">
    <p style="color: #6b7280;">${escapeHtml(input.previewText)}</p>
    ${articles}
    <hr>
    <p style="font-size: 12px; color: #6b7280;">Não quer mais receber estes emails? <a href="${NEWSLETTER_UNSUBSCRIBE_PLACEHOLDER}">Cancele a inscrição</a>.</p>
  </body>
</html>`;
}

export function newsletterCampaignDeliveryTemplate(
  htmlSnapshot: string,
  previewText: string,
  articleUrl: string,
  unsubscribeUrl: string,
): NewsletterCampaignDeliveryTemplate {
  return {
    html: htmlSnapshot.replaceAll(NEWSLETTER_UNSUBSCRIBE_PLACEHOLDER, escapeHtml(unsubscribeUrl)),
    text: `${previewText}\n\nLeia o artigo: ${articleUrl}\n\nCancelar inscrição: ${unsubscribeUrl}`,
  };
}
