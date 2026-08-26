import { newsletterConfirmationEmailTemplate } from '@api/core/mail/templates/newsletter-confirmation-email.template';

describe('newsletterConfirmationEmailTemplate', () => {
  it('inclui confirmação e cancelamento nas versões HTML e texto', () => {
    const confirmationUrl = 'https://vavitoarchives.com.br/newsletter/confirm?token=confirmation';
    const unsubscribeUrl = 'https://vavitoarchives.com.br/newsletter/unsubscribe?token=unsubscribe';

    const template = newsletterConfirmationEmailTemplate(confirmationUrl, unsubscribeUrl);

    expect(template.subject).toBe('Confirme sua inscrição no Vavito Archives');
    expect(template.html).toContain('Confirmar inscrição');
    expect(template.html).toContain(confirmationUrl.replace('&', '&amp;'));
    expect(template.html).toContain(unsubscribeUrl.replace('&', '&amp;'));
    expect(template.text).toContain(confirmationUrl);
    expect(template.text).toContain(unsubscribeUrl);
  });

  it('escapa parâmetros de URL no HTML', () => {
    const template = newsletterConfirmationEmailTemplate(
      'https://example.com/confirm?token=a&source=<email>',
      'https://example.com/unsubscribe?token=b&source=<email>',
    );

    expect(template.html).not.toContain('<email>');
    expect(template.html).toContain('&amp;source=&lt;email&gt;');
  });
});
