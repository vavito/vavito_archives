export interface AccountDeletionEmailTemplate {
  html: string;
  subject: string;
  text: string;
}

export function accountDeletionEmailTemplate(siteUrl: string): AccountDeletionEmailTemplate {
  return {
    html: vavitoEmailHtml({
      bodyHtml: `<header style="margin-bottom:28px;">
        <p style="color:#0369a1;font-size:12px;font-weight:700;letter-spacing:0.16em;margin:0 0 10px;text-transform:uppercase;">Sua conta</p>
        <h1 class="email-title" style="color:#18191b;font-size:36px;letter-spacing:-0.025em;line-height:1.15;margin:0 0 12px;">Sua conta foi excluída</h1>
        <p style="color:#71717a;font-size:18px;line-height:1.6;margin:0;">Sentimos muito em ver você partir.</p>
      </header>
      <div style="border-top:1px solid #e4e4e7;color:#3f3f46;font-size:16px;line-height:1.7;padding-top:26px;">
        <p style="margin:0 0 16px;">Sua conta no Vavito Archives foi excluída e seu acesso foi encerrado.</p>
        <p style="margin:0 0 28px;">Obrigado pelo tempo que passou com a gente. Se quiser voltar no futuro, será muito bem-vindo.</p>
        ${emailCtaButton('Visitar o Vavito Archives', siteUrl)}
      </div>`,
      previewText: 'Sua conta no Vavito Archives foi excluída',
      siteUrl,
    }),
    subject: 'Sua conta no Vavito Archives foi excluída',
    text: 'Sua conta foi excluída\n\nSentimos muito em ver você partir. Sua conta no Vavito Archives foi excluída e seu acesso foi encerrado.\n\nObrigado pelo tempo que passou com a gente. Se quiser voltar no futuro, será muito bem-vindo.',
  };
}
import { emailCtaButton, vavitoEmailHtml } from '@api/core/mail/templates/vavito-email.template';
