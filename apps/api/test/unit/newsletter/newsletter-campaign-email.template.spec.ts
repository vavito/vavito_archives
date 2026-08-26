import {
  NEWSLETTER_UNSUBSCRIBE_PLACEHOLDER,
  newsletterCampaignDeliveryTemplate,
  newsletterCampaignSnapshot,
} from '@api/core/mail/templates/newsletter-campaign-email.template';

describe('newsletterCampaignEmailTemplate', () => {
  it('escapa conteúdo editorial e mantém placeholder no snapshot', () => {
    const html = newsletterCampaignSnapshot({
      articleUrl: 'https://vavitoarchives.com.br/artigos/teste?a=1&b=2',
      excerpt: '<script>alert(1)</script>',
      previewText: 'Preview & leitura',
      title: 'Título <seguro>',
    });

    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain(NEWSLETTER_UNSUBSCRIBE_PLACEHOLDER);
  });

  it('personaliza cancelamento sem alterar o snapshot armazenado', () => {
    const snapshot = `<a href="${NEWSLETTER_UNSUBSCRIBE_PLACEHOLDER}">Cancelar</a>`;
    const delivery = newsletterCampaignDeliveryTemplate(
      snapshot,
      'Preview',
      'https://vavitoarchives.com.br/artigos/teste',
      'https://vavitoarchives.com.br/newsletter/unsubscribe#token=A&B',
    );

    expect(delivery.html).toContain('#token=A&amp;B');
    expect(delivery.html).not.toContain(NEWSLETTER_UNSUBSCRIBE_PLACEHOLDER);
    expect(snapshot).toContain(NEWSLETTER_UNSUBSCRIBE_PLACEHOLDER);
  });
});
