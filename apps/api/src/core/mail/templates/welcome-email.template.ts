import { emailCtaButton, vavitoEmailHtml } from '@api/core/mail/templates/vavito-email.template';

export interface WelcomeEmailTemplate {
  html: string;
  subject: string;
  text: string;
}

export function welcomeEmailTemplate(siteUrl: string): WelcomeEmailTemplate {
  return {
    html: vavitoEmailHtml({
      bodyHtml: `<header style="margin-bottom:28px;text-align:center;">
        <p style="color:#0369a1;font-size:12px;font-weight:700;letter-spacing:0.16em;margin:0 0 10px;text-transform:uppercase;">Boas-vindas</p>
        <h1 class="email-title" style="color:#18191b;font-size:36px;letter-spacing:-0.025em;line-height:1.15;margin:0 0 12px;">Sua conta está pronta</h1>
        <p style="color:#71717a;font-size:18px;line-height:1.6;margin:0;">Bem-vindo ao Vavito Archives.</p>
      </header>
      <div style="border-top:1px solid #e4e4e7;color:#3f3f46;font-size:16px;line-height:1.7;padding-top:26px;">
        <p style="margin:0 0 16px;">Seu e-mail foi confirmado e você já pode acompanhar os artigos, participar das conversas e guardar suas leituras favoritas.</p>
        <p style="margin:0 0 28px;">Novas ideias sobre código, produto e aprendizado também chegarão à sua caixa de entrada.</p>
        ${emailCtaButton('Começar a explorar', siteUrl)}
      </div>`,
      previewText: 'Sua conta no Vavito Archives está pronta',
      siteUrl,
    }),
    subject: 'Bem-vindo ao Vavito Archives',
    text: `Sua conta está pronta\n\nBem-vindo ao Vavito Archives. Seu e-mail foi confirmado e você já pode acompanhar os artigos, participar das conversas e guardar suas leituras favoritas.\n\nComeçar a explorar: ${siteUrl}`,
  };
}
