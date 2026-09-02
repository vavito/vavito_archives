import { accountDeletionEmailTemplate } from '@api/core/mail/templates/account-deletion-email.template';

describe('accountDeletionEmailTemplate', () => {
  it('informa a exclusão com uma despedida amigável', () => {
    const template = accountDeletionEmailTemplate();

    expect(template.subject).toBe('Sua conta no Vavito Archives foi excluída');
    expect(template.html).toContain('Sentimos muito em ver você partir.');
    expect(template.text).toContain('seu acesso foi encerrado');
  });
});
