import {
  NEWSLETTER_UNSUBSCRIBE_PLACEHOLDER,
  newsletterCampaignDeliveryTemplate,
  newsletterCampaignSnapshot,
} from '@api/core/mail/templates/newsletter-campaign-email.template';

describe('newsletterCampaignEmailTemplate', () => {
  it('escapa conteúdo editorial e mantém placeholder no snapshot', () => {
    const html = newsletterCampaignSnapshot({
      articles: [
        {
          articleUrl: 'https://vavitoarchives.com.br/artigos/teste?a=1&b=2',
          coverAlt: 'Capa & segura',
          coverUrl: 'https://cdn.example.com/capa.webp',
          excerpt: '<script>alert(1)</script>',
          title: 'Título <seguro>',
        },
      ],
      previewText: 'Preview & leitura',
    });

    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('https://cdn.example.com/capa.webp');
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
