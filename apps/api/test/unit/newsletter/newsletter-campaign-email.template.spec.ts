import {
  NEWSLETTER_UNSUBSCRIBE_PLACEHOLDER,
  type NewsletterCampaignArticleInput,
  newsletterCampaignDeliveryTemplate,
  newsletterCampaignSnapshot,
} from '@api/core/mail/templates/newsletter-campaign-email.template';

const SITE_URL = 'https://vavitoarchives.com.br';

function article(
  overrides: Partial<NewsletterCampaignArticleInput> = {},
): NewsletterCampaignArticleInput {
  return {
    articleUrl: `${SITE_URL}/artigos/teste`,
    authorName: 'João Victor',
    content: {
      content: [
        {
          content: [
            { marks: [{ type: 'bold' }], text: 'Conteúdo completo', type: 'text' },
            { text: ' do artigo.', type: 'text' },
          ],
          type: 'paragraph',
        },
        {
          attrs: { level: 2 },
          content: [{ text: 'Uma seção importante', type: 'text' }],
          type: 'heading',
        },
      ],
      type: 'doc',
    },
    coverAlt: 'Capa & segura',
    coverPositionX: 35,
    coverPositionY: 65,
    coverUrl: 'https://cdn.example.com/capa.webp',
    excerpt: 'Resumo do artigo.',
    publishedAt: '2026-08-24T12:00:00.000Z',
    readingTimeMinutes: 5,
    title: 'Título seguro',
    ...overrides,
  };
}

function snapshot(articles: NewsletterCampaignArticleInput[]): string {
  return newsletterCampaignSnapshot({
    articles,
    previewText: 'Preview & leitura',
    siteUrl: SITE_URL,
  });
}

describe('newsletterCampaignEmailTemplate', () => {
  it('entrega o artigo completo, metadados, CTA e marca quando há um artigo', () => {
    const html = snapshot([
      article({ excerpt: '<script>alert(1)</script>', title: 'Título <seguro>' }),
    ]);

    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('<strong style="font-weight:700;">Conteúdo completo</strong>');
    expect(html).toContain('Uma seção importante');
    expect(html).toContain('Ler e acompanhar no site');
    expect(html).toContain('João Victor');
    expect(html).toContain('/brand/vavito-symbol.png');
    expect(html).toContain(NEWSLETTER_UNSUBSCRIBE_PLACEHOLDER);
  });

  it('entrega apenas previews uniformes quando há mais de um artigo', () => {
    const html = snapshot([
      article(),
      article({
        articleUrl: `${SITE_URL}/artigos/outro`,
        content: {
          content: [{ content: [{ text: 'Não deve aparecer', type: 'text' }], type: 'paragraph' }],
          type: 'doc',
        },
        title: 'Outro artigo',
      }),
    ]);

    expect(html).toContain('Leituras selecionadas para você');
    expect(html).toContain('Outro artigo');
    expect(html).not.toContain('Conteúdo completo');
    expect(html).not.toContain('Não deve aparecer');
    expect(html.match(/height:280px/g)).toHaveLength(4);
    expect(html).toContain('object-fit:cover');
    expect(html).toContain('object-position:35% 65%');
  });

  it('remove URLs perigosas do conteúdo editorial', () => {
    const html = snapshot([
      article({
        content: {
          content: [
            {
              content: [
                {
                  marks: [{ attrs: { href: 'javascript:alert(1)' }, type: 'link' }],
                  text: 'Link seguro',
                  type: 'text',
                },
              ],
              type: 'paragraph',
            },
            { attrs: { src: 'javascript:alert(2)' }, type: 'image' },
          ],
          type: 'doc',
        },
      }),
    ]);

    expect(html).not.toContain('javascript:');
    expect(html).toContain('Link seguro');
  });

  it('personaliza cancelamento e inclui o conteúdo no fallback textual', () => {
    const htmlSnapshot = snapshot([article()]);
    const delivery = newsletterCampaignDeliveryTemplate(
      htmlSnapshot,
      'Preview',
      `${SITE_URL}/artigos/teste`,
      `${SITE_URL}/newsletter/unsubscribe#token=A&B`,
    );

    expect(delivery.html).toContain('#token=A&amp;B');
    expect(delivery.html).not.toContain(NEWSLETTER_UNSUBSCRIBE_PLACEHOLDER);
    expect(delivery.text).toContain('Conteúdo completo do artigo.');
    expect(delivery.text).toContain(`Ler no site: ${SITE_URL}/artigos/teste`);
    expect(delivery.text).not.toContain('@media');
    expect(htmlSnapshot).toContain(NEWSLETTER_UNSUBSCRIBE_PLACEHOLDER);
  });
});
