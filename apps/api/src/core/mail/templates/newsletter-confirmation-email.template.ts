export interface NewsletterConfirmationEmailTemplate {
  html: string;
  subject: string;
  text: string;
}

export function newsletterConfirmationEmailTemplate(
  confirmationUrl: string,
  unsubscribeUrl: string,
  siteUrl: string,
): NewsletterConfirmationEmailTemplate {
  return {
    html: vavitoEmailHtml({
      bodyHtml: `<header style="margin-bottom:28px;text-align:center;">
        <p style="color:#0369a1;font-size:12px;font-weight:700;letter-spacing:0.16em;margin:0 0 10px;text-transform:uppercase;">Newsletter</p>
        <h1 class="email-title" style="color:#18191b;font-size:36px;letter-spacing:-0.025em;line-height:1.15;margin:0 0 12px;">Confirme sua inscrição</h1>
        <p style="color:#71717a;font-size:18px;line-height:1.6;margin:0;">Você solicitou receber novos artigos do Vavito Archives.</p>
      </header>
      <div style="border-top:1px solid #e4e4e7;padding-top:28px;text-align:center;">
        ${emailCtaButton('Confirmar inscrição', confirmationUrl)}
        <p style="color:#71717a;font-size:13px;line-height:1.6;margin:24px 0 0;">Se não reconhece esta solicitação, ignore este email ou <a href="${escapeEmailHtml(unsubscribeUrl)}" style="color:#52525b;text-decoration:underline;">cancele a inscrição</a>.</p>
      </div>`,
      previewText: 'Confirme sua inscrição no Vavito Archives',
      siteUrl,
    }),
    subject: 'Confirme sua inscrição no Vavito Archives',
    text: `Confirme sua inscrição no Vavito Archives\n\nConfirmar: ${confirmationUrl}\n\nSe não reconhece esta solicitação, ignore este email ou cancele: ${unsubscribeUrl}`,
  };
}
import {
  emailCtaButton,
  escapeEmailHtml,
  vavitoEmailHtml,
} from '@api/core/mail/templates/vavito-email.template';
