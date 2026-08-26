import type { ContactMessageNotification } from '@api/core/mail/services/mail.service';

export interface ContactMessageEmailTemplate {
  html: string;
  subject: string;
  text: string;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function htmlParagraphs(value: string): string {
  return escapeHtml(value).replaceAll(/\r?\n/g, '<br>');
}

export function contactMessageEmailTemplate(
  notification: ContactMessageNotification,
): ContactMessageEmailTemplate {
  const subject = `Novo contato: ${notification.subject}`;

  return {
    html: `<!doctype html>
<html lang="pt-BR">
  <body style="font-family: Arial, sans-serif; color: #1f2937; line-height: 1.5;">
    <h1 style="font-size: 20px;">Nova mensagem de contato</h1>
    <p><strong>Nome:</strong> ${escapeHtml(notification.name)}</p>
    <p><strong>Assunto:</strong> ${escapeHtml(notification.subject)}</p>
    <p><strong>Mensagem:</strong><br>${htmlParagraphs(notification.message)}</p>
    <p>Responda diretamente a este e-mail para falar com o visitante.</p>
  </body>
</html>`,
    subject,
    text: `Nova mensagem de contato\n\nNome: ${notification.name}\nAssunto: ${notification.subject}\n\n${notification.message}\n\nResponda diretamente a este e-mail para falar com o visitante.`,
  };
}
