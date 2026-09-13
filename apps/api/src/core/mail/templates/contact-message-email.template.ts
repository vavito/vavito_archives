import type { ContactMessageNotification } from '@api/core/mail/services/mail.service';
import {
  emailTextWithBreaks,
  escapeEmailHtml,
  vavitoEmailHtml,
} from '@api/core/mail/templates/vavito-email.template';

export interface ContactMessageEmailTemplate {
  html: string;
  subject: string;
  text: string;
}

export function contactMessageEmailTemplate(
  notification: ContactMessageNotification,
  siteUrl: string,
): ContactMessageEmailTemplate {
  const subject = `Novo contato: ${notification.subject}`;

  return {
    html: vavitoEmailHtml({
      bodyHtml: `<header style="margin-bottom:30px;">
        <p style="color:#0369a1;font-size:12px;font-weight:700;letter-spacing:0.16em;margin:0 0 10px;text-transform:uppercase;">Contato</p>
        <h1 class="email-title" style="color:#18191b;font-size:36px;letter-spacing:-0.025em;line-height:1.15;margin:0 0 12px;">Nova mensagem de contato</h1>
        <p style="color:#71717a;font-size:17px;line-height:1.55;margin:0;">Uma nova mensagem chegou pelo site.</p>
      </header>
      <div style="border-top:1px solid #e4e4e7;padding-top:24px;">
        <p style="color:#71717a;font-size:13px;line-height:1.5;margin:0 0 8px;"><strong style="color:#3f3f46;">Nome:</strong> ${escapeEmailHtml(notification.name)}</p>
        <p style="color:#71717a;font-size:13px;line-height:1.5;margin:0 0 18px;"><strong style="color:#3f3f46;">Assunto:</strong> ${escapeEmailHtml(notification.subject)}</p>
        <div style="background:#f4f4f5;border-radius:12px;color:#3f3f46;font-size:16px;line-height:1.65;padding:20px 22px;">${emailTextWithBreaks(notification.message)}</div>
        <p style="color:#52525b;font-size:14px;line-height:1.6;margin:22px 0 0;">Responda diretamente a este e-mail para falar com o visitante.</p>
      </div>`,
      previewText: `Nova mensagem: ${notification.subject}`,
      siteUrl,
    }),
    subject,
    text: `Nova mensagem de contato\n\nNome: ${notification.name}\nAssunto: ${notification.subject}\n\n${notification.message}\n\nResponda diretamente a este e-mail para falar com o visitante.`,
  };
}
