import { NEW_COMMENT_EXCERPT_MAX_LENGTH } from '@api/core/mail/mail.constants';
import { newCommentEmailTemplate } from '@api/core/mail/templates/new-comment-email.template';

describe('newCommentEmailTemplate', () => {
  it('escapa conteúdo controlado pelo leitor e inclui o link de moderação', () => {
    const template = newCommentEmailTemplate(
      {
        authorDisplayName: '<Leitor>',
        commentContent: '<script>alert("xss")</script>',
        commentId: 'comment-id',
        isReply: false,
        postTitle: 'Artigo & segurança',
      },
      'https://vavitoarchives.com.br/admin/comments',
    );

    expect(template.html).toContain('&lt;Leitor&gt;');
    expect(template.html).toContain('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
    expect(template.html).toContain('Artigo &amp; segurança');
    expect(template.html).toContain('https://vavitoarchives.com.br/admin/comments');
    expect(template.html).not.toContain('<script>');
  });

  it('limita o trecho sem cortar caracteres Unicode', () => {
    const template = newCommentEmailTemplate(
      {
        authorDisplayName: 'Leitor',
        commentContent: '😀'.repeat(NEW_COMMENT_EXCERPT_MAX_LENGTH + 1),
        commentId: 'comment-id',
        isReply: true,
        postTitle: 'Artigo',
      },
      'https://vavitoarchives.com.br/admin/comments',
    );

    expect(template.text).toContain(`${'😀'.repeat(NEW_COMMENT_EXCERPT_MAX_LENGTH)}…`);
    expect(template.subject).toBe('Nova resposta em Artigo');
  });
});
