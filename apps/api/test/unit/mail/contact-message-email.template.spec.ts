import { contactMessageEmailTemplate } from '@api/core/mail/templates/contact-message-email.template';

describe('contactMessageEmailTemplate', () => {
  it('escapa dados externos e não inclui o email do visitante no conteúdo', () => {
    const template = contactMessageEmailTemplate({
      contactMessageId: '49d6cdaa-a5f5-4716-9b27-39006338557b',
      message: '<script>alert("x")</script>\nSegunda linha',
      name: '<Leitor>',
      replyTo: 'leitor@example.com',
      subject: 'Sugestão & dúvida',
    });

    expect(template.subject).toBe('Novo contato: Sugestão & dúvida');
    expect(template.html).toContain('&lt;Leitor&gt;');
    expect(template.html).toContain(
      '&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;<br>Segunda linha',
    );
    expect(template.html).not.toContain('<script>');
    expect(template.html).not.toContain('leitor@example.com');
    expect(template.text).not.toContain('leitor@example.com');
  });
});
