export const NEWSLETTER_UNSUBSCRIBE_PLACEHOLDER = '{{unsubscribeUrl}}';

export interface NewsletterCampaignSnapshotInput {
  articleUrl: string;
  excerpt: string;
  previewText: string;
  title: string;
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
  return `<!doctype html>
<html lang="pt-BR">
  <body style="font-family: Arial, sans-serif; color: #1f2937; line-height: 1.5;">
    <p style="color: #6b7280;">${escapeHtml(input.previewText)}</p>
    <h1 style="font-size: 24px;">${escapeHtml(input.title)}</h1>
    <p>${escapeHtml(input.excerpt)}</p>
    <p><a href="${escapeHtml(input.articleUrl)}">Ler artigo</a></p>
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
