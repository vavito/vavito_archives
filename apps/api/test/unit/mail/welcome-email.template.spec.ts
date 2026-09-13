import { welcomeEmailTemplate } from '@api/core/mail/templates/welcome-email.template';

describe('welcomeEmailTemplate', () => {
  it('apresenta as boas-vindas com CTA e identidade do Vavito', () => {
    const template = welcomeEmailTemplate('https://vavitoarchives.com.br');

    expect(template.subject).toBe('Bem-vindo ao Vavito Archives');
    expect(template.html).toContain('Sua conta está pronta');
    expect(template.html).toContain('Começar a explorar');
    expect(template.html).toContain('/brand/vavito-symbol.png');
    expect(template.text).toContain('https://vavitoarchives.com.br');
  });
});
