export interface NewsletterConfirmationEmailTemplate {
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

export function newsletterConfirmationEmailTemplate(
  confirmationUrl: string,
  unsubscribeUrl: string,
): NewsletterConfirmationEmailTemplate {
  return {
    html: `<!doctype html>
<html lang="pt-BR">
  <body style="font-family: Arial, sans-serif; color: #1f2937; line-height: 1.5;">
    <h1 style="font-size: 20px;">Confirme sua inscrição</h1>
    <p>Você solicitou receber novos artigos do Vavito Archives.</p>
    <p><a href="${escapeHtml(confirmationUrl)}">Confirmar inscrição</a></p>
    <p>Se não reconhece esta solicitação, ignore este email ou <a href="${escapeHtml(unsubscribeUrl)}">cancele a inscrição</a>.</p>
  </body>
</html>`,
    subject: 'Confirme sua inscrição no Vavito Archives',
    text: `Confirme sua inscrição no Vavito Archives\n\nConfirmar: ${confirmationUrl}\n\nSe não reconhece esta solicitação, ignore este email ou cancele: ${unsubscribeUrl}`,
  };
}
