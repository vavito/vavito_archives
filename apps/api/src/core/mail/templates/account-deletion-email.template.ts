export interface AccountDeletionEmailTemplate {
  html: string;
  subject: string;
  text: string;
}

export function accountDeletionEmailTemplate(): AccountDeletionEmailTemplate {
  return {
    html: `<!doctype html>
<html lang="pt-BR">
  <body style="font-family: Arial, sans-serif; color: #1f2937; line-height: 1.5;">
    <h1 style="font-size: 20px;">Sua conta foi excluída</h1>
    <p>Sentimos muito em ver você partir.</p>
    <p>Sua conta no Vavito Archives foi excluída e seu acesso foi encerrado.</p>
    <p>Obrigado pelo tempo que passou com a gente. Se quiser voltar no futuro, será muito bem-vindo.</p>
  </body>
</html>`,
    subject: 'Sua conta no Vavito Archives foi excluída',
    text: 'Sua conta foi excluída\n\nSentimos muito em ver você partir. Sua conta no Vavito Archives foi excluída e seu acesso foi encerrado.\n\nObrigado pelo tempo que passou com a gente. Se quiser voltar no futuro, será muito bem-vindo.',
  };
}
